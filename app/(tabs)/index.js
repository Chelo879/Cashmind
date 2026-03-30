/**
 * app/(tabs)/index.js
 * Pantalla de inicio — resumen financiero, vencimientos y ahorros.
 */
import React, { useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../../components/ScreenWrapper';
import AnimatedBar from '../../components/AnimatedBar';
import SectionHeader from '../../components/SectionHeader';
import EmptyState from '../../components/EmptyState';
import CashmindModal from '../../components/CashmindModal';
import { COLORS, FONTS, RADIUS, SPACING } from '../../constants/theme';
import { fmt, fraction } from '../../utils/format';
import { canCoverMinimums } from '../../utils/optimizer';
import { useAppStore, agregarDeuda, agregarAhorro } from '../../utils/appStore';
import { useAuth } from '../../utils/authStore';

const SAVING_ICON_MAP = {
  shield: 'shield-checkmark', airplane: 'airplane', laptop: 'laptop',
  car: 'car', home: 'home', phone: 'phone-portrait', school: 'school',
  diamond: 'diamond', barbell: 'barbell', 'musical-notes': 'musical-notes',
  leaf: 'leaf', medkit: 'medkit',
};

function AlertaCrisis({ onPress }) {
  return (
    <TouchableOpacity style={styles.crisisAlert} onPress={onPress} activeOpacity={0.85}>
      <Ionicons name="alert-circle" size={18} color={COLORS.danger} />
      <View style={{ flex: 1 }}>
        <Text style={styles.crisisTitle}>Modo Crisis Activado</Text>
        <Text style={styles.crisisTxt}>Tu presupuesto no cubre todos los pagos mínimos. Ver plan recomendado.</Text>
      </View>
      <Text style={styles.crisisChevron}>›</Text>
    </TouchableOpacity>
  );
}

function TarjetaVencimiento({ item }) {
  const restante  = item.totalAmount - item.paidAmount;
  const isUrgent  = item.daysUntilDue <= 7;
  const isWarning = item.daysUntilDue <= 14 && !isUrgent;
  const badgeColor = isUrgent ? COLORS.danger : isWarning ? COLORS.warning : COLORS.success;
  const badgeLabel = isUrgent ? 'Urgente' : isWarning ? 'Próximo' : 'Al día';
  return (
    <View style={styles.deadlineCard}>
      <View style={[styles.deadlineDot, { backgroundColor: item.color }]} />
      <View style={{ flex: 1 }}>
        <Text style={styles.deadlineLabel}>{item.label}</Text>
        <Text style={styles.deadlineDue}>Vence {item.dueDateLabel}</Text>
      </View>
      <View style={styles.deadlineRight}>
        <Text style={styles.deadlineAmount}>{fmt(restante)}</Text>
        <View style={[styles.deadlineBadge, { backgroundColor: badgeColor + '22', borderColor: badgeColor + '55' }]}>
          <Text style={[styles.deadlineBadgeTxt, { color: badgeColor }]}>{badgeLabel}</Text>
        </View>
      </View>
    </View>
  );
}

function TarjetaAhorro({ item, onPress }) {
  const progreso = fraction(item.saved, item.goal);
  const iconName = SAVING_ICON_MAP[item.iconKey] ?? 'wallet-outline';
  return (
    <TouchableOpacity style={styles.savingCard} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.savingIconWrap, { backgroundColor: item.color + '22' }]}>
        <Ionicons name={iconName} size={22} color={item.color} />
      </View>
      <Text style={styles.savingLabel} numberOfLines={2}>{item.label}</Text>
      <Text style={styles.savingAmount}>{fmt(item.saved)}</Text>
      <Text style={styles.savingGoal}>de {fmt(item.goal)}</Text>
      <AnimatedBar progress={progreso} color={item.color} height={4} />
      {item.monthlyDeposit && (
        <Text style={styles.savingDeposit}>{fmt(item.monthlyDeposit)}/mes</Text>
      )}
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const router   = useRouter();
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const { debts, savings, budget } = useAppStore();
  const { user }                   = useAuth();
  const [modalType, setModalType]  = React.useState(null);

  const optimizerDebts = debts.map((d) => ({
    id: d.id, label: d.label,
    balance: d.totalAmount - d.paidAmount,
    cat: d.cat ?? 0,
    minPayment: d.minPayment ?? 0,
    penalty: d.penalty ?? 0,
    color: d.color,
  }));

  const isCrisis   = debts.length > 0 && !canCoverMinimums(optimizerDebts, budget);
  const totalDebt  = debts.reduce((s, d) => s + (d.totalAmount - d.paidAmount), 0);
  const totalSaved = savings.reduce((s, v) => s + v.saved, 0);
  const hasDebts   = debts.length > 0;
  const hasSavings = savings.length > 0;
  const hasAny     = hasDebts || hasSavings;

  const proximosVencimientos = [...debts]
    .filter((d) => d.totalAmount - d.paidAmount > 0)
    .map((d) => ({ ...d, daysUntilDue: d.daysUntilDue ?? 20 }))
    .sort((a, b) => a.daysUntilDue - b.daysUntilDue)
    .slice(0, 2);

  const nombreInicial = user.name ? user.name[0].toUpperCase() : '?';

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <ScreenWrapper>
      <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View>
          <Text style={styles.greeting}>
            {user.name ? `Hola, ${user.name}` : 'Bienvenido'}
          </Text>
          <Text style={styles.subGreeting}>Aquí está tu resumen financiero</Text>
        </View>
        <TouchableOpacity style={styles.avatarBtn} onPress={() => router.push('/profile')} activeOpacity={0.8}>
          <Text style={styles.avatarTxt}>{nombreInicial}</Text>
        </TouchableOpacity>
      </Animated.View>

      {!hasAny && (
        <Animated.View style={[styles.emptyWrap, { opacity: fadeAnim }]}>
          <EmptyState type="home" onAction={() => setModalType('debt')} />
        </Animated.View>
      )}

      {hasAny && (
        <>
          {isCrisis && (
            <Animated.View style={{ opacity: fadeAnim, marginBottom: SPACING.xl }}>
              <AlertaCrisis onPress={() => router.push('/reports')} />
            </Animated.View>
          )}

          <Animated.View style={[styles.heroCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.blob1} />
            <View style={styles.blob2} />
            <Text style={styles.heroLabel}>Deuda total pendiente</Text>
            <Text style={styles.heroAmount}>{fmt(totalDebt)}</Text>
            <View style={styles.heroRow}>
              <View style={styles.heroStat}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="cash-outline" size={12} color={COLORS.textMuted} />
                  <Text style={styles.heroStatLabel}>Ahorro total</Text>
                </View>
                <Text style={styles.heroStatValue}>{fmt(totalSaved)}</Text>
              </View>
              <View style={styles.heroDivider} />
              <View style={styles.heroStat}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="calendar-outline" size={12} color={COLORS.textMuted} />
                  <Text style={styles.heroStatLabel}>Presupuesto</Text>
                </View>
                <Text style={styles.heroStatValue}>{fmt(budget)}</Text>
              </View>
            </View>
          </Animated.View>

          {hasDebts && (
            <View style={styles.section}>
              <SectionHeader title="Próximos vencimientos" actionLabel="Ver todo" onAction={() => router.push('/debts')} />
              {proximosVencimientos.map((d) => <TarjetaVencimiento key={d.id} item={d} />)}
            </View>
          )}

          <View style={styles.section}>
            <SectionHeader title="Mis ahorros" actionLabel="Ver todo" onAction={() => router.push('/savings')} />
            {hasSavings ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
                {savings.map((s) => (
                  <TarjetaAhorro
                    key={s.id} item={s}
                    onPress={() => router.push({ pathname: '/savings/[id]', params: { id: s.id } })}
                  />
                ))}
              </ScrollView>
            ) : (
              <EmptyState type="saving" onAction={() => setModalType('saving')} />
            )}
          </View>
        </>
      )}

      <CashmindModal
        visible={!!modalType}
        type={modalType ?? 'debt'}
        onClose={() => setModalType(null)}
        onSaveDebt={(d)   => { agregarDeuda(d);  setModalType(null); }}
        onSaveSaving={(s) => { agregarAhorro(s); setModalType(null); }}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xl },
  greeting:    { fontSize: FONTS.xl, fontWeight: '700', color: COLORS.textPrimary, letterSpacing: -0.3 },
  subGreeting: { fontSize: FONTS.base, color: COLORS.textMuted, marginTop: 2 },
  avatarBtn:   { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  avatarTxt:   { color: COLORS.white, fontWeight: '700', fontSize: FONTS.lg },
  emptyWrap:   { flex: 1, justifyContent: 'center' },

  crisisAlert:   { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(239,68,68,0.12)', borderRadius: RADIUS.lg, borderWidth: 1, borderColor: 'rgba(239,68,68,0.35)', padding: SPACING.lg, gap: SPACING.sm },
  crisisTitle:   { fontSize: FONTS.base, fontWeight: '700', color: COLORS.danger, marginBottom: 2 },
  crisisTxt:     { fontSize: FONTS.sm, color: COLORS.textMuted, lineHeight: 18 },
  crisisChevron: { fontSize: FONTS.xxl, color: COLORS.danger },

  heroCard: {
    backgroundColor: COLORS.primaryDark, borderRadius: RADIUS.xl, padding: SPACING.xxl,
    marginBottom: SPACING.xxl, overflow: 'hidden',
    shadowColor: COLORS.primary, shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 8,
  },
  blob1:          { position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: COLORS.primaryAlpha40 },
  blob2:          { position: 'absolute', bottom: -30, left: -20, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(224,231,255,0.08)' },
  heroLabel:      { fontSize: FONTS.base, color: COLORS.textLight, marginBottom: 4 },
  heroAmount:     { fontSize: FONTS.hero, fontWeight: '800', color: COLORS.white, letterSpacing: -1, marginBottom: SPACING.xl },
  heroRow:        { flexDirection: 'row', alignItems: 'center' },
  heroStat:       { flex: 1 },
  heroStatLabel:  { fontSize: FONTS.sm, color: COLORS.textLight, marginBottom: 4 },
  heroStatValue:  { fontSize: FONTS.md, fontWeight: '700', color: COLORS.white },
  heroDivider:    { width: 1, height: 36, backgroundColor: COLORS.whiteAlpha20, marginHorizontal: SPACING.lg },

  section:          { marginBottom: SPACING.xxl },
  deadlineCard:     { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.cardBorder, gap: SPACING.sm },
  deadlineDot:      { width: 10, height: 10, borderRadius: 5 },
  deadlineLabel:    { fontSize: FONTS.base, fontWeight: '600', color: COLORS.textPrimary },
  deadlineDue:      { fontSize: FONTS.sm, color: COLORS.textMuted, marginTop: 2 },
  deadlineRight:    { alignItems: 'flex-end', gap: 4 },
  deadlineAmount:   { fontSize: FONTS.base, fontWeight: '700', color: COLORS.textPrimary },
  deadlineBadge:    { borderRadius: RADIUS.xl, paddingHorizontal: SPACING.sm, paddingVertical: 2, borderWidth: 1 },
  deadlineBadgeTxt: { fontSize: 10, fontWeight: '700' },

  savingCard:     { backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg, padding: SPACING.lg, marginRight: SPACING.md, width: 150, borderWidth: 1, borderColor: COLORS.cardBorder },
  savingIconWrap: { width: 44, height: 44, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  savingLabel:    { fontSize: FONTS.sm, color: COLORS.textMuted, marginBottom: 8, lineHeight: 16 },
  savingAmount:   { fontSize: FONTS.lg - 1, fontWeight: '700', color: COLORS.textPrimary },
  savingGoal:     { fontSize: FONTS.sm, color: COLORS.textMuted, marginBottom: 8 },
  savingDeposit:  { fontSize: FONTS.sm, color: COLORS.primary, fontWeight: '700', marginTop: 6 },
});
