/**
 * utils/authStore.js
 * Autenticación reactiva conectada a Firebase Auth + Firestore.
 * onAuthStateChanged es la única fuente de verdad para el estado de sesión.
 */
import { useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signOut as firebaseSignOut,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, onSnapshot, deleteDoc } from 'firebase/firestore';
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

/** Enviar correo de recuperación de contraseña */
export async function resetPassword(emailAddress) {
  if (!emailAddress) throw new Error('El correo electrónico es requerido');
  await sendPasswordResetEmail(auth, emailAddress);
}

/** Re-autenticar al usuario para operaciones sensibles */
async function reauthenticate(password) {
  const user = auth.currentUser;
  if (!user) throw new Error('No hay usuario autenticado');
  const credential = EmailAuthProvider.credential(user.email, password);
  await reauthenticateWithCredential(user, credential);
}

/** Cambiar contraseña */
export async function changeUserPassword(currentPassword, newPassword) {
  await reauthenticate(currentPassword);
  await updatePassword(auth.currentUser, newPassword);
}

/** Eliminar cuenta */
export async function deleteAccount(password) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('No hay usuario autenticado');
  
  await reauthenticate(password);
  
  // Borrar datos de Firestore primero (opcional, pero recomendado)
  await deleteDoc(doc(db, 'users', uid));
  
  // Borrar usuario de Auth
  await deleteUser(auth.currentUser);
}

/** Cambiar nombre */
export async function updateUserName(newName) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('No hay usuario autenticado');
  
  const { updateDoc, doc } = await import('firebase/firestore');
  await updateDoc(doc(db, 'users', uid), {
    name: newName
  });
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
