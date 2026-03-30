// ─── User ─────────────────────────────────────────────────────────────────────
export const mockUser = {
  id: '1',
  name: 'Carlos',
  email: 'carlos@cashmind.mx',
  memberSince: 'Enero 2025',
  avatar: null,
  monthlyBudget: 8500, // P — presupuesto mensual disponible
};

// ─── Debts ────────────────────────────────────────────────────────────────────
// Diseñados para que:
//   d1 (TDC Banamex)   → CAT alto, muestra fecha de corte y límite de crédito
//   d2 (TDC BBVA)      → saldo > límite → activa alerta de sobregiro
//   d3 (Préstamo auto) → periodicidad quincenal, fecha de primer pago
//   d4 (Hipoteca)      → crédito largo plazo, pagos mensuales
//   d5 (Préstamo pers) → pago mínimo alto → junto con d4 activan MODO CRISIS
//     porque: sum(minPayments) = 1500+800+2400+3500+2200 = 10400 > budget 8500

export const mockDebts = [
  {
    id: 'd1',
    label: 'Tarjeta Banamex',
    categoryKey: 'credit_card',
    category: 'Tarjeta de crédito',
    totalAmount: 18500,     // saldo actual
    paidAmount: 4500,
    creditLimit: 20000,     // límite autorizado
    cat: 42,                // CAT % anual — más alto → Simplex lo ataca primero
    minPayment: 925,        // 5% del saldo pendiente
    penalty: 370,           // penalización por no pagar
    cutDate: '2026-03-08',  // fecha de corte → límite de pago = 28 Mar (+ 20 días)
    dueDateLabel: '28 Mar',
    interestRate: 42,
    color: '#6366F1',
  },
  {
    id: 'd2',
    label: 'Tarjeta BBVA Azul',
    categoryKey: 'credit_card',
    category: 'Tarjeta de crédito',
    totalAmount: 22400,     // saldo actual
    paidAmount: 0,
    creditLimit: 20000,     // saldo > límite → SOBREGIRO
    cat: 36,
    minPayment: 1120,
    penalty: 560,
    cutDate: '2026-03-15',
    dueDateLabel: '4 Abr',
    interestRate: 36,
    color: '#818CF8',
  },
  {
    id: 'd3',
    label: 'Credito Auto Nissan',
    categoryKey: 'auto',
    category: 'Credito automotriz',
    totalAmount: 145000,
    paidAmount: 38000,
    cat: 18,
    minPayment: 2400,       // pago quincenal × 2
    penalty: 800,
    periodicity: 'biweekly15',
    paymentsTotal: 48,
    firstPayDate: '2024-01-01',
    dueDateLabel: '1 de cada mes',
    interestRate: 18,
    color: '#A5B4FC',
  },
  {
    id: 'd4',
    label: 'Hipoteca Infonavit',
    categoryKey: 'mortgage',
    category: 'Hipoteca',
    totalAmount: 520000,
    paidAmount: 95000,
    cat: 10,
    minPayment: 3500,
    penalty: 1200,
    periodicity: 'monthly',
    paymentsTotal: 240,
    firstPayDate: '2022-06-01',
    dueDateLabel: '1 de cada mes',
    interestRate: 10,
    color: '#C7D2FE',
  },
  {
    id: 'd5',
    label: 'Prestamo Personal HSBC',
    categoryKey: 'personal',
    category: 'Prestamo personal',
    totalAmount: 35000,
    paidAmount: 8000,
    cat: 28,
    minPayment: 2200,       // este + los anteriores = 10145 > budget 8500 → CRISIS
    penalty: 440,
    periodicity: 'monthly',
    paymentsTotal: 24,
    firstPayDate: '2025-09-01',
    dueDateLabel: '1 de cada mes',
    interestRate: 28,
    color: '#E0E7FF',
  },
];

// ─── Savings ──────────────────────────────────────────────────────────────────
// Diseñados para mostrar:
//   s1 → plazo en meses + depósito mensual sugerido calculado
//   s2 → plazo en meses largo plazo
//   s3 → sin plazo, solo fecha objetivo
//   s4 → casi completado (95%)

export const mockSavings = [
  {
    id: 's1',
    label: 'Fondo de emergencia',
    saved: 3200,
    goal: 15000,
    iconKey: 'shield',
    targetDate: 'Sep 2026',
    months: 6,              // plazo en meses
    monthlyDeposit: 1966.67, // (15000 - 3200) / 6
    color: '#6366F1',
  },
  {
    id: 's2',
    label: 'Enganche depa',
    saved: 28000,
    goal: 120000,
    iconKey: 'home',
    targetDate: 'Dic 2028',
    months: 36,
    monthlyDeposit: 2555.56, // (120000 - 28000) / 36
    color: '#818CF8',
  },
  {
    id: 's3',
    label: 'Vacaciones Cancun',
    saved: 1800,
    goal: 8000,
    iconKey: 'airplane',
    targetDate: 'Jul 2026',
    months: null,           // sin plazo definido
    monthlyDeposit: null,
    color: '#A5B4FC',
  },
  {
    id: 's4',
    label: 'Laptop nueva',
    saved: 4750,
    goal: 5000,
    iconKey: 'laptop',
    targetDate: 'Mar 2026',
    months: 1,
    monthlyDeposit: 250,    // casi completado
    color: '#C7D2FE',
  },
];

// ─── Monthly Stats (Reportes → tab Estadísticas) ──────────────────────────────
export const mockMonthlyStats = [
  { month: 'Sep', paid: 6200,  saved: 2800 },
  { month: 'Oct', paid: 7100,  saved: 3200 },
  { month: 'Nov', paid: 5800,  saved: 1500 },
  { month: 'Dic', paid: 4200,  saved: 900  },
  { month: 'Ene', paid: 8100,  saved: 3800 },
  { month: 'Feb', paid: 8500,  saved: 4100 },
];

// ─── Summary (Home) ───────────────────────────────────────────────────────────
export const mockSummary = {
  totalDebt:    mockDebts.reduce((s, d) => s + (d.totalAmount - d.paidAmount), 0),
  totalSaved:   mockSavings.reduce((s, v) => s + v.saved, 0),
  monthlyGoal:  mockUser.monthlyBudget,
  monthlySaved: 8500,
};

// ─── Optimizer debts (formato para el motor Simplex) ─────────────────────────
// El ReportsScreen importa este array directamente para correr la proyección
export const optimizerDebts = mockDebts.map((d) => ({
  id:         d.id,
  label:      d.label,
  balance:    d.totalAmount - d.paidAmount,
  cat:        d.cat ?? d.interestRate,
  minPayment: d.minPayment,
  penalty:    d.penalty,
  color:      d.color,
}));
