import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import ScreenWrapper from '../components/ScreenWrapper';
import AnimatedBar from '../components/AnimatedBar';
import SectionHeader from '../components/SectionHeader';
import EmptyState from '../components/EmptyState';
import CashmindModal from '../components/CashmindModal';
import { COLORS, FONTS, RADIUS, SPACING } from '../constants/theme';
import { mockDebts, mockSavings, mockSummary, mockUser, optimizerDebts } from '../constants/mockData';
import { fmt, fraction } from '../utils/format';
import { canCoverMinimums } from '../utils/optimizer';

function CrisisAlert({ onPress }) {
  return (
    <TouchableOpacity style={styles.crisisAlert} onPress={onPress} activeOpacity={0.85}>
      <Text style={styles.crisisIcon}>🚨</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.crisisTitle}>Modo Crisis Activado</Text>
        <Text style={styles.crisisTxt}>Tu presupuesto no cubre todos los pagos minimos. Ver plan recomendado.</Text>
      </View>
      <Text style={styles.crisisChevron}>›</Text>
    </TouchableOpacity>
  );
}

function DeadlineCard({ item }) {
  const remaining  = item.totalAmount - item.paidAmount;
  const isUrgent   = item.daysUntilDue <= 7;
  const isWarning  = item.daysUntilDue <= 14 && !isUrgent;
  const badgeColor = isUrgent ? COLORS.danger : isWarning ? COLORS.warning : COLORS.success;
  const badgeLabel = isUrgent ? 'Urgente' : isWarning ? 'Proximo' : 'Al dia';
  return (
    <View style={styles.deadlineCard}>
      <View style={[styles.deadlineDot, { backgroundColor: item.color }]} />
      <View style={{ flex: 1 }}>
        <Text style={styles.deadlineLabel}>{item.label}</Text>
        <Text style={styles.deadlineDue}>Vence {item.dueDateLabel}</Text>
      </View>
      <View style={styles.deadlineRight}>
        <Text style={styles.deadlineAmount}>{fmt(remaining)}</Text>
        <View style={[styles.deadlineBadge, { backgroundColor: badgeColor + '22', borderColor: badgeColor + '55' }]}>
          <Text style={[styles.deadlineBadgeTxt, { color: badgeColor }]}>{badgeLabel}</Text>
        </View>
      </View>
    </View>
  );
}

function SavingCard({ item, onPress }) {
  const progress = fraction(item.saved, item.goal);
  return (
    <TouchableOpacity style={styles.savingCard} onPress={onPress} activeOpacity={0.8}>
      <Text style={styles.savingEmoji}>{item.emoji}</Text>
      <Text style={styles.savingLabel} numberOfLines={2}>{item.label}</Text>
      <Text style={styles.savingAmount}>{fmt(item.saved)}</Text>
      <Text style={styles.savingGoal}>de {fmt(item.goal)}</Text>
      <AnimatedBar progress={progress} color={item.color} height={4} />
      {item.monthlyDeposit && (
        <Text style={styles.savingDeposit}>{fmt(item.monthlyDeposit)}/mes</Text>
      )}
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const router    = useRouter();
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const [debts,     setDebts]     = useState(mockDebts);
  const [savings,   setSavings]   = useState(mockSavings);
  const [modalType, setModalType] = useState(null);

  const isCrisis   = !canCoverMinimums(optimizerDebts, mockUser.monthlyBudget);
  const goalPct    = fraction(mockSummary.monthlySaved, mockSummary.monthlyGoal);
  const hasDebts   = debts.length > 0;
  const hasSavings = savings.length > 0;
  const hasAny     = hasDebts || hasSavings;

  const upcomingDebts = [...debts]
    .filter((d) => d.totalAmount - d.paidAmount > 0)
    .map((d) => {
      const urgencyMap = { '28 Mar': 3, '4 Abr': 8, '1 de cada mes': 12 };
      return { ...d, daysUntilDue: urgencyMap[d.dueDateLabel] ?? 20 };
    })
    .sort((a, b) => a.daysUntilDue - b.daysUntilDue)
    .slice(0, 2);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <ScreenWrapper>
      {/* Header — siempre visible */}
      <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View>
          <Text style={styles.greeting}>Hola, {mockUser.name} 👋</Text>
          <Text style={styles.subGreeting}>Aqui esta tu resumen financiero</Text>
        </View>
        <TouchableOpacity style={styles.avatarBtn} onPress={() => router.push('/profile')} activeOpacity={0.8}>
          <Text style={styles.avatarTxt}>{mockUser.name[0]}</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Estado vacío — usuario nuevo sin datos */}
      {!hasAny && (
        <Animated.View style={[styles.emptyWrap, { opacity: fadeAnim }]}>
          <EmptyState type="home" onAction={() => setModalType('debt')} />
        </Animated.View>
      )}

      {/* Contenido normal — cuando hay datos */}
      {hasAny && (
        <>
          {isCrisis && (
            <Animated.View style={{ opacity: fadeAnim, marginBottom: SPACING.xl }}>
              <CrisisAlert onPress={() => router.push('/reports')} />
            </Animated.View>
          )}

          <Animated.View style={[styles.heroCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.blob1} />
            <View style={styles.blob2} />
            <Text style={styles.heroLabel}>Deuda total pendiente</Text>
            <Text style={styles.heroAmount}>{fmt(mockSummary.totalDebt)}</Text>
            <View style={styles.heroRow}>
              <View style={styles.heroStat}>
                <Text style={styles.heroStatLabel}>💰 Ahorro total</Text>
                <Text style={styles.heroStatValue}>{fmt(mockSummary.totalSaved)}</Text>
              </View>
              <View style={styles.heroDivider} />
              <View style={styles.heroStat}>
                <Text style={styles.heroStatLabel}>📅 Presupuesto</Text>
                <Text style={styles.heroStatValue}>{fmt(mockUser.monthlyBudget)}</Text>
              </View>
            </View>
            <View style={styles.heroProgressHeader}>
              <Text style={styles.heroProgressLabel}>Progreso del mes</Text>
              <Text style={styles.heroProgressPct}>{Math.round(goalPct * 100)}%</Text>
            </View>
            <AnimatedBar progress={goalPct} color={COLORS.lavender} height={8} />
          </Animated.View>

          {hasDebts && (
            <View style={styles.section}>
              <SectionHeader title="Proximos vencimientos" actionLabel="Ver todo" onAction={() => router.push('/debts')} />
              {upcomingDebts.map((d) => (
                <DeadlineCard key={d.id} item={d} />
              ))}
            </View>
          )}

          <View style={styles.section}>
            <SectionHeader title="Mis ahorros" actionLabel="Ver todo" onAction={() => router.push('/savings')} />
            {hasSavings ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
                {savings.map((s) => (
                  <SavingCard
                    key={s.id}
                    item={s}
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
        onSaveDebt={(d)   => { setDebts((p)   => [...p, d]); setModalType(null); }}
        onSaveSaving={(s) => { setSavings((p) => [...p, s]); setModalType(null); }}
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

  emptyWrap: { flex: 1, justifyContent: 'center' },

  crisisAlert: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(239,68,68,0.12)', borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.35)',
    padding: SPACING.lg, gap: SPACING.sm,
  },
  crisisIcon:    { fontSize: 20 },
  crisisTitle:   { fontSize: FONTS.base, fontWeight: '700', color: COLORS.danger, marginBottom: 2 },
  crisisTxt:     { fontSize: FONTS.sm, color: COLORS.textMuted, lineHeight: 18 },
  crisisChevron: { fontSize: FONTS.xxl, color: COLORS.danger },

  heroCard: {
    backgroundColor: COLORS.primaryDark, borderRadius: RADIUS.xl, padding: SPACING.xxl,
    marginBottom: SPACING.xxl, overflow: 'hidden',
    shadowColor: COLORS.primary, shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 8,
  },
  blob1: { position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: COLORS.primaryAlpha40 },
  blob2: { position: 'absolute', bottom: -30, left: -20, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(224,231,255,0.08)' },
  heroLabel:          { fontSize: FONTS.base, color: COLORS.textLight, marginBottom: 4 },
  heroAmount:         { fontSize: FONTS.hero, fontWeight: '800', color: COLORS.white, letterSpacing: -1, marginBottom: SPACING.xl },
  heroRow:            { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xl },
  heroStat:           { flex: 1 },
  heroStatLabel:      { fontSize: FONTS.sm, color: COLORS.textLight, marginBottom: 4 },
  heroStatValue:      { fontSize: FONTS.md, fontWeight: '700', color: COLORS.white },
  heroDivider:        { width: 1, height: 36, backgroundColor: COLORS.whiteAlpha20, marginHorizontal: SPACING.lg },
  heroProgressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  heroProgressLabel:  { fontSize: FONTS.sm, color: COLORS.textLight },
  heroProgressPct:    { fontSize: FONTS.sm, color: COLORS.lavender, fontWeight: '700' },

  section: { marginBottom: SPACING.xxl },

  deadlineCard:     { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.cardBorder, gap: SPACING.sm },
  deadlineDot:      { width: 10, height: 10, borderRadius: 5 },
  deadlineLabel:    { fontSize: FONTS.base, fontWeight: '600', color: COLORS.textPrimary },
  deadlineDue:      { fontSize: FONTS.sm, color: COLORS.textMuted, marginTop: 2 },
  deadlineRight:    { alignItems: 'flex-end', gap: 4 },
  deadlineAmount:   { fontSize: FONTS.base, fontWeight: '700', color: COLORS.textPrimary },
  deadlineBadge:    { borderRadius: RADIUS.xl, paddingHorizontal: SPACING.sm, paddingVertical: 2, borderWidth: 1 },
  deadlineBadgeTxt: { fontSize: 10, fontWeight: '700' },

  savingCard:    { backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg, padding: SPACING.lg, marginRight: SPACING.md, width: 150, borderWidth: 1, borderColor: COLORS.cardBorder },
  savingEmoji:   { fontSize: 26, marginBottom: 8 },
  savingLabel:   { fontSize: FONTS.sm, color: COLORS.textMuted, marginBottom: 8, lineHeight: 16 },
  savingAmount:  { fontSize: FONTS.lg - 1, fontWeight: '700', color: COLORS.textPrimary },
  savingGoal:    { fontSize: FONTS.sm, color: COLORS.textMuted, marginBottom: 8 },
  savingDeposit: { fontSize: FONTS.sm, color: COLORS.primary, fontWeight: '700', marginTop: 6 },
});
