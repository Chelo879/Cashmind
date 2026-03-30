/**
 * utils/businessDays.js
 * Utilidades para cálculo de días hábiles bancarios en México (reglas Banxico)
 */

// Días festivos fijos (mes es 0-indexed)
const FIXED_HOLIDAYS = [
  { month: 0,  day: 1  }, // Año Nuevo
  { month: 1,  day: 5  }, // Constitución
  { month: 2,  day: 21 }, // Natalicio Benito Juárez
  { month: 4,  day: 1  }, // Día del Trabajo
  { month: 8,  day: 16 }, // Independencia
  { month: 10, day: 2  }, // Día de Muertos (algunos bancos)
  { month: 10, day: 20 }, // Revolución Mexicana
  { month: 11, day: 12 }, // Virgen de Guadalupe (algunos bancos)
  { month: 11, day: 25 }, // Navidad
];

/**
 * Calcula Semana Santa (Jueves y Viernes Santo) para un año dado.
 * Algoritmo de Meeus/Jones/Butcher.
 */
function getHolySanta(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1; // 0-indexed
  const day   = ((h + l - 7 * m + 114) % 31) + 1;

  const easter  = new Date(year, month, day);
  const thursday = new Date(year, month, day - 3); // Jueves Santo
  const friday   = new Date(year, month, day - 2); // Viernes Santo
  return [thursday, friday];
}

/**
 * Verifica si una fecha es día festivo oficial en México.
 */
function isMexicanHoliday(date) {
  const year  = date.getFullYear();
  const month = date.getMonth();
  const day   = date.getDate();

  // Fijos
  const isFixed = FIXED_HOLIDAYS.some((h) => h.month === month && h.day === day);
  if (isFixed) return true;

  // Semana Santa
  const [thursday, friday] = getHolySanta(year);
  if (
    (date.getMonth() === thursday.getMonth() && date.getDate() === thursday.getDate()) ||
    (date.getMonth() === friday.getMonth()   && date.getDate() === friday.getDate())
  ) return true;

  return false;
}

/**
 * Verifica si una fecha es día hábil bancario.
 */
export function isBusinessDay(date) {
  const dow = date.getDay(); // 0=Dom, 6=Sab
  if (dow === 0 || dow === 6) return false;
  if (isMexicanHoliday(date)) return false;
  return true;
}

/**
 * Dado una fecha, si es inhábil la recorre al siguiente día hábil.
 */
export function nextBusinessDay(date) {
  const d = new Date(date);
  while (!isBusinessDay(d)) {
    d.setDate(d.getDate() + 1);
  }
  return d;
}

/**
 * Calcula la fecha límite de pago de tarjeta de crédito.
 * Regla Banxico: fecha de corte + 20 días naturales,
 * si cae en inhábil → siguiente día hábil.
 */
export function calcPaymentDeadline(cutDate) {
  const deadline = new Date(cutDate);
  deadline.setDate(deadline.getDate() + 20);
  return nextBusinessDay(deadline);
}

/**
 * Formatea una fecha como "DD MMM YYYY" en español.
 */
const MONTHS_ES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

export function formatDate(date) {
  return `${date.getDate()} ${MONTHS_ES[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatDateShort(date) {
  return `${date.getDate()} ${MONTHS_ES[date.getMonth()]}`;
}

export { MONTHS_ES };
