/**
 * app/(tabs)/reports/index.js
 * Reportes: tab Optimizador (Simplex/Gran M) y tab Estadísticas.
 * Todos los datos vienen de appStore — sin mockData.
 */
import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Dimensions, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../../../components/ScreenWrapper';
import EmptyState from '../../../components/EmptyState';
import AnimatedBar from '../../../components/AnimatedBar';
import { COLORS, FONTS, RADIUS, SPACING } from '../../../constants/theme';
import { fmt, fraction } from '../../../utils/format';
import { useAppStore } from '../../../utils/appStore';
import { generateProjection, canCoverMinimums } from '../../../utils/optimizer';

const { width }    = Dimensions.get('window');
const CHART_HEIGHT = 120;
const TABS         = ['Optimizador', 'Estadísticas'];

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function AlertaCrisis({ warning }) {
  return (
    <View style={styles.crisisAlert}>
      <Ionicons name="alert-circle" size={18} color={COLORS.danger} />
      <View style={{ flex: 1 }}>
        <Text style={styles.crisisTitle}>Modo Crisis Activado</Text>
        <Text style={styles.crisisTxt}>{warning}</Text>
      </View>
    </View>
  );
}

function FilaPago({ item }) {
  return (
    <View style={[styles.paymentRow, item.sacrificed && styles.paymentRowSacrificed]}>
      <View style={[styles.paymentDot, { backgroundColor: item.color }]} />
      <View style={{ flex: 1 }}>
        <Text style={styles.paymentLabel}>{item.label}</Text>
        <Text style={styles.paymentSub}>
          {item.sacrificed
            ? 'No pagar este mes (menor penalización)'
            : item.isMinOnly ? 'Pago mínimo' : 'Pago optimizado'}
        </Text>
      </View>
      <View style={styles.paymentAmounts}>
        <Text style={[styles.paymentAmt, item.sacrificed && { color: COLORS.danger }]}>
          {item.sacrificed ? 'Omitir' : fmt(item.payment)}
        </Text>
        <Text style={styles.paymentInterest}>+{fmt(item.interest)} intereses</Text>
      </View>
    </View>
  );
}

function TarjetaMes({ month, isExpanded, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.monthCard, month.isCrisis && styles.monthCardCrisis]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.monthCardHeader}>
        <View style={styles.monthCardLeft}>
          {month.isCrisis && <Ionicons name="alert-circle" size={16} color={COLORS.danger} />}
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
          {month.payments.map((p) => <FilaPago key={p.debtId} item={p} />)}
          <View style={styles.monthSummaryRow}>
            <Text style={styles.monthSummaryLabel}>Intereses del mes</Text>
            <Text style={styles.monthSummaryValue}>+{fmt(month.totalInterest)}</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

function TarjetaStat({ icon, label, value, color, sub }) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={22} color={color} style={{ marginBottom: 6 }} />
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      {sub ? <Text style={styles.statSub}>{sub}</Text> : null}
    </View>
  );
}

// Gráfica de barras con datos reales — muestra mensaje si no hay historial
function GraficaBarras({ data, valueKey, color, labelKey = 'label' }) {
  if (!data || data.length === 0) {
    return (
      <View style={styles.graficaVacia}>
        <Ionicons name="bar-chart-outline" size={32} color={COLORS.textMuted} />
        <Text style={styles.graficaVaciaTxt}>Sin historial todavía</Text>
      </View>
    );
  }
  const max = Math.max(...data.map((d) => d[valueKey]), 1);
  return (
    <View style={styles.chart}>
      {data.map((item, i) => {
        const barH = (item[valueKey] / max) * CHART_HEIGHT;
        return (
          <View key={i} style={styles.barCol}>
            <Text style={styles.barValue}>
              {item[valueKey] >= 1000
                ? `${(item[valueKey] / 1000).toFixed(0)}k`
                : item[valueKey]}
            </Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { height: barH, backgroundColor: color }]} />
            </View>
            <Text style={styles.barMonth}>{item[labelKey]}</Text>
          </View>
        );
      })}
    </View>
  );
}

// ─── Pantalla principal ───────────────────────────────────────────────────────
export default function ReportsScreen() {
  const [activeTab,     setActiveTab]     = useState(0);
  const [chartTab,      setChartTab]      = useState(0);
  const [expandedMonth, setExpandedMonth] = useState(0);

  const { debts, savings, budget } = useAppStore();

  // Formatear deudas para el optimizador
  const optimizerDebts = debts.map((d) => ({
    id:         d.id,
    label:      d.label,
    balance:    d.totalAmount - d.paidAmount,
    cat:        d.cat ?? d.interestRate ?? 0,
    minPayment: d.minPayment ?? 0,
    penalty:    d.penalty ?? 0,
    color:      d.color,
  }));

  const sinDatos = debts.length === 0;

  const projection = useMemo(() =>
    sinDatos ? null : generateProjection(optimizerDebts, budget),
    [debts, budget]
  );

  const isCrisis   = !sinDatos && !canCoverMinimums(optimizerDebts, budget);
  const firstMonth = projection?.months[0];

  // Estadísticas calculadas desde appStore (datos reales)
  const totalDebt       = debts.reduce((s, d) => s + (d.totalAmount - d.paidAmount), 0);
  const totalPaidAll    = debts.reduce((s, d) => s + d.paidAmount, 0);
  const totalOriginal   = debts.reduce((s, d) => s + d.totalAmount, 0);
  const totalGoal       = savings.reduce((s, v) => s + v.goal, 0);
  const totalSavingsNow = savings.reduce((s, v) => s + v.saved, 0);

  // Historial de pagos — vacío hasta que haya Firebase
  // Por ahora se genera desde los pagos ya realizados en las deudas
  const historialPagos = debts
    .filter((d) => d.paidAmount > 0)
    .map((d) => ({ label: d.label.slice(0, 4), paid: d.paidAmount, saved: 0 }));

  return (
    <ScreenWrapper>
      <Text style={styles.screenTitle}>Reportes</Text>

      {/* Estado vacío — sin deudas no hay nada que reportar */}
      {sinDatos && <EmptyState type="reports" onAction={null} />}

      {!sinDatos && (
        <>
          {/* Tab toggle */}
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

          {/* ── OPTIMIZADOR ── */}
          {activeTab === 0 && (
            <>
              {/* Tarjeta resumen del optimizador */}
              <View style={styles.optimizerSummary}>
                <View style={styles.blob1} />
                <Text style={styles.optimizerLabel}>Presupuesto mensual (P)</Text>
                <Text style={styles.optimizerBudget}>{fmt(budget)}</Text>
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
                    <Text style={styles.crisisBadgeTxt}>Modo Crisis Activo</Text>
                  </View>
                )}
              </View>

              {/* Distribución recomendada este mes */}
              {firstMonth && (
                <View style={styles.thisMonthCard}>
                  <Text style={styles.thisMonthTitle}>Distribución recomendada este mes</Text>
                  <Text style={styles.thisMonthSub}>
                    {isCrisis
                      ? 'Modelo Gran M — minimizando penalizaciones'
                      : 'Modelo Simplex — minimizando intereses (CAT)'}
                  </Text>
                  {firstMonth.isCrisis && firstMonth.warning && (
                    <AlertaCrisis warning={firstMonth.warning} />
                  )}
                  {firstMonth.payments.map((p) => <FilaPago key={p.debtId} item={p} />)}
                  <View style={styles.thisMonthTotal}>
                    <Text style={styles.thisMonthTotalLabel}>Total a pagar este mes</Text>
                    <Text style={styles.thisMonthTotalValue}>{fmt(firstMonth.totalPaid)}</Text>
                  </View>
                </View>
              )}

              {/* Proyección mes a mes */}
              <Text style={[styles.screenTitle, { fontSize: FONTS.lg, marginBottom: SPACING.md }]}>
                Proyección mes a mes
              </Text>

              <View style={styles.projChartCard}>
                <Text style={styles.chartTitle}>Deuda restante por mes</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={[styles.chart, { width: Math.max(width - 80, projection.months.length * 52) }]}>
                    {projection.months.map((m, i) => {
                      const max  = projection.months[0]?.remainingDebt || 1;
                      const barH = (m.remainingDebt / max) * CHART_HEIGHT;
                      return (
                        <View key={i} style={styles.barCol}>
                          <View style={styles.barTrack}>
                            <View style={[styles.barFill, {
                              height: barH,
                              backgroundColor: m.isCrisis ? COLORS.danger : COLORS.primary,
                            }]} />
                          </View>
                          <Text style={styles.barMonth}>{m.label.split(' ')[0]}</Text>
                        </View>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>

              {projection.months.map((month, i) => (
                <TarjetaMes
                  key={i}
                  month={month}
                  isExpanded={expandedMonth === i}
                  onPress={() => setExpandedMonth(expandedMonth === i ? -1 : i)}
                />
              ))}
            </>
          )}

          {/* ── ESTADÍSTICAS ── */}
          {activeTab === 1 && (
            <>
              {/* KPIs calculados desde datos reales */}
              <View style={styles.kpiRow}>
                <TarjetaStat
                  icon="trending-down" label="Deuda restante" value={fmt(totalDebt)}
                  sub={`${Math.round(fraction(totalPaidAll, totalOriginal) * 100)}% liquidado`}
                  color={COLORS.danger}
                />
                <TarjetaStat
                  icon="trophy-outline" label="Meta ahorro" value={fmt(totalSavingsNow)}
                  sub={totalGoal > 0 ? `de ${fmt(totalGoal)}` : 'Sin metas aún'}
                  color={COLORS.warning}
                />
              </View>
              <View style={styles.kpiRow}>
                <TarjetaStat
                  icon="card" label="Ya pagado" value={fmt(totalPaidAll)}
                  sub={`de ${fmt(totalOriginal)} original`}
                  color={COLORS.primary}
                />
                <TarjetaStat
                  icon="cash-outline" label="Presupuesto" value={fmt(budget)}
                  sub="mensual disponible"
                  color={COLORS.success}
                />
              </View>

              {/* Gráfica de pagos por deuda */}
              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>Pagos realizados por deuda</Text>
                <GraficaBarras
                  data={historialPagos}
                  valueKey="paid"
                  color={COLORS.primary}
                  labelKey="label"
                />
              </View>

              {/* Barra de progreso de ahorros */}
              {savings.length > 0 && (
                <>
                  <Text style={[styles.screenTitle, { fontSize: FONTS.lg, marginBottom: SPACING.md }]}>
                    Progreso de ahorros
                  </Text>
                  {savings.map((s) => (
                    <View key={s.id} style={styles.breakdownRow}>
                      <View style={[styles.breakdownDot, { backgroundColor: s.color }]} />
                      <Text style={styles.breakdownLabel} numberOfLines={1}>{s.label}</Text>
                      <View style={styles.breakdownBarWrap}>
                        <View style={[styles.breakdownBarFill, {
                          width: `${Math.round(fraction(s.saved, s.goal) * 100)}%`,
                          backgroundColor: s.color,
                        }]} />
                      </View>
                      <Text style={styles.breakdownPct}>
                        {Math.round(fraction(s.saved, s.goal) * 100)}%
                      </Text>
                    </View>
                  ))}
                </>
              )}

              {/* Desglose de deudas */}
              <Text style={[styles.screenTitle, { fontSize: FONTS.lg, marginBottom: SPACING.md, marginTop: SPACING.xl }]}>
                Desglose de deudas
              </Text>
              {debts.map((d) => {
                const pct = fraction(d.paidAmount, d.totalAmount);
                return (
                  <View key={d.id} style={styles.breakdownRow}>
                    <View style={[styles.breakdownDot, { backgroundColor: d.color }]} />
                    <Text style={styles.breakdownLabel} numberOfLines={1}>{d.label}</Text>
                    <View style={styles.breakdownBarWrap}>
                      <View style={[styles.breakdownBarFill, {
                        width: `${Math.round(pct * 100)}%`,
                        backgroundColor: d.color,
                      }]} />
                    </View>
                    <Text style={styles.breakdownPct}>{Math.round(pct * 100)}%</Text>
                  </View>
                );
              })}
            </>
          )}
        </>
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  screenTitle: { fontSize: FONTS.xxl, fontWeight: '800', color: COLORS.textPrimary, marginBottom: SPACING.xl, letterSpacing: -0.5 },

  tabRow:      { flexDirection: 'row', backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg, padding: 4, marginBottom: SPACING.lg, borderWidth: 1, borderColor: COLORS.cardBorder },
  tab:         { flex: 1, paddingVertical: SPACING.sm, alignItems: 'center', borderRadius: RADIUS.md },
  tabActive:   { backgroundColor: COLORS.primary },
  tabTxt:      { fontSize: FONTS.base, color: COLORS.textMuted, fontWeight: '600' },
  tabTxtActive:{ color: COLORS.white },

  optimizerSummary:   { backgroundColor: COLORS.primaryDark, borderRadius: RADIUS.xl, padding: SPACING.xxl, marginBottom: SPACING.xl, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.cardBorder },
  blob1:              { position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: COLORS.primaryAlpha40 },
  optimizerLabel:     { fontSize: FONTS.sm, color: COLORS.textLight, marginBottom: 4 },
  optimizerBudget:    { fontSize: 34, fontWeight: '800', color: COLORS.white, letterSpacing: -0.5, marginBottom: SPACING.lg },
  optimizerRow:       { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md },
  optimizerStat:      { flex: 1 },
  optimizerStatLabel: { fontSize: FONTS.sm, color: COLORS.textLight, marginBottom: 4 },
  optimizerStatValue: { fontSize: FONTS.lg, fontWeight: '700', color: COLORS.white },
  optimizerDivider:   { width: 1, height: 36, backgroundColor: COLORS.whiteAlpha20, marginHorizontal: SPACING.lg },
  crisisBadge:        { backgroundColor: 'rgba(239,68,68,0.2)', borderRadius: RADIUS.md, padding: SPACING.sm, borderWidth: 1, borderColor: 'rgba(239,68,68,0.4)' },
  crisisBadgeTxt:     { fontSize: FONTS.sm, color: COLORS.danger, fontWeight: '700', textAlign: 'center' },

  crisisAlert: { flexDirection: 'row', backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', gap: SPACING.sm },
  crisisTitle: { fontSize: FONTS.base, fontWeight: '700', color: COLORS.danger, marginBottom: 4 },
  crisisTxt:   { fontSize: FONTS.sm, color: COLORS.textMuted, lineHeight: 18 },

  thisMonthCard:       { backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.xl, borderWidth: 1, borderColor: COLORS.cardBorder },
  thisMonthTitle:      { fontSize: FONTS.md, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  thisMonthSub:        { fontSize: FONTS.sm, color: COLORS.primary, marginBottom: SPACING.md },
  thisMonthTotal:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.cardBorder, marginTop: SPACING.sm },
  thisMonthTotalLabel: { fontSize: FONTS.base, fontWeight: '600', color: COLORS.textPrimary },
  thisMonthTotalValue: { fontSize: FONTS.lg, fontWeight: '800', color: COLORS.primary },

  paymentRow:           { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.sm, gap: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.cardBorder },
  paymentRowSacrificed: { opacity: 0.7 },
  paymentDot:           { width: 10, height: 10, borderRadius: 5 },
  paymentLabel:         { fontSize: FONTS.base, fontWeight: '600', color: COLORS.textPrimary },
  paymentSub:           { fontSize: FONTS.sm, color: COLORS.textMuted, marginTop: 2 },
  paymentAmounts:       { alignItems: 'flex-end' },
  paymentAmt:           { fontSize: FONTS.base, fontWeight: '700', color: COLORS.textPrimary },
  paymentInterest:      { fontSize: FONTS.sm, color: COLORS.danger, marginTop: 2 },

  monthCard:          { backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.cardBorder },
  monthCardCrisis:    { borderColor: 'rgba(239,68,68,0.4)' },
  monthCardHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  monthCardLeft:      { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, flex: 1 },
  monthCardRight:     { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  monthLabel:         { fontSize: FONTS.base, fontWeight: '700', color: COLORS.textPrimary },
  monthSub:           { fontSize: FONTS.sm, color: COLORS.textMuted, marginTop: 2 },
  monthPaid:          { fontSize: FONTS.base, fontWeight: '700', color: COLORS.primary },
  monthChevron:       { fontSize: FONTS.sm, color: COLORS.textMuted },
  monthDetail:        { marginTop: SPACING.md },
  monthDetailDivider: { height: 1, backgroundColor: COLORS.cardBorder, marginBottom: SPACING.md },
  monthSummaryRow:    { flexDirection: 'row', justifyContent: 'space-between', paddingTop: SPACING.sm, marginTop: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.cardBorder },
  monthSummaryLabel:  { fontSize: FONTS.sm, color: COLORS.textMuted },
  monthSummaryValue:  { fontSize: FONTS.sm, fontWeight: '700', color: COLORS.danger },

  projChartCard: { backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.xl, borderWidth: 1, borderColor: COLORS.cardBorder },
  chartTitle:    { fontSize: FONTS.base, color: COLORS.textMuted, marginBottom: SPACING.lg },
  chart:         { flexDirection: 'row', alignItems: 'flex-end', height: CHART_HEIGHT + 30 },
  barCol:        { flex: 1, minWidth: 44, alignItems: 'center' },
  barValue:      { fontSize: 9, color: COLORS.textMuted, marginBottom: 4 },
  barTrack:      { width: 20, height: CHART_HEIGHT, justifyContent: 'flex-end', backgroundColor: COLORS.whiteAlpha10, borderRadius: 4, overflow: 'hidden' },
  barFill:       { width: '100%', borderRadius: 4 },
  barMonth:      { fontSize: 9, color: COLORS.textMuted, marginTop: 4 },

  graficaVacia:    { alignItems: 'center', paddingVertical: SPACING.xxl, gap: SPACING.sm },
  graficaVaciaTxt: { fontSize: FONTS.sm, color: COLORS.textMuted },

  kpiRow:    { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.md },
  statCard:  { flex: 1, backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.cardBorder },
  statLabel: { fontSize: FONTS.sm, color: COLORS.textMuted, marginBottom: 4 },
  statValue: { fontSize: FONTS.lg, fontWeight: '700' },
  statSub:   { fontSize: FONTS.sm, color: COLORS.textMuted, marginTop: 2 },
  chartCard: { backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.xl, borderWidth: 1, borderColor: COLORS.cardBorder },

  breakdownRow:     { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm, gap: SPACING.sm },
  breakdownDot:     { width: 10, height: 10, borderRadius: 5 },
  breakdownLabel:   { fontSize: FONTS.sm, color: COLORS.textMuted, width: 100 },
  breakdownBarWrap: { flex: 1, height: 6, backgroundColor: COLORS.whiteAlpha10, borderRadius: 3, overflow: 'hidden' },
  breakdownBarFill: { height: 6, borderRadius: 3 },
  breakdownPct:     { fontSize: FONTS.sm, color: COLORS.textMuted, width: 32, textAlign: 'right' },
});
