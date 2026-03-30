/**
 * utils/optimizer.js
 * Motor de optimización de pagos de deudas.
 *
 * Modelo Simplex: Min Z = Σ(CATi · xi)
 * Restricciones:
 *   Σxi ≤ P          (presupuesto)
 *   xi ≥ mi          (pago mínimo)
 *   xi ≤ Si          (límite de saldo)
 *
 * Modelo Gran M (modo crisis):
 *   Min Z = Σ(CATi · xi) + M · Σ(Ai)
 *   Cuando P < Σmi → no alcanza para todos los mínimos
 */

const MONTHS_ES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Calcula el interés mensual generado por una deuda.
 * Fórmula: saldo × (CAT / 12 / 100)
 */
export function monthlyInterest(balance, cat) {
  return balance * (cat / 12 / 100);
}

/**
 * Verifica si el presupuesto cubre todos los pagos mínimos.
 */
export function canCoverMinimums(debts, budget) {
  const totalMin = debts.reduce((s, d) => s + (d.minPayment || 0), 0);
  return budget >= totalMin;
}

// ─── Simplex Mode ─────────────────────────────────────────────────────────────

/**
 * Distribuye el presupuesto entre las deudas usando el modelo Simplex.
 * Estrategia: pagar mínimos primero, luego destinar el excedente
 * a la deuda con CAT más alto (avalanche method = óptimo para minimizar intereses).
 *
 * @param {Array}  debts   Array de deudas activas con { id, label, balance, cat, minPayment, penalty }
 * @param {number} budget  Presupuesto mensual disponible (P)
 * @returns {Array} Array de { debtId, label, payment, interest, newBalance, isMinOnly }
 */
export function simplexDistribute(debts, budget) {
  // Trabajar solo con deudas que tienen saldo pendiente
  const active = debts.filter((d) => d.balance > 0);
  if (active.length === 0) return [];

  const results = active.map((d) => ({
    debtId:     d.id,
    label:      d.label,
    cat:        d.cat,
    minPayment: Math.min(d.minPayment || 0, d.balance),
    balance:    d.balance,
    payment:    0,
    interest:   monthlyInterest(d.balance, d.cat),
    newBalance: d.balance,
    isMinOnly:  false,
    color:      d.color,
  }));

  // Paso 1: asignar mínimos a todos
  let remaining = budget;
  for (const r of results) {
    r.payment  = r.minPayment;
    remaining -= r.minPayment;
  }

  // Paso 2: distribuir excedente a la deuda con CAT más alto
  if (remaining > 0) {
    const sorted = [...results].sort((a, b) => b.cat - a.cat);
    for (const r of sorted) {
      if (remaining <= 0) break;
      const maxExtra = r.balance - r.payment;
      const extra    = Math.min(remaining, maxExtra);
      r.payment  += extra;
      remaining  -= extra;
    }
  }

  // Paso 3: calcular nuevos saldos
  for (const r of results) {
    const interest  = monthlyInterest(r.balance, r.cat);
    r.interest      = interest;
    r.newBalance    = Math.max(0, r.balance + interest - r.payment);
    r.isMinOnly     = Math.abs(r.payment - r.minPayment) < 0.01;
  }

  return results;
}

// ─── Gran M Mode (Crisis) ─────────────────────────────────────────────────────

/**
 * Modo crisis: presupuesto insuficiente para cubrir todos los mínimos.
 * Estrategia Gran M: sacrificar la deuda con penalización (M) más pequeña.
 * Paga mínimos a todas las demás con el presupuesto disponible.
 *
 * @param {Array}  debts   Deudas activas
 * @param {number} budget  Presupuesto disponible
 * @returns {Object} { payments, sacrificedDebt, warning }
 */
export function grandMDistribute(debts, budget) {
  const active = debts.filter((d) => d.balance > 0);

  // Ordenar por penalización ascendente → sacrificar la de menor M primero
  const sorted = [...active].sort((a, b) => (a.penalty || 0) - (b.penalty || 0));

  let remaining    = budget;
  let sacrificed   = null;
  const payments   = [];

  for (const d of sorted) {
    const minP = Math.min(d.minPayment || 0, d.balance);
    if (remaining >= minP) {
      payments.push({
        debtId:    d.id,
        label:     d.label,
        cat:       d.cat,
        payment:   minP,
        interest:  monthlyInterest(d.balance, d.cat),
        newBalance: Math.max(0, d.balance + monthlyInterest(d.balance, d.cat) - minP),
        isMinOnly:  true,
        sacrificed: false,
        color:      d.color,
      });
      remaining -= minP;
    } else {
      // Esta deuda se sacrifica
      sacrificed = d;
      const interest = monthlyInterest(d.balance, d.cat);
      payments.push({
        debtId:     d.id,
        label:      d.label,
        cat:        d.cat,
        payment:    0,
        interest,
        newBalance: d.balance + interest + (d.penalty || 0),
        isMinOnly:  false,
        sacrificed: true,
        color:      d.color,
      });
    }
  }

  return {
    payments,
    sacrificedDebt: sacrificed,
    warning: `Tu presupuesto actual no cubre los pagos mínimos obligatorios. Se recomienda no pagar "${sacrificed?.label}" este mes para minimizar penalizaciones.`,
  };
}

// ─── Monthly Projection ───────────────────────────────────────────────────────

/**
 * Genera la proyección mes a mes hasta liquidar todas las deudas.
 * Máximo 120 meses (10 años) para evitar bucles infinitos.
 *
 * @param {Array}  initialDebts  Deudas con { id, label, balance, cat, minPayment, penalty, color }
 * @param {number} budget        Presupuesto mensual (P)
 * @returns {Object} { months, totalInterestPaid, totalMonths, isCrisis }
 */
export function generateProjection(initialDebts, budget) {
  const MAX_MONTHS = 120;
  const projection = [];

  // Estado mutable de saldos
  let debts = initialDebts
    .filter((d) => d.balance > 0)
    .map((d) => ({ ...d }));

  let totalInterestPaid = 0;
  let totalPaid         = 0;
  let isCrisis          = false;
  const now             = new Date();

  for (let m = 0; m < MAX_MONTHS; m++) {
    if (debts.every((d) => d.balance <= 0)) break;

    const crisis    = !canCoverMinimums(debts, budget);
    if (crisis) isCrisis = true;

    const result    = crisis
      ? grandMDistribute(debts, budget)
      : { payments: simplexDistribute(debts, budget), sacrificedDebt: null, warning: null };

    const payments  = result.payments ?? result;
    const monthDate = new Date(now.getFullYear(), now.getMonth() + m, 1);
    const label     = `${MONTHS_ES[monthDate.getMonth()]} ${monthDate.getFullYear()}`;

    const monthInterest = payments.reduce((s, p) => s + (p.interest || 0), 0);
    const monthPaid     = payments.reduce((s, p) => s + (p.payment  || 0), 0);

    totalInterestPaid += monthInterest;
    totalPaid         += monthPaid;

    projection.push({
      month:          m + 1,
      label,
      payments,
      totalPaid:      monthPaid,
      totalInterest:  monthInterest,
      remainingDebt:  payments.reduce((s, p) => s + p.newBalance, 0),
      isCrisis:       crisis,
      warning:        result.warning ?? null,
      sacrificedDebt: result.sacrificedDebt ?? null,
    });

    // Actualizar saldos para el siguiente mes
    debts = debts.map((d) => {
      const p = payments.find((x) => x.debtId === d.id);
      return { ...d, balance: p ? Math.max(0, p.newBalance) : d.balance };
    }).filter((d) => d.balance > 0.01);
  }

  return {
    months:            projection,
    totalMonths:       projection.length,
    totalInterestPaid,
    totalPaid,
    isCrisis,
  };
}
