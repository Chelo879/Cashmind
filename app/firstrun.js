/**
 * app/firstrun.js
 * Configuración inicial al registrarse por primera vez.
 * Paso 1: Presupuesto mensual (obligatorio)
 * Paso 2: Primera deuda (opcional)
 * Paso 3: Primer ahorro (opcional)
 */
import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Animated, Easing, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, RADIUS, SPACING } from '../constants/theme';
import { completarFirstRun } from '../utils/appStore';
import { marcarFirstRunListo } from '../utils/authStore';
import CashmindModal from '../components/CashmindModal';

const PASOS_TOTAL = 3;

// ─── Barra de progreso ────────────────────────────────────────────────────────
function BarraProgreso({ paso }) {
  return (
    <View style={styles.barraWrap}>
      {Array.from({ length: PASOS_TOTAL }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.barraSegmento,
            i < paso && styles.barraSegmentoActivo,
          ]}
        />
      ))}
    </View>
  );
}

// ─── Paso 1: Presupuesto ──────────────────────────────────────────────────────
function PasoPresupuesto({ onSiguiente }) {
  const [valor, setValor] = useState('');
  const valido = parseFloat(valor) > 0;

  return (
    <View style={styles.paso}>
      <View style={styles.iconoWrap}>
        <Ionicons name="cash-outline" size={36} color={COLORS.primary} />
      </View>
      <Text style={styles.pasoTitulo}>¿Cuánto puedes destinar al mes?</Text>
      <Text style={styles.pasoDesc}>
        Este es tu presupuesto mensual (P). El optimizador Simplex lo usará para
        distribuir tus pagos y minimizar los intereses que pagas.
      </Text>

      <View style={styles.inputGrandeWrap}>
        <Text style={styles.inputGrandePrefijo}>$</Text>
        <TextInput
          style={styles.inputGrande}
          value={valor}
          onChangeText={setValor}
          keyboardType="decimal-pad"
          placeholder="0.00"
          placeholderTextColor={COLORS.textMuted}
          autoFocus
        />
      </View>

      <View style={styles.infoCard}>
        <Ionicons name="bulb-outline" size={16} color={COLORS.primary} />
        <Text style={styles.infoCardTxt}>
          Incluye solo lo disponible para deudas, no gastos fijos como renta o comida.
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.btnPrincipal, !valido && styles.btnDeshabilitado]}
        onPress={() => valido && onSiguiente(parseFloat(valor))}
        activeOpacity={0.85}
        disabled={!valido}
      >
        <Text style={styles.btnPrincipalTxt}>Continuar</Text>
        <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
      </TouchableOpacity>
    </View>
  );
}

// ─── Paso 2: Primera deuda ────────────────────────────────────────────────────
function PasoDeuda({ onSiguiente, onOmitir }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [deuda, setDeuda]               = useState(null);

  const guardarYSiguiente = () => onSiguiente(deuda);

  return (
    <View style={styles.paso}>
      <View style={styles.iconoWrap}>
        <Ionicons name="card-outline" size={36} color={COLORS.primary} />
      </View>
      <Text style={styles.pasoTitulo}>¿Tienes alguna deuda?</Text>
      <Text style={styles.pasoDesc}>
        Agrega tu primera deuda para que el optimizador calcule tu plan de pagos.
        Puedes añadir más después.
      </Text>

      {deuda ? (
        // Deuda capturada — mostrar resumen
        <View style={styles.deudaCapturada}>
          <View style={styles.deudaCapturadaInfo}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
            <View style={{ flex: 1 }}>
              <Text style={styles.deudaCapturadaNombre}>{deuda.label}</Text>
              <Text style={styles.deudaCapturadaMonto}>
                ${deuda.totalAmount?.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setDeuda(null)}>
              <Ionicons name="close-circle-outline" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.btnPrincipal} onPress={guardarYSiguiente} activeOpacity={0.85}>
            <Text style={styles.btnPrincipalTxt}>Continuar</Text>
            <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      ) : (
        // Sin deuda capturada
        <>
          <TouchableOpacity
            style={styles.btnAgregar}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="add-circle-outline" size={20} color={COLORS.primary} />
            <Text style={styles.btnAgregarTxt}>Agregar deuda</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnOmitir} onPress={onOmitir} activeOpacity={0.7}>
            <Text style={styles.btnOmitirTxt}>Omitir por ahora</Text>
          </TouchableOpacity>
        </>
      )}

      <CashmindModal
        visible={modalVisible}
        type="debt"
        onClose={() => setModalVisible(false)}
        onSaveDebt={(nueva) => { setDeuda(nueva); setModalVisible(false); }}
      />
    </View>
  );
}

// ─── Paso 3: Primer ahorro ────────────────────────────────────────────────────
function PasoAhorro({ onTerminar, onOmitir, loading }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [ahorro, setAhorro]             = useState(null);

  return (
    <View style={styles.paso}>
      <View style={styles.iconoWrap}>
        <Ionicons name="wallet-outline" size={36} color={COLORS.primary} />
      </View>
      <Text style={styles.pasoTitulo}>¿Tienes algún objetivo de ahorro?</Text>
      <Text style={styles.pasoDesc}>
        Define una meta y un plazo. El sistema calculará cuánto depositar
        cada mes para llegar a tiempo.
      </Text>

      {ahorro ? (
        <View style={styles.deudaCapturada}>
          <View style={styles.deudaCapturadaInfo}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
            <View style={{ flex: 1 }}>
              <Text style={styles.deudaCapturadaNombre}>{ahorro.label}</Text>
              <Text style={styles.deudaCapturadaMonto}>
                Meta: ${ahorro.goal?.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setAhorro(null)}>
              <Ionicons name="close-circle-outline" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={[styles.btnPrincipal, loading && styles.btnDeshabilitado]} onPress={() => !loading && onTerminar(ahorro)} activeOpacity={0.85} disabled={loading}>
            <Text style={styles.btnPrincipalTxt}>{loading ? 'Guardando...' : '¡Empezar!'}</Text>
            {!loading && <Ionicons name="checkmark" size={18} color={COLORS.white} />}
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <TouchableOpacity
            style={styles.btnAgregar}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="add-circle-outline" size={20} color={COLORS.primary} />
            <Text style={styles.btnAgregarTxt}>Agregar objetivo</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.btnOmitir, loading && { opacity: 0.4 }]} onPress={onOmitir} activeOpacity={0.7} disabled={loading}>
            <Text style={styles.btnOmitirTxt}>Omitir por ahora</Text>
          </TouchableOpacity>
        </>
      )}

      <CashmindModal
        visible={modalVisible}
        type="saving"
        onClose={() => setModalVisible(false)}
        onSaveSaving={(nuevo) => { setAhorro(nuevo); setModalVisible(false); }}
      />
    </View>
  );
}

// ─── Pantalla principal ───────────────────────────────────────────────────────
export default function FirstRunScreen() {
  const router    = useRouter();
  const [paso, setPaso] = useState(1);
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Datos acumulados
  const [budget,  setBudgetLocal]  = useState(0);
  const [deuda,   setDeudaLocal]   = useState(null);

  const animar = (direccion, cb) => {
    Animated.timing(slideAnim, {
      toValue: direccion === 'out' ? -40 : 40,
      duration: 150, useNativeDriver: true,
      easing: Easing.in(Easing.ease),
    }).start(() => {
      slideAnim.setValue(direccion === 'out' ? 40 : -40);
      cb();
      Animated.timing(slideAnim, {
        toValue: 0, duration: 200, useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }).start();
    });
  };

  const irSiguiente = () => animar('out', () => setPaso((p) => p + 1));

  const [guardando, setGuardando] = useState(false);

  const finalizarSetup = async (budget, debts, savings) => {
    setGuardando(true);
    try {
      await completarFirstRun(budget, debts, savings);
      router.replace('/');
    } catch {
      setGuardando(false);
    }
  };

  // Handlers por paso
  const paso1Siguiente = (valor) => {
    setBudgetLocal(valor);
    irSiguiente();
  };

  const paso2Siguiente = (deudaCapturada) => {
    setDeudaLocal(deudaCapturada);
    irSiguiente();
  };

  const paso3Terminar = (ahorro) => {
    finalizarSetup(
      budget,
      deuda ? [deuda] : [],
      ahorro ? [ahorro] : [],
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerLogo}>Cashmind</Text>
        <Text style={styles.headerPaso}>Paso {paso} de {PASOS_TOTAL}</Text>
      </View>

      <BarraProgreso paso={paso} />

      {/* Contenido animado */}
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={{ opacity: slideAnim.interpolate({ inputRange: [-40, 0, 40], outputRange: [0, 1, 0] }), transform: [{ translateX: slideAnim }] }}>
          {paso === 1 && <PasoPresupuesto onSiguiente={paso1Siguiente} />}
          {paso === 2 && (
            <PasoDeuda
              onSiguiente={paso2Siguiente}
              onOmitir={() => { setDeudaLocal(null); irSiguiente(); }}
            />
          )}
          {paso === 3 && (
            <PasoAhorro
              onTerminar={paso3Terminar}
              onOmitir={() => finalizarSetup(budget, deuda ? [deuda] : [], [])}
              loading={guardando}
            />
          )}
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.xl, paddingTop: 56, paddingBottom: SPACING.lg,
  },
  headerLogo: { fontSize: FONTS.xl, fontWeight: '800', color: COLORS.primary, letterSpacing: -0.5 },
  headerPaso: { fontSize: FONTS.sm, color: COLORS.textMuted },

  barraWrap: {
    flexDirection: 'row', gap: SPACING.sm,
    paddingHorizontal: SPACING.xl, marginBottom: SPACING.xl,
  },
  barraSegmento: {
    flex: 1, height: 4, borderRadius: 2,
    backgroundColor: COLORS.cardBorder,
  },
  barraSegmentoActivo: { backgroundColor: COLORS.primary },

  scroll: { paddingHorizontal: SPACING.xl, paddingBottom: 40 },

  paso:      { alignItems: 'center', paddingTop: SPACING.xl },
  iconoWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: COLORS.primaryAlpha12,
    borderWidth: 1, borderColor: COLORS.primaryAlpha30,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  pasoTitulo: {
    fontSize: FONTS.xxl - 2, fontWeight: '800', color: COLORS.textPrimary,
    textAlign: 'center', letterSpacing: -0.5, marginBottom: SPACING.md,
  },
  pasoDesc: {
    fontSize: FONTS.base, color: COLORS.textMuted,
    textAlign: 'center', lineHeight: 22, marginBottom: SPACING.xxl,
  },

  inputGrandeWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.cardBg, borderRadius: RADIUS.xl,
    borderWidth: 1, borderColor: COLORS.primary,
    paddingHorizontal: SPACING.xl, marginBottom: SPACING.lg,
    width: '100%',
  },
  inputGrandePrefijo: { fontSize: 32, fontWeight: '700', color: COLORS.textMuted, marginRight: 4 },
  inputGrande: {
    flex: 1, fontSize: 32, fontWeight: '800',
    color: COLORS.textPrimary, paddingVertical: SPACING.lg,
  },

  infoCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm,
    backgroundColor: COLORS.primaryAlpha12, borderRadius: RADIUS.md,
    padding: SPACING.md, marginBottom: SPACING.xxl,
    borderWidth: 1, borderColor: COLORS.primaryAlpha30, width: '100%',
  },
  infoCardTxt: { flex: 1, fontSize: FONTS.sm, color: COLORS.textMuted, lineHeight: 18 },

  btnPrincipal: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.sm, backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg, paddingVertical: SPACING.lg,
    width: '100%', marginTop: SPACING.sm,
  },
  btnPrincipalTxt:   { fontSize: FONTS.md, fontWeight: '700', color: COLORS.white },
  btnDeshabilitado:  { opacity: 0.4 },

  btnAgregar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.sm, backgroundColor: COLORS.primaryAlpha12,
    borderRadius: RADIUS.lg, paddingVertical: SPACING.lg,
    width: '100%', borderWidth: 1, borderColor: COLORS.primaryAlpha30,
  },
  btnAgregarTxt: { fontSize: FONTS.md, fontWeight: '600', color: COLORS.primary },

  btnOmitir:    { marginTop: SPACING.lg, padding: SPACING.md },
  btnOmitirTxt: { fontSize: FONTS.base, color: COLORS.textMuted, textDecorationLine: 'underline' },

  deudaCapturada: { width: '100%', gap: SPACING.md },
  deudaCapturadaInfo: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    backgroundColor: 'rgba(16,185,129,0.1)', borderRadius: RADIUS.lg,
    padding: SPACING.lg, borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)',
  },
  deudaCapturadaNombre: { fontSize: FONTS.base, fontWeight: '700', color: COLORS.textPrimary },
  deudaCapturadaMonto:  { fontSize: FONTS.sm, color: COLORS.textMuted, marginTop: 2 },
});
