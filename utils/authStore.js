/**
 * utils/authStore.js
 * Autenticación reactiva conectada a Firebase Auth + Firestore.
 * onAuthStateChanged es la única fuente de verdad para el estado de sesión.
 */
import { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './firebase';

let _isLoggedIn   = false;
let _firstRunDone = false;
let _loading      = true;
let _user         = { uid: '', name: '', email: '', memberSince: '' };

const _listeners = new Set();
function notificar() { _listeners.forEach((fn) => fn()); }

let _unsubUserDoc = null;

// Escuchar cambios de sesión de Firebase Auth
onAuthStateChanged(auth, (firebaseUser) => {
  if (_unsubUserDoc) { _unsubUserDoc(); _unsubUserDoc = null; }

  if (firebaseUser) {
    // Escuchar el documento del usuario en Firestore en tiempo real
    _unsubUserDoc = onSnapshot(doc(db, 'users', firebaseUser.uid), (snap) => {
      const data = snap.exists() ? snap.data() : {};
      _isLoggedIn   = true;
      _firstRunDone = data.firstRunDone ?? false;
      _user = {
        uid:         firebaseUser.uid,
        name:        data.name        ?? firebaseUser.displayName ?? '',
        email:       data.email       ?? firebaseUser.email       ?? '',
        memberSince: data.memberSince ?? '',
      };
      _loading = false;
      notificar();
    });
  } else {
    _isLoggedIn   = false;
    _firstRunDone = false;
    _loading      = false;
    _user         = { uid: '', name: '', email: '', memberSince: '' };
    notificar();
  }
});

// ─── Auth ─────────────────────────────────────────────────────────────────────
export async function logout() {
  await firebaseSignOut(auth);
}

// Mantenido por compatibilidad — firstRunDone se actualiza vía completarFirstRun en appStore
export function marcarFirstRunListo() {}

export function getUser()         { return _user; }
export function getFirstRunDone() { return _firstRunDone; }

// ─── Hook reactivo ────────────────────────────────────────────────────────────
export function useAuth() {
  const [state, setState] = useState({
    isLoggedIn:   _isLoggedIn,
    firstRunDone: _firstRunDone,
    loading:      _loading,
    user:         _user,
  });

  useEffect(() => {
    const listener = () => setState({
      isLoggedIn:   _isLoggedIn,
      firstRunDone: _firstRunDone,
      loading:      _loading,
      user:         _user,
    });
    _listeners.add(listener);
    return () => _listeners.delete(listener);
  }, []);

  return state;
}
