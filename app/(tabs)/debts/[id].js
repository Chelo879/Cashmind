/**
 * app/(tabs)/debts/[id].js
 * Detalle de una deuda: progreso, info, pago optimizado y modal de pago.
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
import { useAppStore, actualizarDeuda, eliminarDeuda } from '../../../utils/appStore';
import { fmt, fraction } from '../../../utils/format';
import { simplexDistribute, grandMDistribute, canCoverMinimums } from '../../../utils/optimizer';
import { useKeyboardHeight, ListoBar } from '../../../utils/keyboard';

// Ícono por categoría de deuda
const DEBT_ICON = {
  credit_card: 'card',
  mortgage:    'home',
  auto:        'car',
  personal:    'person',
  other:       'wallet-outline',
};

// Fila de detalle con etiqueta y valor
function FilaDetalle({ label, value, colorValor }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, colorValor && { color: colorValor }]}>{value}</Text>
    </View>
  );
}

// ─── Modal de pago ────────────────────────────────────────────────────────────
function ModalPago({ visible, deuda, pagoRecomendado, onConfirmar, onCerrar }) {
  const [monto, setMonto]      = useState(pagoRecomendado?.toString() ?? '');
  const slideAnim              = React.useRef(new Animated.Value(600)).current;
  const alturasTeclado         = useKeyboardHeight();

  React.useEffect(() => {
    if (visible) {
      setMonto(pagoRecomendado?.toString() ?? '');
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
  }, [visible, pagoRecomendado]);

  const restante   = deuda ? deuda.totalAmount - deuda.paidAmount : 0;
  const parsed     = parseFloat(monto) || 0;
  const excede     = parsed > restante;
  const esValido   = parsed > 0 && !excede;
  const nuevoSaldo = esValido ? Math.max(0, restante - parsed) : restante;
  const nuevoPct   = esValido
    ? fraction(deuda.paidAmount + parsed, deuda.totalAmount)
    : fraction(deuda?.paidAmount ?? 0, deuda?.totalAmount ?? 1);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onCerrar}>
      <View style={{ flex: 1 }}>
        <TouchableWithoutFeedback onPress={onCerrar}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>

        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }], bottom: alturasTeclado }]}>
          <View style={styles.handle} />

          <View style={styles.sheetHeader}>
            <View style={[styles.sheetIconWrap, { backgroundColor: deuda?.color + '22' }]}>
              <Ionicons name={DEBT_ICON[deuda?.categoryKey] ?? 'card'} size={18} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sheetTitle}>Registrar pago</Text>
              <Text style={styles.sheetSub}>{deuda?.label}</Text>
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
            {/* Banner de pago recomendado por el optimizador */}
            {pagoRecomendado > 0 && (
              <View style={styles.bannerRecomendado}>
                <Ionicons name="hardware-chip-outline" size={18} color={COLORS.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.bannerRecomendadoTitulo}>Pago recomendado por el optimizador</Text>
                  <Text style={styles.bannerRecomendadoMonto}>{fmt(pagoRecomendado)}</Text>
                </View>
                <TouchableOpacity
                  style={styles.btnUsarRecomendado}
                  onPress={() => setMonto(pagoRecomendado.toString())}
                >
                  <Text style={styles.btnUsarRecomendadoTxt}>Usar</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.campo}>
              <Text style={styles.campoLabel}>Monto a pagar</Text>
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
                <Text style={styles.errorTxt}>El monto supera el saldo restante de {fmt(restante)}</Text>
              )}
            </View>

            {/* Vista previa del resultado */}
            {esValido && (
              <View style={styles.vistaPrevia}>
                <Text style={styles.vistaPreviaTitulo}>Vista previa del resultado</Text>
                <View style={styles.vistaPreviaFila}>
                  <Text style={styles.vistaPreviaLabel}>Saldo restante</Text>
                  <Text style={styles.vistaPreviaValor}>{fmt(nuevoSaldo)}</Text>
                </View>
                <AnimatedBar progress={nuevoPct} color={deuda?.color ?? COLORS.primary} height={6} />
                <Text style={styles.vistaPreviaPct}>{Math.round(nuevoPct * 100)}% pagado</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.btnConfirmar, !esValido && styles.btnConfirmarDeshabilitado]}
              onPress={() => esValido && onConfirmar(parsed)}
              activeOpacity={0.85}
              disabled={!esValido}
            >
              <Text style={styles.btnConfirmarTxt}>
                Confirmar pago de {esValido ? fmt(parsed) : '$0.00'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
          <ListoBar visible={alturasTeclado > 0} />
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─── Modal de edición ─────────────────────────────────────────────────────────
function ModalEditar({ visible, deuda, onGuardar, onCerrar }) {
  if (!deuda) return null;
  return (
    <CashmindModal
      visible={visible}
      type="debt"
      onClose={onCerrar}
      initialData={deuda}
      onSaveDebt={(nueva) => { onGuardar(nueva); onCerrar(); }}
    />
  );
}

// ─── Pantalla principal ───────────────────────────────────────────────────────
export default function DetalleDeudaScreen() {
  const { id }  = useLocalSearchParams();
  const router  = useRouter();

  const { debts: deudas, budget } = useAppStore();
  const [modalPago,   setModalPago]   = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  const [pagado,      setPagado]      = useState(false);

  const deuda = deudas.find((d) => d.id === id);
  if (!deuda) return null;

  const restante  = deuda.totalAmount - deuda.paidAmount;
  const progreso  = fraction(deuda.paidAmount, deuda.totalAmount);
  const liquidada = deuda.paidAmount >= deuda.totalAmount;
  const iconName  = DEBT_ICON[deuda.categoryKey] ?? 'card';

  // Pago recomendado por el optimizador para esta deuda
  const optimizerDebts = deudas.map((d) => ({
    id: d.id, label: d.label,
    balance: d.totalAmount - d.paidAmount,
    cat: d.cat ?? d.interestRate ?? 0,
    minPayment: d.minPayment ?? 0,
    penalty: d.penalty ?? 0,
    color: d.color,
  }));
  const haycrisis    = !canCoverMinimums(optimizerDebts, budget);
  const pagos        = haycrisis
    ? grandMDistribute(optimizerDebts, budget).payments
    : simplexDistribute(optimizerDebts, budget);
  const recomendado  = pagos.find((p) => p.debtId === id);
  const pagoOptimo   = recomendado?.sacrificed ? 0 : (recomendado?.payment ?? 0);

  const confirmarPago = (monto) => {
    actualizarDeuda(id, { paidAmount: Math.min(deuda.paidAmount + monto, deuda.totalAmount) });
    setModalPago(false);
    setPagado(true);
  };

  const confirmarEdicion = (nueva) => {
    actualizarDeuda(id, nueva);
  };

  const confirmarEliminar = () => {
    Alert.alert(
      'Eliminar deuda',
      `¿Eliminar "${deuda.label}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => { eliminarDeuda(id); router.back(); } },
      ]
    );
  };

  return (
    <ScreenWrapper>
      {/* Botón de regreso */}
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={20} color={COLORS.primary} />
        <Text style={styles.backTxt}>Deudas</Text>
      </TouchableOpacity>

      {/* Banner de éxito tras pago */}
      {pagado && (
        <View style={styles.bannerExito}>
          <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
          <Text style={styles.bannerExitoTxt}>Pago registrado correctamente</Text>
        </View>
      )}

      {/* Tarjeta hero */}
      <View style={[styles.heroCard, { borderTopColor: deuda.color }]}>
        <View style={[styles.heroIcon, { backgroundColor: deuda.color + '22' }]}>
          <Ionicons name={iconName} size={28} color={deuda.color} />
        </View>
        <Text style={styles.heroTitulo}>{deuda.label}</Text>
        <Text style={styles.heroCategoria}>{deuda.category}</Text>
        <Text style={styles.heroMonto}>{fmt(restante)}</Text>
        <Text style={styles.heroSub}>pendiente de {fmt(deuda.totalAmount)}</Text>
        <View style={styles.progressWrap}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Progreso de pago</Text>
            <Text style={[styles.progressPct, { color: deuda.color }]}>{Math.round(progreso * 100)}%</Text>
          </View>
          <AnimatedBar progress={progreso} color={deuda.color} height={10} />
        </View>
      </View>

      {/* Sugerencia del optimizador */}
      {pagoOptimo > 0 && !liquidada && (
        <View style={styles.sugerenciaOptimizador}>
          <Ionicons name="hardware-chip-outline" size={18} color={COLORS.primary} />
          <Text style={styles.sugerenciaTxt}>
            El optimizador sugiere pagar{' '}
            <Text style={styles.sugerenciaMonto}>{fmt(pagoOptimo)}</Text>
            {' '}este mes para minimizar intereses
          </Text>
        </View>
      )}

      {/* Alerta modo crisis */}
      {recomendado?.sacrificed && (
        <View style={styles.alertaCrisis}>
          <Ionicons name="alert-circle" size={18} color={COLORS.danger} />
          <Text style={styles.alertaCrisisTxt}>
            Modo crisis — el optimizador sugiere omitir este pago para minimizar penalizaciones
          </Text>
        </View>
      )}

      {/* Detalles */}
      <View style={styles.cardDetalle}>
        <Text style={styles.cardDetalleTitulo}>Detalles</Text>
        <FilaDetalle label="Total original"       value={fmt(deuda.totalAmount)} />
        <FilaDetalle label="Ya pagado"            value={fmt(deuda.paidAmount)}  colorValor={COLORS.success} />
        <FilaDetalle label="Restante"             value={fmt(restante)}          colorValor={COLORS.danger} />
        <FilaDetalle label="Tasa de interés"      value={`${deuda.interestRate ?? deuda.cat}% anual`} />
        <FilaDetalle label="Fecha de vencimiento" value={`Vence ${deuda.dueDateLabel}`} />
        {deuda.minPayment && <FilaDetalle label="Pago mínimo" value={fmt(deuda.minPayment)} />}
      </View>

      {/* Acciones */}
      {!liquidada ? (
        <TouchableOpacity style={styles.btnPagar} onPress={() => setModalPago(true)} activeOpacity={0.85}>
          <Text style={styles.btnPagarTxt}>Registrar pago</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.badgeLiquidada}>
          <Text style={styles.badgeLiquidadaTxt}>Deuda liquidada</Text>
        </View>
      )}

      <View style={styles.botonesSecundarios}>
        <TouchableOpacity
          style={styles.btnEditar}
          onPress={() => setModalEditar(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="create-outline" size={16} color={COLORS.primary} />
          <Text style={styles.btnEditarTxt}>Editar deuda</Text>
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

      <ModalPago
        visible={modalPago}
        deuda={deuda}
        pagoRecomendado={pagoOptimo}
        onConfirmar={confirmarPago}
        onCerrar={() => setModalPago(false)}
      />
      <ModalEditar
        visible={modalEditar}
        deuda={deuda}
        onGuardar={confirmarEdicion}
        onCerrar={() => setModalEditar(false)}
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
  heroIcon:     { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md },
  heroTitulo:   { fontSize: FONTS.xl, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  heroCategoria:{ fontSize: FONTS.base, color: COLORS.textMuted, marginBottom: SPACING.lg },
  heroMonto:    { fontSize: FONTS.hero - 4, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.5 },
  heroSub:      { fontSize: FONTS.base, color: COLORS.textMuted, marginTop: 4, marginBottom: SPACING.xl },
  progressWrap:  { width: '100%' },
  progressHeader:{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: FONTS.sm, color: COLORS.textMuted },
  progressPct:   { fontSize: FONTS.sm, fontWeight: '700' },

  sugerenciaOptimizador: {
    flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm,
    backgroundColor: COLORS.primaryAlpha12, borderRadius: RADIUS.md,
    padding: SPACING.md, marginBottom: SPACING.md,
    borderWidth: 1, borderColor: COLORS.primaryAlpha30,
  },
  sugerenciaTxt:   { flex: 1, fontSize: FONTS.sm, color: COLORS.textMuted, lineHeight: 18 },
  sugerenciaMonto: { color: COLORS.primary, fontWeight: '700' },

  alertaCrisis: {
    flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm,
    backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: RADIUS.md,
    padding: SPACING.md, marginBottom: SPACING.md,
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
  },
  alertaCrisisTxt: { flex: 1, fontSize: FONTS.sm, color: COLORS.textMuted, lineHeight: 18 },

  cardDetalle:       { backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.xl, borderWidth: 1, borderColor: COLORS.cardBorder },
  cardDetalleTitulo: { fontSize: FONTS.md, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.md },
  infoRow:           { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.cardBorder },
  infoLabel:         { fontSize: FONTS.base, color: COLORS.textMuted },
  infoValue:         { fontSize: FONTS.base, fontWeight: '600', color: COLORS.textPrimary },

  btnPagar:    { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, paddingVertical: SPACING.lg, alignItems: 'center', marginBottom: SPACING.md },
  btnPagarTxt: { fontSize: FONTS.md, fontWeight: '700', color: COLORS.white },

  badgeLiquidada:    { backgroundColor: 'rgba(16,185,129,0.12)', borderRadius: RADIUS.lg, paddingVertical: SPACING.lg, alignItems: 'center', marginBottom: SPACING.md, borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)' },
  badgeLiquidadaTxt: { fontSize: FONTS.md, fontWeight: '700', color: COLORS.success },

  botonesSecundarios: { flexDirection: 'row', gap: SPACING.md },
  btnEditar: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.xs, backgroundColor: COLORS.primaryAlpha12,
    borderRadius: RADIUS.lg, paddingVertical: SPACING.lg,
    borderWidth: 1, borderColor: COLORS.primaryAlpha30,
  },
  btnEditarTxt:  { fontSize: FONTS.md, fontWeight: '600', color: COLORS.primary },
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
  handle:       { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.textMuted, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  sheetHeader:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.xl, paddingVertical: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.cardBorder, gap: SPACING.md },
  sheetIconWrap:{ width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  sheetTitle:   { fontSize: FONTS.lg, fontWeight: '700', color: COLORS.textPrimary },
  sheetSub:     { fontSize: FONTS.sm, color: COLORS.textMuted },
  closeBtn:     { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.cardBg, alignItems: 'center', justifyContent: 'center' },
  sheetContent: { padding: SPACING.xl, paddingBottom: 48 },

  bannerRecomendado: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.primaryAlpha12, borderRadius: RADIUS.lg,
    padding: SPACING.md, marginBottom: SPACING.xl,
    borderWidth: 1, borderColor: COLORS.primaryAlpha30,
  },
  bannerRecomendadoTitulo: { fontSize: FONTS.sm, color: COLORS.textMuted },
  bannerRecomendadoMonto:  { fontSize: FONTS.lg, fontWeight: '800', color: COLORS.primary },
  btnUsarRecomendado:      { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs },
  btnUsarRecomendadoTxt:   { fontSize: FONTS.sm, color: COLORS.white, fontWeight: '700' },

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

  btnConfirmar:             { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, paddingVertical: SPACING.lg, alignItems: 'center' },
  btnConfirmarDeshabilitado:{ opacity: 0.4 },
  btnConfirmarTxt:          { fontSize: FONTS.md, fontWeight: '700', color: COLORS.white },
});
