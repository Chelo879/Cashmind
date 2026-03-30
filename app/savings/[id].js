import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  TextInput, Animated, KeyboardAvoidingView,
  Platform, TouchableWithoutFeedback,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import ScreenWrapper from '../../components/ScreenWrapper';
import AnimatedBar from '../../components/AnimatedBar';
import { COLORS, FONTS, RADIUS, SPACING } from '../../constants/theme';
import { mockSavings } from '../../constants/mockData';
import { fmt, fraction } from '../../utils/format';

function InfoRow({ label, value, valueColor }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, valueColor && { color: valueColor }]}>{value}</Text>
    </View>
  );
}

// ─── Deposit Modal ────────────────────────────────────────────────────────────
function DepositModal({ visible, saving, onConfirm, onClose }) {
  const [amount, setAmount] = useState(saving?.monthlyDeposit?.toString() ?? '');
  const slideAnim = React.useRef(new Animated.Value(600)).current;

  React.useEffect(() => {
    if (visible) {
      setAmount(saving?.monthlyDeposit?.toString() ?? '');
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 200 }).start();
    } else {
      Animated.timing(slideAnim, { toValue: 600, duration: 250, useNativeDriver: true }).start();
    }
  }, [visible]);

  const remaining = saving ? saving.goal - saving.saved : 0;
  const parsed    = parseFloat(amount) || 0;
  const isOverMax = parsed > remaining;
  const isValid   = parsed > 0 && !isOverMax;

  const newSaved  = isValid ? saving.saved + parsed : saving?.saved ?? 0;
  const newPct    = saving ? fraction(newSaved, saving.goal) : 0;
  const isComplete = newSaved >= (saving?.goal ?? 0);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>

        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.sheetHeader}>
            <View style={[styles.sheetIconWrap, { backgroundColor: saving?.color + '22' }]}>
              <Text style={styles.sheetIconEmoji}>{saving?.emoji ?? '💰'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sheetTitle}>Registrar deposito</Text>
              <Text style={styles.sheetSub}>{saving?.label}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnTxt}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.sheetContent}>
            {/* Suggested deposit banner */}
            {saving?.monthlyDeposit && (
              <View style={styles.suggestedBanner}>
                <Text style={styles.suggestedIcon}>💡</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.suggestedTitle}>Deposito mensual sugerido</Text>
                  <Text style={styles.suggestedAmt}>{fmt(saving.monthlyDeposit)}</Text>
                  {saving.months && (
                    <Text style={styles.suggestedHint}>Para alcanzar tu meta en {saving.months} meses</Text>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.useSuggestedBtn}
                  onPress={() => setAmount(saving.monthlyDeposit.toString())}
                >
                  <Text style={styles.useSuggestedTxt}>Usar</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Amount input */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Monto a depositar</Text>
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
                <Text style={styles.errorTxt}>
                  El monto supera lo que falta por ahorrar ({fmt(remaining)})
                </Text>
              )}
            </View>

            {/* Preview */}
            {isValid && (
              <View style={styles.previewCard}>
                <Text style={styles.previewTitle}>Vista previa del resultado</Text>
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Total ahorrado</Text>
                  <Text style={styles.previewValue}>{fmt(newSaved)}</Text>
                </View>
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Por alcanzar</Text>
                  <Text style={styles.previewValue}>{fmt(Math.max(0, saving.goal - newSaved))}</Text>
                </View>
                <AnimatedBar progress={newPct} color={saving?.color ?? COLORS.primary} height={6} />
                <Text style={styles.previewPct}>{Math.round(newPct * 100)}% alcanzado</Text>
                {isComplete && (
                  <Text style={styles.completeHint}>🎉 Alcanzaras tu meta con este deposito</Text>
                )}
              </View>
            )}

            {/* Confirm */}
            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: saving?.color ?? COLORS.primary }, !isValid && styles.confirmBtnDisabled]}
              onPress={() => isValid && onConfirm(parsed)}
              activeOpacity={0.85}
              disabled={!isValid}
            >
              <Text style={styles.confirmBtnTxt}>
                Confirmar deposito de {isValid ? fmt(parsed) : '$0.00'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function SavingDetailScreen() {
  const { id }  = useLocalSearchParams();
  const router  = useRouter();

  const [savings,      setSavings]      = useState(mockSavings);
  const [modalVisible, setModalVisible] = useState(false);
  const [deposited,    setDeposited]    = useState(false);

  const saving = savings.find((s) => s.id === id);
  if (!saving) return null;

  const remaining  = saving.goal - saving.saved;
  const progress   = fraction(saving.saved, saving.goal);
  const isComplete = saving.saved >= saving.goal;

  const handleConfirmDeposit = (amount) => {
    setSavings((prev) => prev.map((s) =>
      s.id === id
        ? { ...s, saved: Math.min(s.saved + amount, s.goal) }
        : s
    ));
    setModalVisible(false);
    setDeposited(true);
  };

  return (
    <ScreenWrapper>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backTxt}>← Volver</Text>
      </TouchableOpacity>

      {/* Success banner */}
      {deposited && (
        <View style={styles.successBanner}>
          <Text style={styles.successIcon}>✅</Text>
          <Text style={styles.successTxt}>Deposito registrado correctamente</Text>
        </View>
      )}

      {/* Hero */}
      <View style={[styles.heroCard, { borderTopColor: saving.color }]}>
        <Text style={styles.heroEmoji}>{saving.emoji}</Text>
        <Text style={styles.heroTitle}>{saving.label}</Text>
        <Text style={styles.heroAmount}>{fmt(saving.saved)}</Text>
        <Text style={styles.heroSub}>ahorrado de {fmt(saving.goal)}</Text>
        <View style={styles.progressWrap}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Progreso</Text>
            <Text style={[styles.progressPct, { color: saving.color }]}>{Math.round(progress * 100)}%</Text>
          </View>
          <AnimatedBar progress={progress} color={saving.color} height={10} />
        </View>
      </View>

      {/* Monthly deposit hint */}
      {saving.monthlyDeposit && !isComplete && (
        <View style={styles.depositHint}>
          <Text style={styles.depositHintIcon}>💡</Text>
          <Text style={styles.depositHintTxt}>
            Deposita{' '}
            <Text style={styles.depositHintAmt}>{fmt(saving.monthlyDeposit)}/mes</Text>
            {saving.months ? ` para alcanzar tu meta en ${saving.months} meses` : ' para alcanzar tu meta a tiempo'}
          </Text>
        </View>
      )}

      {/* Details */}
      <View style={styles.detailCard}>
        <Text style={styles.detailTitle}>Detalles</Text>
        <InfoRow label="Meta total"     value={fmt(saving.goal)} />
        <InfoRow label="Ya ahorrado"    value={fmt(saving.saved)}  valueColor={COLORS.success} />
        <InfoRow label="Por alcanzar"   value={fmt(remaining)} />
        <InfoRow label="Fecha objetivo" value={saving.targetDate} />
        {saving.months && <InfoRow label="Plazo" value={`${saving.months} meses`} />}
        {saving.monthlyDeposit && <InfoRow label="Deposito sugerido" value={`${fmt(saving.monthlyDeposit)}/mes`} valueColor={COLORS.primary} />}
      </View>

      {/* Buttons */}
      {!isComplete ? (
        <TouchableOpacity
          style={[styles.depositBtn, { backgroundColor: saving.color }]}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.85}
        >
          <Text style={styles.depositBtnTxt}>Registrar deposito</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.completeBadge}>
          <Text style={styles.completeBadgeTxt}>🎉 Meta alcanzada</Text>
        </View>
      )}
      <TouchableOpacity style={styles.editBtn} activeOpacity={0.85}>
        <Text style={styles.editBtnTxt}>Editar objetivo</Text>
      </TouchableOpacity>

      {/* Modal */}
      <DepositModal
        visible={modalVisible}
        saving={saving}
        onConfirm={handleConfirmDeposit}
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
  heroEmoji:     { fontSize: 48, marginBottom: SPACING.md },
  heroTitle:     { fontSize: FONTS.xl, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.lg },
  heroAmount:    { fontSize: FONTS.hero - 4, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.5 },
  heroSub:       { fontSize: FONTS.base, color: COLORS.textMuted, marginTop: 4, marginBottom: SPACING.xl },
  progressWrap:  { width: '100%' },
  progressHeader:{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: FONTS.sm, color: COLORS.textMuted },
  progressPct:   { fontSize: FONTS.sm, fontWeight: '700' },

  depositHint: {
    flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm,
    backgroundColor: COLORS.primaryAlpha12, borderRadius: RADIUS.md,
    padding: SPACING.md, marginBottom: SPACING.md,
    borderWidth: 1, borderColor: COLORS.primaryAlpha30,
  },
  depositHintIcon: { fontSize: 16 },
  depositHintTxt:  { flex: 1, fontSize: FONTS.sm, color: COLORS.textMuted, lineHeight: 18 },
  depositHintAmt:  { color: COLORS.primary, fontWeight: '700' },

  detailCard:  { backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.xl, borderWidth: 1, borderColor: COLORS.cardBorder },
  detailTitle: { fontSize: FONTS.md, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.md },
  infoRow:     { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.cardBorder },
  infoLabel:   { fontSize: FONTS.base, color: COLORS.textMuted },
  infoValue:   { fontSize: FONTS.base, fontWeight: '600', color: COLORS.textPrimary },

  depositBtn:    { borderRadius: RADIUS.lg, paddingVertical: SPACING.lg, alignItems: 'center', marginBottom: SPACING.md },
  depositBtnTxt: { fontSize: FONTS.md, fontWeight: '700', color: COLORS.white },
  editBtn:       { backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg, paddingVertical: SPACING.lg, alignItems: 'center', borderWidth: 1, borderColor: COLORS.cardBorder },
  editBtnTxt:    { fontSize: FONTS.md, fontWeight: '600', color: COLORS.textMuted },
  completeBadge: { backgroundColor: 'rgba(16,185,129,0.12)', borderRadius: RADIUS.lg, paddingVertical: SPACING.lg, alignItems: 'center', marginBottom: SPACING.md, borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)' },
  completeBadgeTxt:{ fontSize: FONTS.md, fontWeight: '700', color: COLORS.success },

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
  sheetIconEmoji:{ fontSize: 20 },
  sheetTitle:   { fontSize: FONTS.lg, fontWeight: '700', color: COLORS.textPrimary },
  sheetSub:     { fontSize: FONTS.sm, color: COLORS.textMuted },
  closeBtn:     { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.cardBg, alignItems: 'center', justifyContent: 'center' },
  closeBtnTxt:  { fontSize: FONTS.base, color: COLORS.textMuted },
  sheetContent: { padding: SPACING.xl, paddingBottom: 48 },

  suggestedBanner: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.primaryAlpha12, borderRadius: RADIUS.lg,
    padding: SPACING.md, marginBottom: SPACING.xl,
    borderWidth: 1, borderColor: COLORS.primaryAlpha30,
  },
  suggestedIcon:  { fontSize: 20 },
  suggestedTitle: { fontSize: FONTS.sm, color: COLORS.textMuted },
  suggestedAmt:   { fontSize: FONTS.lg, fontWeight: '800', color: COLORS.primary },
  suggestedHint:  { fontSize: FONTS.sm, color: COLORS.textMuted, marginTop: 2 },
  useSuggestedBtn:{ backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs },
  useSuggestedTxt:{ fontSize: FONTS.sm, color: COLORS.white, fontWeight: '700' },

  field:       { marginBottom: SPACING.lg },
  fieldLabel:  { fontSize: FONTS.base, fontWeight: '600', color: COLORS.textPrimary, marginBottom: SPACING.sm },
  inputWrap:   { position: 'relative' },
  inputPrefix: { position: 'absolute', left: 12, top: 14, fontSize: FONTS.base, color: COLORS.textMuted, zIndex: 1 },
  input: {
    backgroundColor: COLORS.cardBg, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.cardBorder,
    paddingLeft: 32, paddingRight: SPACING.lg, paddingVertical: SPACING.md,
    fontSize: FONTS.xl, fontWeight: '700', color: COLORS.textPrimary,
  },
  errorTxt: { fontSize: FONTS.sm, color: COLORS.danger, marginTop: SPACING.xs },

  previewCard:   { backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.lg, borderWidth: 1, borderColor: COLORS.cardBorder },
  previewTitle:  { fontSize: FONTS.sm, color: COLORS.textMuted, marginBottom: SPACING.sm },
  previewRow:    { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm },
  previewLabel:  { fontSize: FONTS.base, color: COLORS.textMuted },
  previewValue:  { fontSize: FONTS.base, fontWeight: '700', color: COLORS.textPrimary },
  previewPct:    { fontSize: FONTS.sm, color: COLORS.textMuted, textAlign: 'right', marginTop: 4 },
  completeHint:  { fontSize: FONTS.sm, color: COLORS.success, fontWeight: '600', textAlign: 'center', marginTop: SPACING.sm },

  confirmBtn:         { borderRadius: RADIUS.lg, paddingVertical: SPACING.lg, alignItems: 'center' },
  confirmBtnDisabled: { opacity: 0.4 },
  confirmBtnTxt:      { fontSize: FONTS.md, fontWeight: '700', color: COLORS.white },
});
