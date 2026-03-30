import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, FONTS, RADIUS, SPACING } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../utils/firebase';

export default function LoginScreen() {
  const router = useRouter();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleLogin = async () => {
    setError('');
    if (!email.trim())    return setError('Ingresa tu correo');
    if (!password.trim()) return setError('Ingresa tu contraseña');

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.replace('/');
    } catch (err) {
      const errorMessages = {
        'auth/user-not-found': 'El correo no está registrado',
        'auth/wrong-password': 'Contraseña incorrecta',
        'auth/invalid-email': 'Correo inválido',
        'auth/user-disabled': 'La cuenta ha sido deshabilitada',
      };
      setError(errorMessages[err.code] || 'Error al iniciar sesión');
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
          <Text style={styles.headerTitle}>Cashmind</Text>
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          <Text style={styles.title}>Bienvenido de vuelta</Text>
          <Text style={styles.subtitle}>Inicia sesión para continuar optimizando tus finanzas</Text>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="warning-outline" size={14} color="#EF4444" />
              <Text style={styles.errorTxt}>{error}</Text>
            </View>
          ) : null}

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

          <TouchableOpacity onPress={() => router.push('/forgot-password')} disabled={loading}>
            <Text style={styles.forgotLink}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]} 
            onPress={handleLogin} 
            activeOpacity={0.85}
            disabled={loading}
          >
            <Text style={styles.primaryBtnTxt}>{loading ? 'Iniciando sesión...' : 'Iniciar sesión'}</Text>
          </TouchableOpacity>

          <View style={styles.signupRow}>
            <Text style={styles.signupTxt}>¿No tienes cuenta? </Text>
            <TouchableOpacity onPress={() => router.push('/signup')} disabled={loading}>
              <Text style={styles.signupLink}>Crea una</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.background },
  scrollContent:{ flexGrow: 1, paddingVertical: 20, justifyContent: 'center' },

  header:       { paddingHorizontal: SPACING.xl, paddingVertical: SPACING.xl, alignItems: 'center' },
  headerTitle:  { fontSize: 28, fontWeight: '800', color: COLORS.primary },

  formContainer:{ paddingHorizontal: SPACING.xl * 1.2, marginTop: SPACING.lg },
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

  forgotLink:   { fontSize: FONTS.sm, color: COLORS.primary, fontWeight: '600', textAlign: 'right', marginBottom: SPACING.lg },

  primaryBtn:   { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, paddingVertical: 14, alignItems: 'center', marginTop: SPACING.md },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnTxt:{ color: COLORS.white, fontSize: FONTS.md, fontWeight: '700' },

  signupRow:    { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: SPACING.xl },
  signupTxt:    { fontSize: FONTS.sm, color: COLORS.textMuted },
  signupLink:   { fontSize: FONTS.sm, color: COLORS.primary, fontWeight: '700', textDecorationLine: 'underline' },
});