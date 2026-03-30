import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Dimensions, ScrollView,
} from 'react-native';
import ScreenWrapper from '../../components/ScreenWrapper';
import AnimatedBar from '../../components/AnimatedBar';
import { COLORS, FONTS, RADIUS, SPACING } from '../../constants/theme';
import { mockDebts, mockMonthlyStats, mockSavings, optimizerDebts, mockUser } from '../../constants/mockData';
import { fmt, fraction } from '../../utils/format';
import { generateProjection, canCoverMinimums } from '../../utils/optimizer';

const { width } = Dimensions.get('window');
const CHART_HEIGHT = 120;
const TABS = ['Optimizador', 'Estadisticas'];

// ─── Prepare debts for optimizer ─────────────────────────────────────────────
const OPTIMIZER_DEBTS = optimizerDebts;
const MONTHLY_BUDGET = mockUser.monthlyBudget;

// ─── Sub components ───────────────────────────────────────────────────────────

function CrisisAlert({ warning }) {
  return (
    <View style={styles.crisisAlert}>
      <Text style={styles.crisisIcon}>🚨</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.crisisTitle}>Modo Crisis Activado</Text>
        <Text style={styles.crisisTxt}>{warning}</Text>
      </View>
    </View>
  );
}

function PaymentRow({ item }) {
  return (
    <View style={[styles.paymentRow, item.sacrificed && styles.paymentRowSacrificed]}>
      <View style={[styles.paymentDot, { backgroundColor: item.color }]} />
      <View style={{ flex: 1 }}>
        <Text style={styles.paymentLabel}>{item.label}</Text>
        <Text style={styles.paymentSub}>
          {item.sacrificed
            ? 'No pagar este mes (menor penalizacion)'
            : item.isMinOnly
            ? 'Pago minimo'
            : 'Pago optimizado'}
        </Text>
      </View>
      <View style={styles.paymentAmounts}>
        <Text style={[styles.paymentAmt, item.sacrificed && { color: COLORS.danger }]}>
          {item.sacrificed ? 'Omitir' : fmt(item.payment)}
        </Text>
        <Text style={styles.paymentInterest}>
          +{fmt(item.interest)} intereses
        </Text>
      </View>
    </View>
  );
}

function MonthCard({ month, isExpanded, onPress }) {
  const hasCrisis = month.isCrisis;
  return (
    <TouchableOpacity
      style={[styles.monthCard, hasCrisis && styles.monthCardCrisis]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.monthCardHeader}>
        <View style={styles.monthCardLeft}>
          {hasCrisis && <Text style={styles.monthCrisisIcon}>🚨</Text>}
          <View>
            <Text style={styles.monthLabel}>{month.label}</Text>
            <Text style={styles.monthSub}>Deuda restante: {fmt(month.remainingDebt)}</Text>
          </View>
        </View>
        <View style={styles.monthCardRight}>
          <Text style={styles.monthPaid}>{fmt(month.totalPaid)}</Text>
          <Text style={styles.monthChevron}>{isExpanded ? '▲' : '▼'}</Text>
        </View>
      </View>

      {isExpanded && (
        <View style={styles.monthDetail}>
          <View style={styles.monthDetailDivider} />
          {hasCrisis && month.warning && <CrisisAlert warning={month.warning} />}
          {month.payments.map((p) => (
            <PaymentRow key={p.debtId} item={p} />
          ))}
          <View style={styles.monthSummaryRow}>
            <Text style={styles.monthSummaryLabel}>Total intereses del mes</Text>
            <Text style={styles.monthSummaryValue}>{fmt(month.totalInterest)}</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

function BarChart({ data, valueKey, color }) {
  const max = Math.max(...data.map((d) => d[valueKey]), 1);
  return (
    <View style={styles.chart}>
      {data.map((item, i) => {
        const barH = (item[valueKey] / max) * CHART_HEIGHT;
        return (
          <View key={i} style={styles.barCol}>
            <Text style={styles.barValue}>{(item[valueKey] / 1000).toFixed(1)}k</Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { height: barH, backgroundColor: color }]} />
            </View>
            <Text style={styles.barMonth}>{item.month}</Text>
          </View>
        );
      })}
    </View>
  );
}

function StatCard({ emoji, label, value, sub, color }) {
  return (
    <View style={[styles.statCard, { borderTopColor: color, borderTopWidth: 3 }]}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      {sub ? <Text style={styles.statSub}>{sub}</Text> : null}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ReportsScreen() {
  const [activeTab,     setActiveTab]     = useState(0);
  const [chartTab,      setChartTab]      = useState(0);
  const [expandedMonth, setExpandedMonth] = useState(0);

  // Run optimizer
  const projection = useMemo(() =>
    generateProjection(OPTIMIZER_DEBTS, MONTHLY_BUDGET),
    []
  );

  const isCrisis     = !canCoverMinimums(OPTIMIZER_DEBTS, MONTHLY_BUDGET);
  const firstMonth   = projection.months[0];

  // Stats tab data
  const totalPaid       = mockMonthlyStats.reduce((s, m) => s + m.paid, 0);
  const totalSaved      = mockMonthlyStats.reduce((s, m) => s + m.saved, 0);
  const totalDebt       = mockDebts.reduce((s, d) => s + (d.totalAmount - d.paidAmount), 0);
  const totalGoal       = mockSavings.reduce((s, v) => s + v.goal, 0);
  const totalSavingsNow = mockSavings.reduce((s, v) => s + v.saved, 0);
  const totalPaidAll    = mockDebts.reduce((s, d) => s + d.paidAmount, 0);
  const totalOriginal   = mockDebts.reduce((s, d) => s + d.totalAmount, 0);

  return (
    <ScreenWrapper>
      <Text style={styles.screenTitle}>Reportes</Text>

      {/* Tab Toggle */}
      <View style={styles.tabRow}>
        {TABS.map((t, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.tab, activeTab === i && styles.tabActive]}
            onPress={() => setActiveTab(i)}
          >
            <Text style={[styles.tabTxt, activeTab === i && styles.tabTxtActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── OPTIMIZER TAB ── */}
      {activeTab === 0 && (
        <>
          {/* Summary card */}
          <View style={styles.optimizerSummary}>
            <View style={styles.blob1} />
            <Text style={styles.optimizerLabel}>Presupuesto mensual (P)</Text>
            <Text style={styles.optimizerBudget}>{fmt(MONTHLY_BUDGET)}</Text>

            <View style={styles.optimizerRow}>
              <View style={styles.optimizerStat}>
                <Text style={styles.optimizerStatLabel}>Meses para liquidar</Text>
                <Text style={styles.optimizerStatValue}>{projection.totalMonths}</Text>
              </View>
              <View style={styles.optimizerDivider} />
              <View style={styles.optimizerStat}>
                <Text style={styles.optimizerStatLabel}>Total en intereses</Text>
                <Text style={styles.optimizerStatValue}>{fmt(projection.totalInterestPaid)}</Text>
              </View>
            </View>

            {isCrisis && (
              <View style={styles.crisisBadge}>
                <Text style={styles.crisisBadgeTxt}>🚨 Modo Crisis Activo</Text>
              </View>
            )}
          </View>

          {/* This month recommendation */}
          {firstMonth && (
            <View style={styles.thisMonthCard}>
              <Text style={styles.thisMonthTitle}>Distribucion recomendada este mes</Text>
              <Text style={styles.thisMonthSub}>
                {isCrisis ? 'Modo Gran M — minimizando penalizaciones' : 'Modelo Simplex — minimizando intereses (CAT)'}
              </Text>
              {firstMonth.isCrisis && firstMonth.warning && (
                <CrisisAlert warning={firstMonth.warning} />
              )}
              {firstMonth.payments.map((p) => (
                <PaymentRow key={p.debtId} item={p} />
              ))}
              <View style={styles.thisMonthTotal}>
                <Text style={styles.thisMonthTotalLabel}>Total a pagar este mes</Text>
                <Text style={styles.thisMonthTotalValue}>{fmt(firstMonth.totalPaid)}</Text>
              </View>
            </View>
          )}

          {/* Monthly projection */}
          <Text style={[styles.screenTitle, { fontSize: FONTS.lg, marginBottom: SPACING.md }]}>
            Proyeccion mes a mes
          </Text>

          {/* Mini bar chart of projection */}
          <View style={styles.projChartCard}>
            <Text style={styles.chartTitle}>Deuda restante por mes</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={[styles.chart, { width: Math.max(width - 80, projection.months.length * 52) }]}>
                {projection.months.map((m, i) => {
                  const max = projection.months[0]?.remainingDebt || 1;
                  const barH = (m.remainingDebt / max) * CHART_HEIGHT;
                  return (
                    <View key={i} style={styles.barCol}>
                      <View style={styles.barTrack}>
                        <View style={[
                          styles.barFill,
                          { height: barH, backgroundColor: m.isCrisis ? COLORS.danger : COLORS.primary }
                        ]} />
                      </View>
                      <Text style={styles.barMonth}>{m.label.split(' ')[0]}</Text>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </View>

          {/* Month cards */}
          {projection.months.map((month, i) => (
            <MonthCard
              key={i}
              month={month}
              isExpanded={expandedMonth === i}
              onPress={() => setExpandedMonth(expandedMonth === i ? -1 : i)}
            />
          ))}
        </>
      )}

      {/* ── STATS TAB ── */}
      {activeTab === 1 && (
        <>
          <View style={styles.kpiRow}>
            <StatCard emoji="💳" label="Pagado (6m)"   value={fmt(totalPaid)}  color={COLORS.primary} />
            <StatCard emoji="💰" label="Ahorrado (6m)" value={fmt(totalSaved)} color={COLORS.success} />
          </View>
          <View style={styles.kpiRow}>
            <StatCard
              emoji="📉" label="Deuda restante" value={fmt(totalDebt)}
              sub={`${Math.round(fraction(totalPaidAll, totalOriginal) * 100)}% liquidado`}
              color={COLORS.danger}
            />
            <StatCard
              emoji="🎯" label="Meta ahorro" value={fmt(totalSavingsNow)}
              sub={`de ${fmt(totalGoal)}`}
              color={COLORS.warning}
            />
          </View>

          <View style={styles.tabRow}>
            {['Pagos', 'Ahorros'].map((t, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.tab, chartTab === i && styles.tabActive]}
                onPress={() => setChartTab(i)}
              >
                <Text style={[styles.tabTxt, chartTab === i && styles.tabTxtActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>
              {chartTab === 0 ? 'Pagos mensuales' : 'Ahorro mensual'} — ultimos 6 meses
            </Text>
            <BarChart
              data={mockMonthlyStats}
              valueKey={chartTab === 0 ? 'paid' : 'saved'}
              color={chartTab === 0 ? COLORS.primary : COLORS.success}
            />
          </View>

          <Text style={[styles.screenTitle, { fontSize: FONTS.lg, marginBottom: SPACING.md }]}>
            Desglose de deudas
          </Text>
          {mockDebts.map((d) => {
            const pct = fraction(d.paidAmount, d.totalAmount);
            return (
              <View key={d.id} style={styles.breakdownRow}>
                <View style={[styles.breakdownDot, { backgroundColor: d.color }]} />
                <Text style={styles.breakdownLabel} numberOfLines={1}>{d.label}</Text>
                <View style={styles.breakdownBarWrap}>
                  <View style={[styles.breakdownBarFill, { width: `${Math.round(pct * 100)}%`, backgroundColor: d.color }]} />
                </View>
                <Text style={styles.breakdownPct}>{Math.round(pct * 100)}%</Text>
              </View>
            );
          })}
        </>
      )}
    </ScreenWrapper>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screenTitle: { fontSize: FONTS.xxl, fontWeight: '800', color: COLORS.textPrimary, marginBottom: SPACING.xl, letterSpacing: -0.5 },

  tabRow: { flexDirection: 'row', backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg, padding: 4, marginBottom: SPACING.lg, borderWidth: 1, borderColor: COLORS.cardBorder },
  tab:    { flex: 1, paddingVertical: SPACING.sm, alignItems: 'center', borderRadius: RADIUS.md },
  tabActive:   { backgroundColor: COLORS.primary },
  tabTxt:      { fontSize: FONTS.base, color: COLORS.textMuted, fontWeight: '600' },
  tabTxtActive:{ color: COLORS.white },

  // Optimizer summary
  optimizerSummary: {
    backgroundColor: COLORS.primaryDark, borderRadius: RADIUS.xl,
    padding: SPACING.xxl, marginBottom: SPACING.xl, overflow: 'hidden',
    borderWidth: 1, borderColor: COLORS.cardBorder,
  },
  blob1: { position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: COLORS.primaryAlpha40 },
  optimizerLabel:  { fontSize: FONTS.sm, color: COLORS.textLight, marginBottom: 4 },
  optimizerBudget: { fontSize: 34, fontWeight: '800', color: COLORS.white, letterSpacing: -0.5, marginBottom: SPACING.lg },
  optimizerRow:    { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md },
  optimizerStat:   { flex: 1 },
  optimizerStatLabel: { fontSize: FONTS.sm, color: COLORS.textLight, marginBottom: 4 },
  optimizerStatValue: { fontSize: FONTS.lg, fontWeight: '700', color: COLORS.white },
  optimizerDivider: { width: 1, height: 36, backgroundColor: COLORS.whiteAlpha20, marginHorizontal: SPACING.lg },
  crisisBadge: { backgroundColor: 'rgba(239,68,68,0.2)', borderRadius: RADIUS.md, padding: SPACING.sm, borderWidth: 1, borderColor: 'rgba(239,68,68,0.4)' },
  crisisBadgeTxt: { fontSize: FONTS.sm, color: COLORS.danger, fontWeight: '700', textAlign: 'center' },

  // Crisis alert
  crisisAlert: {
    flexDirection: 'row', backgroundColor: 'rgba(239,68,68,0.1)',
    borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md,
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', gap: SPACING.sm,
  },
  crisisIcon:  { fontSize: 20 },
  crisisTitle: { fontSize: FONTS.base, fontWeight: '700', color: COLORS.danger, marginBottom: 4 },
  crisisTxt:   { fontSize: FONTS.sm, color: COLORS.textMuted, lineHeight: 18 },

  // This month card
  thisMonthCard: {
    backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg,
    padding: SPACING.lg, marginBottom: SPACING.xl,
    borderWidth: 1, borderColor: COLORS.cardBorder,
  },
  thisMonthTitle: { fontSize: FONTS.md, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  thisMonthSub:   { fontSize: FONTS.sm, color: COLORS.primary, marginBottom: SPACING.md },
  thisMonthTotal: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.cardBorder, marginTop: SPACING.sm },
  thisMonthTotalLabel: { fontSize: FONTS.base, fontWeight: '600', color: COLORS.textPrimary },
  thisMonthTotalValue: { fontSize: FONTS.lg, fontWeight: '800', color: COLORS.primary },

  // Payment row
  paymentRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: SPACING.sm, gap: SPACING.sm,
    borderBottomWidth: 1, borderBottomColor: COLORS.cardBorder,
  },
  paymentRowSacrificed: { opacity: 0.7 },
  paymentDot:     { width: 10, height: 10, borderRadius: 5 },
  paymentLabel:   { fontSize: FONTS.base, fontWeight: '600', color: COLORS.textPrimary },
  paymentSub:     { fontSize: FONTS.sm, color: COLORS.textMuted, marginTop: 2 },
  paymentAmounts: { alignItems: 'flex-end' },
  paymentAmt:     { fontSize: FONTS.base, fontWeight: '700', color: COLORS.textPrimary },
  paymentInterest:{ fontSize: FONTS.sm, color: COLORS.danger, marginTop: 2 },

  // Month cards
  monthCard: {
    backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg,
    padding: SPACING.lg, marginBottom: SPACING.sm,
    borderWidth: 1, borderColor: COLORS.cardBorder,
  },
  monthCardCrisis: { borderColor: 'rgba(239,68,68,0.4)' },
  monthCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  monthCardLeft:   { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, flex: 1 },
  monthCardRight:  { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  monthCrisisIcon: { fontSize: 16 },
  monthLabel:      { fontSize: FONTS.base, fontWeight: '700', color: COLORS.textPrimary },
  monthSub:        { fontSize: FONTS.sm, color: COLORS.textMuted, marginTop: 2 },
  monthPaid:       { fontSize: FONTS.base, fontWeight: '700', color: COLORS.primary },
  monthChevron:    { fontSize: FONTS.sm, color: COLORS.textMuted },
  monthDetail:     { marginTop: SPACING.md },
  monthDetailDivider: { height: 1, backgroundColor: COLORS.cardBorder, marginBottom: SPACING.md },
  monthSummaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: SPACING.sm, marginTop: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.cardBorder },
  monthSummaryLabel: { fontSize: FONTS.sm, color: COLORS.textMuted },
  monthSummaryValue: { fontSize: FONTS.sm, fontWeight: '700', color: COLORS.danger },

  // Projection chart
  projChartCard: { backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.xl, borderWidth: 1, borderColor: COLORS.cardBorder },
  chartTitle: { fontSize: FONTS.base, color: COLORS.textMuted, marginBottom: SPACING.lg },
  chart: { flexDirection: 'row', alignItems: 'flex-end', height: CHART_HEIGHT + 30 },
  barCol: { flex: 1, minWidth: 44, alignItems: 'center' },
  barValue: { fontSize: 9, color: COLORS.textMuted, marginBottom: 4 },
  barTrack: { width: 20, height: CHART_HEIGHT, justifyContent: 'flex-end', backgroundColor: COLORS.whiteAlpha10, borderRadius: 4, overflow: 'hidden' },
  barFill: { width: '100%', borderRadius: 4 },
  barMonth: { fontSize: 9, color: COLORS.textMuted, marginTop: 4 },

  // Stats tab
  kpiRow: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.md },
  statCard: { flex: 1, backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.cardBorder },
  statEmoji: { fontSize: 22, marginBottom: 6 },
  statLabel: { fontSize: FONTS.sm, color: COLORS.textMuted, marginBottom: 4 },
  statValue: { fontSize: FONTS.lg, fontWeight: '700' },
  statSub:   { fontSize: FONTS.sm, color: COLORS.textMuted, marginTop: 2 },
  chartCard: { backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.xl, borderWidth: 1, borderColor: COLORS.cardBorder },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm, gap: SPACING.sm },
  breakdownDot:     { width: 10, height: 10, borderRadius: 5 },
  breakdownLabel:   { fontSize: FONTS.sm, color: COLORS.textMuted, width: 110 },
  breakdownBarWrap: { flex: 1, height: 6, backgroundColor: COLORS.whiteAlpha10, borderRadius: 3, overflow: 'hidden' },
  breakdownBarFill: { height: 6, borderRadius: 3 },
  breakdownPct:     { fontSize: FONTS.sm, color: COLORS.textMuted, width: 32, textAlign: 'right' },
});
