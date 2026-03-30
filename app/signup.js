import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, FONTS, RADIUS, SPACING } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '../utils/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';

export default function SignUpScreen() {
  const router = useRouter();
  const [name,            setName]            = useState('');
  const [email,           setEmail]           = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass,        setShowPass]        = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [error,           setError]           = useState('');
  const [loading,         setLoading]         = useState(false);

  const handleSignUp = async () => {
    setError('');
    if (!name.trim())               return setError('Ingresa tu nombre');
    if (!email.trim())              return setError('Ingresa tu correo');
    if (password.length < 6)        return setError('La contraseña debe tener al menos 6 caracteres');
    if (password !== confirmPassword) return setError('Las contraseñas no coinciden');

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(userCredential.user, {
        displayName: name.trim()
      });

      // Guardar datos en Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        uid: userCredential.user.uid,
        name: name.trim(),
        email: email.trim(),
        createdAt: new Date(),
        balance: 0,
        currency: 'MXN',
        monthlyBudget: 0,
        firstRunDone: false,
        memberSince: new Date().toLocaleDateString('es-MX', { month: 'long', year: 'numeric' }),
      });

      router.replace('/firstrun');
    } catch (err) {
      setError(err.message || 'Error al crear la cuenta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      enabled={Platform.OS === 'ios'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name='chevron-back' size={22} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Crear cuenta</Text>
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          <Text style={styles.title}>Únete a Cashmind</Text>
          <Text style={styles.subtitle}>Crea tu cuenta para comenzar a optimizar tus finanzas</Text>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="warning-outline" size={14} color="#EF4444" />
              <Text style={styles.errorTxt}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              placeholder="Nombre completo"
              placeholderTextColor={COLORS.textMuted}
              value={name}
              onChangeText={setName}
              editable={!loading}
            />
          </View>

          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              placeholder="Correo electrónico"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              editable={!loading}
            />
          </View>

          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              placeholder="Contraseña"
              placeholderTextColor={COLORS.textMuted}
              secureTextEntry={!showPass}
              value={password}
              onChangeText={setPassword}
              editable={!loading}
            />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPass(!showPass)} disabled={loading}>
              <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              placeholder="Confirmar contraseña"
              placeholderTextColor={COLORS.textMuted}
              secureTextEntry={!showConfirm}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              editable={!loading}
            />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowConfirm(!showConfirm)} disabled={loading}>
              <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]} 
            onPress={handleSignUp} 
            activeOpacity={0.85}
            disabled={loading}
          >
            <Text style={styles.primaryBtnTxt}>{loading ? 'Creando cuenta...' : 'Crear cuenta'}</Text>
          </TouchableOpacity>

          <View style={styles.loginRow}>
            <Text style={styles.loginTxt}>¿Ya tienes cuenta? </Text>
            <TouchableOpacity onPress={() => router.back()} disabled={loading}>
              <Text style={styles.loginLink}>Inicia sesión</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.background },
  scrollContent:{ flexGrow: 1, paddingVertical: 20 },

  header:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.xl, paddingTop: 16, paddingBottom: 8, gap: SPACING.md },
  backBtn:      { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.cardBg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.cardBorder },
  headerTitle:  { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary },

  formContainer:{ paddingHorizontal: SPACING.xl * 1.2, marginTop: SPACING.lg, marginBottom: 40 },
  title:        { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.sm },
  subtitle:     { fontSize: FONTS.sm, color: COLORS.textMuted, marginBottom: SPACING.xl, lineHeight: 20 },

  errorBox:     { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
  errorTxt:     { fontSize: FONTS.sm, color: '#EF4444' },

  inputWrap:    { position: 'relative', marginBottom: SPACING.md },
  input: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.cardBorder,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 14,
    fontSize: FONTS.base,
    color: COLORS.textPrimary,
  },
  eyeBtn:       { position: 'absolute', right: 14, top: 14 },

  primaryBtn:   { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, paddingVertical: 14, alignItems: 'center', marginTop: SPACING.sm },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnTxt:{ color: COLORS.white, fontSize: FONTS.md, fontWeight: '700' },

  loginRow:     { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: SPACING.xl },
  loginTxt:     { fontSize: FONTS.sm, color: COLORS.textMuted },
  loginLink:    { fontSize: FONTS.sm, color: COLORS.primary, fontWeight: '700', textDecorationLine: 'underline' },
});