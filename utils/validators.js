/**
 * utils/validators.js
 * Reglas de validación para los formularios de Cashmind.
 * Cada función regresa null si es válido o un string con el mensaje de error.
 */

const MAX_NAME_LENGTH = 40;

// ─── Básicas ──────────────────────────────────────────────────────────────────

/** Nombre: requerido + max caracteres */
export function validateName(value) {
  if (!value || value.trim().length === 0) return 'Este campo es requerido';
  if (value.trim().length > MAX_NAME_LENGTH)
    return `Máximo ${MAX_NAME_LENGTH} caracteres (${value.trim().length}/${MAX_NAME_LENGTH})`;
  return null;
}

/** Monto: requerido + positivo + no letras */
export function validateAmount(value, label = 'El monto') {
  if (!value || value.trim() === '') return 'Este campo es requerido';
  const n = parseFloat(value);
  if (isNaN(n)) return 'Ingresa solo números';
  if (n <= 0)   return `${label} debe ser mayor a $0`;
  return null;
}

/** Porcentaje: requerido + positivo + máximo */
export function validatePercent(value, max = 200, label = 'El porcentaje') {
  if (!value || value.trim() === '') return 'Este campo es requerido';
  const n = parseFloat(value);
  if (isNaN(n)) return 'Ingresa solo números';
  if (n <= 0)   return `${label} debe ser mayor a 0`;
  if (n > max)  return `${label} no puede superar ${max}%`;
  return null;
}

/** Entero positivo: requerido + entero + mínimo */
export function validateInteger(value, min = 1, label = 'El valor') {
  if (!value || value.trim() === '') return 'Este campo es requerido';
  const n = parseInt(value);
  if (isNaN(n) || String(n) !== value.trim()) return 'Ingresa un número entero';
  if (n < min) return `${label} debe ser al menos ${min}`;
  return null;
}

// ─── Lógica de negocio ────────────────────────────────────────────────────────

/** Pago mínimo no puede superar el saldo */
export function validateMinPayment(minPayment, balance) {
  const min = parseFloat(minPayment);
  const bal = parseFloat(balance);
  if (isNaN(min) || isNaN(bal)) return null; // ya validado por validateAmount
  if (min > bal) return 'El pago mínimo no puede superar el saldo actual';
  return null;
}

/** Fecha objetivo no puede ser en el pasado */
export function validateFutureDate(date) {
  if (!date) return 'Selecciona una fecha';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date < today) return 'La fecha objetivo no puede ser en el pasado';
  return null;
}

/** Plazo mínimo de 1 mes en ahorros */
export function validateMonths(value) {
  if (!value || value.trim() === '') return null; // es opcional
  const n = parseInt(value);
  if (isNaN(n) || n < 1) return 'El plazo mínimo es 1 mes';
  return null;
}

// ─── Helper: ¿tiene algún error? ─────────────────────────────────────────────
export function hasErrors(errorsObj) {
  return Object.values(errorsObj).some((e) => e !== null && e !== undefined);
}
