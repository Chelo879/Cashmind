import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  TextInput, Animated, KeyboardAvoidingView,
  Platform, TouchableWithoutFeedback,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import ScreenWrapper from '../../components/ScreenWrapper';
import AnimatedBar from '../../components/AnimatedBar';
import { COLORS, FONTS, RADIUS, SPACING } from '../../constants/theme';
import { mockDebts, optimizerDebts, mockUser } from '../../constants/mockData';
import { fmt, fraction } from '../../utils/format';
import { simplexDistribute, grandMDistribute, canCoverMinimums } from '../../utils/optimizer';

function InfoRow({ label, value, valueColor }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, valueColor && { color: valueColor }]}>{value}</Text>
    </View>
  );
}

// ─── Payment Modal ────────────────────────────────────────────────────────────
function PaymentModal({ visible, debt, recommendedPayment, onConfirm, onClose }) {
  const [amount, setAmount] = useState(recommendedPayment?.toString() ?? '');
  const slideAnim = React.useRef(new Animated.Value(600)).current;

  React.useEffect(() => {
    if (visible) {
      setAmount(recommendedPayment?.toString() ?? '');
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 200 }).start();
    } else {
      Animated.timing(slideAnim, { toValue: 600, duration: 250, useNativeDriver: true }).start();
    }
  }, [visible, recommendedPayment]);

  const remaining  = debt ? debt.totalAmount - debt.paidAmount : 0;
  const parsed     = parseFloat(amount) || 0;
  const isOverMax  = parsed > remaining;
  const isValid    = parsed > 0 && !isOverMax;

  const newBalance = isValid ? Math.max(0, remaining - parsed) : remaining;
  const newPct     = isValid ? fraction(debt.paidAmount + parsed, debt.totalAmount) : fraction(debt?.paidAmount ?? 0, debt?.totalAmount ?? 1);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        enabled={Platform.OS === 'ios'}
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>

        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.sheetHeader}>
            <View style={[styles.sheetIconWrap, { backgroundColor: debt?.color + '22' }]}>
              <Text style={styles.sheetIcon}>💳</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sheetTitle}>Registrar pago</Text>
              <Text style={styles.sheetSub}>{debt?.label}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnTxt}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.sheetContent}>
            {/* Recommended banner */}
            {recommendedPayment > 0 && (
              <View style={styles.recommendedBanner}>
                <Text style={styles.recommendedIcon}>🤖</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.recommendedTitle}>Pago recomendado por el optimizador</Text>
                  <Text style={styles.recommendedAmt}>{fmt(recommendedPayment)}</Text>
                </View>
                <TouchableOpacity
                  style={styles.useRecommendedBtn}
                  onPress={() => setAmount(recommendedPayment.toString())}
                >
                  <Text style={styles.useRecommendedTxt}>Usar</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Amount input */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Monto a pagar</Text>
              <View style={styles.inputWrap}>
                <Text style={styles.inputPrefix}>$</Text>
                <TextInput
                  style={styles.input}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={COLORS.textMuted}
                  autoFocus
                />
              </View>
              {isOverMax && (
                <Text style={styles.errorTxt}>El monto supera el saldo restante de {fmt(remaining)}</Text>
              )}
            </View>

            {/* Preview */}
            {isValid && (
              <View style={styles.previewCard}>
                <Text style={styles.previewTitle}>Vista previa del resultado</Text>
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Saldo restante</Text>
                  <Text style={styles.previewValue}>{fmt(newBalance)}</Text>
                </View>
                <AnimatedBar progress={newPct} color={debt?.color ?? COLORS.primary} height={6} />
                <Text style={styles.previewPct}>{Math.round(newPct * 100)}% pagado</Text>
              </View>
            )}

            {/* Confirm */}
            <TouchableOpacity
              style={[styles.confirmBtn, !isValid && styles.confirmBtnDisabled]}
              onPress={() => isValid && onConfirm(parsed)}
              activeOpacity={0.85}
              disabled={!isValid}
            >
              <Text style={styles.confirmBtnTxt}>Confirmar pago de {isValid ? fmt(parsed) : '$0.00'}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function DebtDetailScreen() {
  const { id }  = useLocalSearchParams();
  const router  = useRouter();

  const [debts,        setDebts]        = useState(mockDebts);
  const [modalVisible, setModalVisible] = useState(false);
  const [paid,         setPaid]         = useState(false);

  const debt = debts.find((d) => d.id === id);
  if (!debt) return null;

  const remaining = debt.totalAmount - debt.paidAmount;
  const progress  = fraction(debt.paidAmount, debt.totalAmount);

  // Obtener pago recomendado del optimizador para esta deuda
  const isCrisis  = !canCoverMinimums(optimizerDebts, mockUser.monthlyBudget);
  const payments  = isCrisis
    ? grandMDistribute(optimizerDebts, mockUser.monthlyBudget).payments
    : simplexDistribute(optimizerDebts, mockUser.monthlyBudget);
  const recommended = payments.find((p) => p.debtId === id);
  const recommendedPayment = recommended?.sacrificed ? 0 : (recommended?.payment ?? 0);

  const handleConfirmPayment = (amount) => {
    setDebts((prev) => prev.map((d) =>
      d.id === id
        ? { ...d, paidAmount: Math.min(d.paidAmount + amount, d.totalAmount) }
        : d
    ));
    setModalVisible(false);
    setPaid(true);
  };

  const isFullyPaid = debt.paidAmount >= debt.totalAmount;

  return (
    <ScreenWrapper>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backTxt}>← Volver</Text>
      </TouchableOpacity>

      {/* Success banner */}
      {paid && (
        <View style={styles.successBanner}>
          <Text style={styles.successIcon}>✅</Text>
          <Text style={styles.successTxt}>Pago registrado correctamente</Text>
        </View>
      )}

      {/* Hero */}
      <View style={[styles.heroCard, { borderTopColor: debt.color }]}>
        <View style={[styles.heroIcon, { backgroundColor: debt.color + '22' }]}>
          <Text style={[styles.heroIconTxt, { color: debt.color }]}>💳</Text>
        </View>
        <Text style={styles.heroTitle}>{debt.label}</Text>
        <Text style={styles.heroCategory}>{debt.category}</Text>
        <Text style={styles.heroAmount}>{fmt(remaining)}</Text>
        <Text style={styles.heroSub}>pendiente de {fmt(debt.totalAmount)}</Text>
        <View style={styles.progressWrap}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Progreso de pago</Text>
            <Text style={[styles.progressPct, { color: debt.color }]}>{Math.round(progress * 100)}%</Text>
          </View>
          <AnimatedBar progress={progress} color={debt.color} height={10} />
        </View>
      </View>

      {/* Optimizador hint */}
      {recommendedPayment > 0 && !isFullyPaid && (
        <View style={styles.optimizerHint}>
          <Text style={styles.optimizerHintIcon}>🤖</Text>
          <Text style={styles.optimizerHintTxt}>
            El optimizador sugiere pagar{' '}
            <Text style={styles.optimizerHintAmt}>{fmt(recommendedPayment)}</Text>
            {' '}este mes para minimizar intereses
          </Text>
        </View>
      )}

      {recommended?.sacrificed && (
        <View style={styles.crisisHint}>
          <Text style={styles.crisisHintIcon}>🚨</Text>
          <Text style={styles.crisisHintTxt}>
            Modo crisis — el optimizador sugiere omitir este pago este mes para minimizar penalizaciones
          </Text>
        </View>
      )}

      {/* Details */}
      <View style={styles.detailCard}>
        <Text style={styles.detailTitle}>Detalles</Text>
        <InfoRow label="Total original"       value={fmt(debt.totalAmount)} />
        <InfoRow label="Ya pagado"            value={fmt(debt.paidAmount)}  valueColor={COLORS.success} />
        <InfoRow label="Restante"             value={fmt(remaining)}        valueColor={COLORS.danger} />
        <InfoRow label="Tasa de interes"      value={`${debt.interestRate ?? debt.cat}% anual`} />
        <InfoRow label="Fecha de vencimiento" value={`Vence ${debt.dueDateLabel}`} />
        {debt.minPayment && <InfoRow label="Pago minimo" value={fmt(debt.minPayment)} />}
      </View>

      {/* Buttons */}
      {!isFullyPaid ? (
        <TouchableOpacity style={styles.payBtn} onPress={() => setModalVisible(true)} activeOpacity={0.85}>
          <Text style={styles.payBtnTxt}>Registrar pago</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.paidBadge}>
          <Text style={styles.paidBadgeTxt}>🎉 Deuda liquidada</Text>
        </View>
      )}
      <TouchableOpacity style={styles.editBtn} activeOpacity={0.85}>
        <Text style={styles.editBtnTxt}>Editar deuda</Text>
      </TouchableOpacity>

      {/* Modal */}
      <PaymentModal
        visible={modalVisible}
        debt={debt}
        recommendedPayment={recommendedPayment}
        onConfirm={handleConfirmPayment}
        onClose={() => setModalVisible(false)}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  backBtn: { marginBottom: SPACING.lg },
  backTxt: { fontSize: FONTS.md, color: COLORS.primary, fontWeight: '600' },

  successBanner: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: 'rgba(16,185,129,0.12)', borderRadius: RADIUS.lg,
    padding: SPACING.md, marginBottom: SPACING.lg,
    borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)',
  },
  successIcon: { fontSize: 18 },
  successTxt:  { fontSize: FONTS.base, color: COLORS.success, fontWeight: '600' },

  heroCard: {
    backgroundColor: COLORS.cardBg, borderRadius: RADIUS.xl,
    padding: SPACING.xxl, marginBottom: SPACING.md,
    borderWidth: 1, borderColor: COLORS.cardBorder,
    borderTopWidth: 3, alignItems: 'center',
  },
  heroIcon:      { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md },
  heroIconTxt:   { fontSize: 28 },
  heroTitle:     { fontSize: FONTS.xl, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  heroCategory:  { fontSize: FONTS.base, color: COLORS.textMuted, marginBottom: SPACING.lg },
  heroAmount:    { fontSize: FONTS.hero - 4, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.5 },
  heroSub:       { fontSize: FONTS.base, color: COLORS.textMuted, marginTop: 4, marginBottom: SPACING.xl },
  progressWrap:  { width: '100%' },
  progressHeader:{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: FONTS.sm, color: COLORS.textMuted },
  progressPct:   { fontSize: FONTS.sm, fontWeight: '700' },

  optimizerHint: {
    flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm,
    backgroundColor: COLORS.primaryAlpha12, borderRadius: RADIUS.md,
    padding: SPACING.md, marginBottom: SPACING.md,
    borderWidth: 1, borderColor: COLORS.primaryAlpha30,
  },
  optimizerHintIcon: { fontSize: 16 },
  optimizerHintTxt:  { flex: 1, fontSize: FONTS.sm, color: COLORS.textMuted, lineHeight: 18 },
  optimizerHintAmt:  { color: COLORS.primary, fontWeight: '700' },

  crisisHint: {
    flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm,
    backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: RADIUS.md,
    padding: SPACING.md, marginBottom: SPACING.md,
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
  },
  crisisHintIcon: { fontSize: 16 },
  crisisHintTxt:  { flex: 1, fontSize: FONTS.sm, color: COLORS.textMuted, lineHeight: 18 },

  detailCard:  { backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.xl, borderWidth: 1, borderColor: COLORS.cardBorder },
  detailTitle: { fontSize: FONTS.md, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.md },
  infoRow:     { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.cardBorder },
  infoLabel:   { fontSize: FONTS.base, color: COLORS.textMuted },
  infoValue:   { fontSize: FONTS.base, fontWeight: '600', color: COLORS.textPrimary },

  payBtn:     { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, paddingVertical: SPACING.lg, alignItems: 'center', marginBottom: SPACING.md },
  payBtnTxt:  { fontSize: FONTS.md, fontWeight: '700', color: COLORS.white },
  editBtn:    { backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg, paddingVertical: SPACING.lg, alignItems: 'center', borderWidth: 1, borderColor: COLORS.cardBorder },
  editBtnTxt: { fontSize: FONTS.md, fontWeight: '600', color: COLORS.textMuted },
  paidBadge:  { backgroundColor: 'rgba(16,185,129,0.12)', borderRadius: RADIUS.lg, paddingVertical: SPACING.lg, alignItems: 'center', marginBottom: SPACING.md, borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)' },
  paidBadgeTxt:{ fontSize: FONTS.md, fontWeight: '700', color: COLORS.success },

  // Modal
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.background, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    borderTopWidth: 1, borderColor: COLORS.cardBorder,
  },
  handle:      { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.textMuted, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.xl, paddingVertical: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.cardBorder, gap: SPACING.md },
  sheetIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  sheetIcon:   { fontSize: 18 },
  sheetTitle:  { fontSize: FONTS.lg, fontWeight: '700', color: COLORS.textPrimary },
  sheetSub:    { fontSize: FONTS.sm, color: COLORS.textMuted },
  closeBtn:    { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.cardBg, alignItems: 'center', justifyContent: 'center' },
  closeBtnTxt: { fontSize: FONTS.base, color: COLORS.textMuted },
  sheetContent:{ padding: SPACING.xl, paddingBottom: 48 },

  recommendedBanner: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.primaryAlpha12, borderRadius: RADIUS.lg,
    padding: SPACING.md, marginBottom: SPACING.xl,
    borderWidth: 1, borderColor: COLORS.primaryAlpha30,
  },
  recommendedIcon:  { fontSize: 20 },
  recommendedTitle: { fontSize: FONTS.sm, color: COLORS.textMuted },
  recommendedAmt:   { fontSize: FONTS.lg, fontWeight: '800', color: COLORS.primary },
  useRecommendedBtn:{ backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs },
  useRecommendedTxt:{ fontSize: FONTS.sm, color: COLORS.white, fontWeight: '700' },

  field:        { marginBottom: SPACING.lg },
  fieldLabel:   { fontSize: FONTS.base, fontWeight: '600', color: COLORS.textPrimary, marginBottom: SPACING.sm },
  inputWrap:    { position: 'relative' },
  inputPrefix:  { position: 'absolute', left: 12, top: 14, fontSize: FONTS.base, color: COLORS.textMuted, zIndex: 1 },
  input: {
    backgroundColor: COLORS.cardBg, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.cardBorder,
    paddingLeft: 32, paddingRight: SPACING.lg, paddingVertical: SPACING.md,
    fontSize: FONTS.xl, fontWeight: '700', color: COLORS.textPrimary,
  },
  errorTxt: { fontSize: FONTS.sm, color: COLORS.danger, marginTop: SPACING.xs },

  previewCard:  { backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.lg, borderWidth: 1, borderColor: COLORS.cardBorder },
  previewTitle: { fontSize: FONTS.sm, color: COLORS.textMuted, marginBottom: SPACING.sm },
  previewRow:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm },
  previewLabel: { fontSize: FONTS.base, color: COLORS.textMuted },
  previewValue: { fontSize: FONTS.base, fontWeight: '700', color: COLORS.textPrimary },
  previewPct:   { fontSize: FONTS.sm, color: COLORS.textMuted, textAlign: 'right', marginTop: 4 },

  confirmBtn:         { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, paddingVertical: SPACING.lg, alignItems: 'center' },
  confirmBtnDisabled: { opacity: 0.4 },
  confirmBtnTxt:      { fontSize: FONTS.md, fontWeight: '700', color: COLORS.white },
});
