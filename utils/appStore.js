/**
 * utils/appStore.js
 * Estado global: presupuesto, deudas y ahorros — sincronizados con Firestore.
 * onAuthStateChanged decide qué usuario escuchar; onSnapshot mantiene la UI reactiva.
 */
import { useState, useEffect } from 'react';
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, writeBatch,
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './firebase';

let _budget  = 0;
let _debts   = [];
let _savings = [];
let _uid     = null;

let _unsubUserDoc = null;
let _unsubDebts   = null;
let _unsubSavings = null;

const _listeners = new Set();
function notificar() { _listeners.forEach((fn) => fn()); }

// Inicializar listeners según el estado de sesión
onAuthStateChanged(auth, (user) => {
  // Cancelar listeners anteriores
  if (_unsubUserDoc) { _unsubUserDoc(); _unsubUserDoc = null; }
  if (_unsubDebts)   { _unsubDebts();   _unsubDebts   = null; }
  if (_unsubSavings) { _unsubSavings(); _unsubSavings = null; }

  if (user) {
    _uid = user.uid;

    // Escuchar presupuesto mensual en el documento del usuario
    _unsubUserDoc = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      if (snap.exists()) {
        _budget = snap.data().monthlyBudget ?? 0;
        notificar();
      }
    });

    // Escuchar subcolección de deudas
    _unsubDebts = onSnapshot(collection(db, 'users', user.uid, 'debts'), (snap) => {
      _debts = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      notificar();
    });

    // Escuchar subcolección de ahorros
    _unsubSavings = onSnapshot(collection(db, 'users', user.uid, 'savings'), (snap) => {
      _savings = snap.docs.map((s) => ({ id: s.id, ...s.data() }));
      notificar();
    });
  } else {
    _uid     = null;
    _budget  = 0;
    _debts   = [];
    _savings = [];
    notificar();
  }
});

// ─── Getters ──────────────────────────────────────────────────────────────────
export function getBudget()  { return _budget;  }
export function getDebts()   { return _debts;   }
export function getSavings() { return _savings; }

// ─── First Run ────────────────────────────────────────────────────────────────
export async function completarFirstRun(budget, debts, savings) {
  if (!_uid) return;
  const batch = writeBatch(db);

  // Actualizar presupuesto y marcar first-run completo
  batch.update(doc(db, 'users', _uid), { monthlyBudget: budget, firstRunDone: true });

  // Agregar deudas iniciales
  for (const deuda of debts) {
    const { id, ...data } = deuda;
    batch.set(doc(collection(db, 'users', _uid, 'debts')), data);
  }

  // Agregar ahorros iniciales
  for (const ahorro of savings) {
    const { id, ...data } = ahorro;
    batch.set(doc(collection(db, 'users', _uid, 'savings')), data);
  }

  await batch.commit();
}

// ─── Presupuesto ──────────────────────────────────────────────────────────────
export async function setBudget(valor) {
  if (!_uid) return;
  await updateDoc(doc(db, 'users', _uid), { monthlyBudget: valor });
}

// ─── Deudas ───────────────────────────────────────────────────────────────────
export async function agregarDeuda(deuda) {
  if (!_uid) return;
  const { id, ...data } = deuda;
  await addDoc(collection(db, 'users', _uid, 'debts'), data);
}

export async function actualizarDeuda(id, cambios) {
  if (!_uid) return;
  await updateDoc(doc(db, 'users', _uid, 'debts', id), cambios);
}

export async function eliminarDeuda(id) {
  if (!_uid) return;
  await deleteDoc(doc(db, 'users', _uid, 'debts', id));
}

// ─── Ahorros ──────────────────────────────────────────────────────────────────
export async function agregarAhorro(ahorro) {
  if (!_uid) return;
  const { id, ...data } = ahorro;
  await addDoc(collection(db, 'users', _uid, 'savings'), data);
}

export async function actualizarAhorro(id, cambios) {
  if (!_uid) return;
  await updateDoc(doc(db, 'users', _uid, 'savings', id), cambios);
}

export async function eliminarAhorro(id) {
  if (!_uid) return;
  await deleteDoc(doc(db, 'users', _uid, 'savings', id));
}

// ─── Hook reactivo ────────────────────────────────────────────────────────────
export function useAppStore() {
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const listener = () => forceUpdate((n) => n + 1);
    _listeners.add(listener);
    return () => _listeners.delete(listener);
  }, []);
  return { budget: _budget, debts: _debts, savings: _savings };
}
