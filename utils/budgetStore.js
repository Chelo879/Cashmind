/**
 * utils/budgetStore.js
 * Estado compartido del presupuesto entre Perfil y Reportes.
 * Solución simple sin Context ni Firebase — un módulo singleton con listeners.
 * Cuando se integre Firebase, solo se reemplaza este archivo.
 */

import { mockUser } from '../constants/mockData';

let _budget = mockUser.monthlyBudget;
const _listeners = new Set();

export function getBudget() {
  return _budget;
}

export function setBudget(value) {
  _budget = value;
  _listeners.forEach((fn) => fn(value));
}

export function useBudget() {
  const [budget, setBudgetState] = require('react').useState(_budget);

  require('react').useEffect(() => {
    const listener = (val) => setBudgetState(val);
    _listeners.add(listener);
    return () => _listeners.delete(listener);
  }, []);

  return [budget, setBudget];
}
