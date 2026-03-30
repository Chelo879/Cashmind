/**
 * app/(tabs)/savings/[id].js
 * Detalle de un objetivo de ahorro: progreso, depósito sugerido,
 * modal de depósito y edición/eliminación del objetivo.
 */
import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView,
  TextInput, Animated, Alert, Keyboard, Easing,
  Platform, TouchableWithoutFeedback,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import ScreenWrapper from '../../../components/ScreenWrapper';
import AnimatedBar from '../../../components/AnimatedBar';
import CashmindModal from '../../../components/CashmindModal';
import { COLORS, FONTS, RADIUS, SPACING } from '../../../constants/theme';
import { useAppStore, actualizarAhorro, eliminarAhorro } from '../../../utils/appStore';
import { fmt, fraction } from '../../../utils/format';
import { useKeyboardHeight, ListoBar } from '../../../utils/keyboard';

// Mapa de íconos para objetivos de ahorro
const SAVING_ICON_MAP = {
  shield:          'shield-checkmark',
  airplane:        'airplane',
  laptop:          'laptop',
  car:             'car',
  home:            'home',
  phone:           'phone-portrait',
  school:          'school',
  diamond:         'diamond',
  barbell:         'barbell',
  'musical-notes': 'musical-notes',
  leaf:            'leaf',
  medkit:          'medkit',
};

// Fila de detalle etiqueta–valor
function FilaDetalle({ label, value, colorValor }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, colorValor && { color: colorValor }]}>{value}</Text>
    </View>
  );
}

// ─── Modal de depósito ────────────────────────────────────────────────────────
function ModalDeposito({ visible, ahorro, onConfirmar, onCerrar }) {
  const [monto, setMonto]  = useState(ahorro?.monthlyDeposit?.toString() ?? '');
  const slideAnim          = React.useRef(new Animated.Value(600)).current;
  const alturasTeclado     = useKeyboardHeight();

  React.useEffect(() => {
    if (visible) {
      setMonto(ahorro?.monthlyDeposit?.toString() ?? '');
      Animated.timing(slideAnim, {
        toValue: 0, duration: 320, useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 600, duration: 260, useNativeDriver: true,
        easing: Easing.in(Easing.cubic),
      }).start();
    }
  }, [visible]);

  const faltante   = ahorro ? ahorro.goal - ahorro.saved : 0;
  const parsed     = parseFloat(monto) || 0;
  const excede     = parsed > faltante;
  const esValido   = parsed > 0 && !excede;
  const nuevoTotal = esValido ? ahorro.saved + parsed : ahorro?.saved ?? 0;
  const nuevoPct   = ahorro ? fraction(nuevoTotal, ahorro.goal) : 0;
  const completado = nuevoTotal >= (ahorro?.goal ?? 0);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onCerrar}>
      <View style={{ flex: 1 }}>
        <TouchableWithoutFeedback onPress={onCerrar}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>

        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }], bottom: alturasTeclado }]}>
          <View style={styles.handle} />

          <View style={styles.sheetHeader}>
            <View style={[styles.sheetIconWrap, { backgroundColor: ahorro?.color + '22' }]}>
              <Ionicons
                name={SAVING_ICON_MAP[ahorro?.iconKey] ?? 'cash-outline'}
                size={24}
                color={COLORS.primary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sheetTitle}>Registrar depósito</Text>
              <Text style={styles.sheetSub}>{ahorro?.label}</Text>
            </View>
            <TouchableOpacity onPress={onCerrar} style={styles.closeBtn}>
              <Ionicons name="close" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.sheetContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Banner de depósito mensual sugerido */}
            {ahorro?.monthlyDeposit && (
              <View style={styles.bannerSugerido}>
                <Ionicons name="bulb-outline" size={16} color={COLORS.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.bannerSugeridoTitulo}>Depósito mensual sugerido</Text>
                  <Text style={styles.bannerSugeridoMonto}>{fmt(ahorro.monthlyDeposit)}</Text>
                  {ahorro.months && (
                    <Text style={styles.bannerSugeridoHint}>
                      Para alcanzar tu meta en {ahorro.months} meses
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.btnUsarSugerido}
                  onPress={() => setMonto(ahorro.monthlyDeposit.toString())}
                >
                  <Text style={styles.btnUsarSugeridoTxt}>Usar</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.campo}>
              <Text style={styles.campoLabel}>Monto a depositar</Text>
              <View style={styles.inputWrap}>
                <Text style={styles.inputPrefijo}>$</Text>
                <TextInput
                  style={styles.input}
                  value={monto}
                  onChangeText={setMonto}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={COLORS.textMuted}
                  autoFocus
                />
              </View>
              {excede && (
                <Text style={styles.errorTxt}>
                  El monto supera lo que falta por ahorrar ({fmt(faltante)})
                </Text>
              )}
            </View>

            {/* Vista previa del resultado */}
            {esValido && (
              <View style={styles.vistaPrevia}>
                <Text style={styles.vistaPreviaTitulo}>Vista previa del resultado</Text>
                <View style={styles.vistaPreviaFila}>
                  <Text style={styles.vistaPreviaLabel}>Total ahorrado</Text>
                  <Text style={styles.vistaPreviaValor}>{fmt(nuevoTotal)}</Text>
                </View>
                <View style={styles.vistaPreviaFila}>
                  <Text style={styles.vistaPreviaLabel}>Por alcanzar</Text>
                  <Text style={styles.vistaPreviaValor}>{fmt(Math.max(0, ahorro.goal - nuevoTotal))}</Text>
                </View>
                <AnimatedBar progress={nuevoPct} color={ahorro?.color ?? COLORS.primary} height={6} />
                <Text style={styles.vistaPreviaPct}>{Math.round(nuevoPct * 100)}% alcanzado</Text>
                {completado && (
                  <Text style={styles.metaAlcanzadaHint}>¡Alcanzarás tu meta con este depósito!</Text>
                )}
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.btnConfirmar,
                { backgroundColor: ahorro?.color ?? COLORS.primary },
                !esValido && styles.btnConfirmarDeshabilitado,
              ]}
              onPress={() => esValido && onConfirmar(parsed)}
              activeOpacity={0.85}
              disabled={!esValido}
            >
              <Text style={styles.btnConfirmarTxt}>
                Confirmar depósito de {esValido ? fmt(parsed) : '$0.00'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
          <ListoBar visible={alturasTeclado > 0} />
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─── Pantalla principal ───────────────────────────────────────────────────────
export default function DetalleAhorroScreen() {
  const { id }  = useLocalSearchParams();
  const router  = useRouter();

  const { savings: ahorros } = useAppStore();
  const [modalDeposito, setModalDeposito] = useState(false);
  const [modalEditar,   setModalEditar]   = useState(false);
  const [depositado,    setDepositado]    = useState(false);

  const ahorro = ahorros.find((s) => s.id === id);
  if (!ahorro) return null;

  const faltante   = ahorro.goal - ahorro.saved;
  const progreso   = fraction(ahorro.saved, ahorro.goal);
  const completado = ahorro.saved >= ahorro.goal;
  const iconName   = SAVING_ICON_MAP[ahorro.iconKey] ?? 'wallet-outline';

  const confirmarDeposito = (monto) => {
    actualizarAhorro(id, { saved: Math.min(ahorro.saved + monto, ahorro.goal) });
    setModalDeposito(false);
    setDepositado(true);
  };

  const confirmarEdicion = (nuevo) => {
    actualizarAhorro(id, nuevo);
  };

  const confirmarEliminar = () => {
    Alert.alert(
      'Eliminar objetivo',
      `¿Eliminar "${ahorro.label}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => { eliminarAhorro(id); router.back(); } },
      ]
    );
  };

  return (
    <ScreenWrapper>
      {/* Botón de regreso */}
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={20} color={COLORS.primary} />
        <Text style={styles.backTxt}>Ahorros</Text>
      </TouchableOpacity>

      {/* Banner de éxito tras depósito */}
      {depositado && (
        <View style={styles.bannerExito}>
          <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
          <Text style={styles.bannerExitoTxt}>Depósito registrado correctamente</Text>
        </View>
      )}

      {/* Tarjeta hero */}
      <View style={[styles.heroCard, { borderTopColor: ahorro.color }]}>
        <View style={[styles.heroIconWrap, { backgroundColor: ahorro.color + '22' }]}>
          <Ionicons name={iconName} size={40} color={ahorro.color} />
        </View>
        <Text style={styles.heroTitulo}>{ahorro.label}</Text>
        <Text style={styles.heroMonto}>{fmt(ahorro.saved)}</Text>
        <Text style={styles.heroSub}>ahorrado de {fmt(ahorro.goal)}</Text>
        <View style={styles.progressWrap}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Progreso</Text>
            <Text style={[styles.progressPct, { color: ahorro.color }]}>{Math.round(progreso * 100)}%</Text>
          </View>
          <AnimatedBar progress={progreso} color={ahorro.color} height={10} />
        </View>
      </View>

      {/* Sugerencia de depósito mensual */}
      {ahorro.monthlyDeposit && !completado && (
        <View style={styles.sugerenciaDeposito}>
          <Ionicons name="bulb-outline" size={16} color={COLORS.primary} />
          <Text style={styles.sugerenciaDepositoTxt}>
            Deposita{' '}
            <Text style={styles.sugerenciaDepositoMonto}>{fmt(ahorro.monthlyDeposit)}/mes</Text>
            {ahorro.months
              ? ` para alcanzar tu meta en ${ahorro.months} meses`
              : ' para alcanzar tu meta a tiempo'}
          </Text>
        </View>
      )}

      {/* Detalles */}
      <View style={styles.cardDetalle}>
        <Text style={styles.cardDetalleTitulo}>Detalles</Text>
        <FilaDetalle label="Meta total"        value={fmt(ahorro.goal)} />
        <FilaDetalle label="Ya ahorrado"       value={fmt(ahorro.saved)}  colorValor={COLORS.success} />
        <FilaDetalle label="Por alcanzar"      value={fmt(faltante)} />
        <FilaDetalle label="Fecha objetivo"    value={ahorro.targetDate} />
        {ahorro.months && <FilaDetalle label="Plazo" value={`${ahorro.months} meses`} />}
        {ahorro.monthlyDeposit && (
          <FilaDetalle
            label="Depósito sugerido"
            value={`${fmt(ahorro.monthlyDeposit)}/mes`}
            colorValor={COLORS.primary}
          />
        )}
      </View>

      {/* Acciones */}
      {!completado ? (
        <TouchableOpacity
          style={[styles.btnDepositar, { backgroundColor: ahorro.color }]}
          onPress={() => setModalDeposito(true)}
          activeOpacity={0.85}
        >
          <Text style={styles.btnDepositarTxt}>Registrar depósito</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.badgeCompletado}>
          <Ionicons name="trophy" size={16} color={COLORS.white} />
          <Text style={styles.badgeCompletadoTxt}> Meta alcanzada</Text>
        </View>
      )}

      <View style={styles.botonesSecundarios}>
        <TouchableOpacity
          style={styles.btnEditar}
          onPress={() => setModalEditar(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="create-outline" size={16} color={COLORS.primary} />
          <Text style={styles.btnEditarTxt}>Editar objetivo</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.btnEliminar}
          onPress={confirmarEliminar}
          activeOpacity={0.85}
        >
          <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
          <Text style={styles.btnEliminarTxt}>Eliminar</Text>
        </TouchableOpacity>
      </View>

      <ModalDeposito
        visible={modalDeposito}
        ahorro={ahorro}
        onConfirmar={confirmarDeposito}
        onCerrar={() => setModalDeposito(false)}
      />
      <CashmindModal
        visible={modalEditar}
        type="saving"
        onClose={() => setModalEditar(false)}
        initialData={ahorro ?? null}
        onSaveSaving={(nuevo) => { confirmarEdicion(nuevo); setModalEditar(false); }}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  backBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.lg },
  backTxt: { fontSize: FONTS.md, color: COLORS.primary, fontWeight: '600', marginLeft: 2 },

  bannerExito: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: 'rgba(16,185,129,0.12)', borderRadius: RADIUS.lg,
    padding: SPACING.md, marginBottom: SPACING.lg,
    borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)',
  },
  bannerExitoTxt: { fontSize: FONTS.base, color: COLORS.success, fontWeight: '600' },

  heroCard: {
    backgroundColor: COLORS.cardBg, borderRadius: RADIUS.xl,
    padding: SPACING.xxl, marginBottom: SPACING.md,
    borderWidth: 1, borderColor: COLORS.cardBorder,
    borderTopWidth: 3, alignItems: 'center',
  },
  heroIconWrap:  { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md },
  heroTitulo:    { fontSize: FONTS.xl, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.lg },
  heroMonto:     { fontSize: FONTS.hero - 4, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.5 },
  heroSub:       { fontSize: FONTS.base, color: COLORS.textMuted, marginTop: 4, marginBottom: SPACING.xl },
  progressWrap:  { width: '100%' },
  progressHeader:{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: FONTS.sm, color: COLORS.textMuted },
  progressPct:   { fontSize: FONTS.sm, fontWeight: '700' },

  sugerenciaDeposito: {
    flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm,
    backgroundColor: COLORS.primaryAlpha12, borderRadius: RADIUS.md,
    padding: SPACING.md, marginBottom: SPACING.md,
    borderWidth: 1, borderColor: COLORS.primaryAlpha30,
  },
  sugerenciaDepositoTxt:   { flex: 1, fontSize: FONTS.sm, color: COLORS.textMuted, lineHeight: 18 },
  sugerenciaDepositoMonto: { color: COLORS.primary, fontWeight: '700' },

  cardDetalle:       { backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.xl, borderWidth: 1, borderColor: COLORS.cardBorder },
  cardDetalleTitulo: { fontSize: FONTS.md, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.md },
  infoRow:           { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.cardBorder },
  infoLabel:         { fontSize: FONTS.base, color: COLORS.textMuted },
  infoValue:         { fontSize: FONTS.base, fontWeight: '600', color: COLORS.textPrimary },

  btnDepositar:    { borderRadius: RADIUS.lg, paddingVertical: SPACING.lg, alignItems: 'center', marginBottom: SPACING.md },
  btnDepositarTxt: { fontSize: FONTS.md, fontWeight: '700', color: COLORS.white },

  badgeCompletado: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(16,185,129,0.12)', borderRadius: RADIUS.lg,
    paddingVertical: SPACING.lg, marginBottom: SPACING.md,
    borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)',
  },
  badgeCompletadoTxt: { fontSize: FONTS.md, fontWeight: '700', color: COLORS.success },

  botonesSecundarios: { flexDirection: 'row', gap: SPACING.md },
  btnEditar: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.xs, backgroundColor: COLORS.primaryAlpha12,
    borderRadius: RADIUS.lg, paddingVertical: SPACING.lg,
    borderWidth: 1, borderColor: COLORS.primaryAlpha30,
  },
  btnEditarTxt:   { fontSize: FONTS.md, fontWeight: '600', color: COLORS.primary },
  btnEliminar: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.xs, backgroundColor: 'rgba(239,68,68,0.08)',
    borderRadius: RADIUS.lg, paddingVertical: SPACING.lg,
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)',
  },
  btnEliminarTxt: { fontSize: FONTS.md, fontWeight: '600', color: COLORS.danger },

  // Modal
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.background, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    borderTopWidth: 1, borderColor: COLORS.cardBorder,
  },
  handle:        { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.textMuted, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  sheetHeader:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.xl, paddingVertical: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.cardBorder, gap: SPACING.md },
  sheetIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  sheetTitle:    { fontSize: FONTS.lg, fontWeight: '700', color: COLORS.textPrimary },
  sheetSub:      { fontSize: FONTS.sm, color: COLORS.textMuted },
  closeBtn:      { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.cardBg, alignItems: 'center', justifyContent: 'center' },
  sheetContent:  { padding: SPACING.xl, paddingBottom: 48 },

  bannerSugerido: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.primaryAlpha12, borderRadius: RADIUS.lg,
    padding: SPACING.md, marginBottom: SPACING.xl,
    borderWidth: 1, borderColor: COLORS.primaryAlpha30,
  },
  bannerSugeridoTitulo: { fontSize: FONTS.sm, color: COLORS.textMuted },
  bannerSugeridoMonto:  { fontSize: FONTS.lg, fontWeight: '800', color: COLORS.primary },
  bannerSugeridoHint:   { fontSize: FONTS.sm, color: COLORS.textMuted, marginTop: 2 },
  btnUsarSugerido:      { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs },
  btnUsarSugeridoTxt:   { fontSize: FONTS.sm, color: COLORS.white, fontWeight: '700' },

  campo:        { marginBottom: SPACING.lg },
  campoLabel:   { fontSize: FONTS.base, fontWeight: '600', color: COLORS.textPrimary, marginBottom: SPACING.sm },
  inputWrap:    { position: 'relative' },
  inputPrefijo: { position: 'absolute', left: 12, top: 14, fontSize: FONTS.base, color: COLORS.textMuted, zIndex: 1 },
  input: {
    backgroundColor: COLORS.cardBg, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.cardBorder,
    paddingLeft: 32, paddingRight: SPACING.lg, paddingVertical: SPACING.md,
    fontSize: FONTS.xl, fontWeight: '700', color: COLORS.textPrimary,
  },
  errorTxt: { fontSize: FONTS.sm, color: COLORS.danger, marginTop: SPACING.xs },

  vistaPrevia:       { backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.lg, borderWidth: 1, borderColor: COLORS.cardBorder },
  vistaPreviaTitulo: { fontSize: FONTS.sm, color: COLORS.textMuted, marginBottom: SPACING.sm },
  vistaPreviaFila:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm },
  vistaPreviaLabel:  { fontSize: FONTS.base, color: COLORS.textMuted },
  vistaPreviaValor:  { fontSize: FONTS.base, fontWeight: '700', color: COLORS.textPrimary },
  vistaPreviaPct:    { fontSize: FONTS.sm, color: COLORS.textMuted, textAlign: 'right', marginTop: 4 },
  metaAlcanzadaHint: { fontSize: FONTS.sm, color: COLORS.success, fontWeight: '600', textAlign: 'center', marginTop: SPACING.sm },

  btnConfirmar:             { borderRadius: RADIUS.lg, paddingVertical: SPACING.lg, alignItems: 'center' },
  btnConfirmarDeshabilitado:{ opacity: 0.4 },
  btnConfirmarTxt:          { fontSize: FONTS.md, fontWeight: '700', color: COLORS.white },
});
