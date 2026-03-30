/**
 * components/CashmindCalendar.js
 * Calendario personalizado con la paleta de Cashmind.
 * Marca días inhábiles (fines de semana + festivos MX) en gris.
 */
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  Animated, useRef,
} from 'react-native';
import { COLORS, FONTS, RADIUS, SPACING } from '../constants/theme';
import { isBusinessDay, MONTHS_ES } from '../utils/businessDays';

const DAYS_OF_WEEK = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'];

/**
 * CashmindCalendar
 * @param {boolean}   visible       mostrar/ocultar
 * @param {Date}      selectedDate  fecha seleccionada actualmente
 * @param {function}  onSelect      callback con la Date seleccionada
 * @param {function}  onClose       cerrar sin seleccionar
 * @param {boolean}   businessOnly  si true, deshabilita días inhábiles
 * @param {string}    title         título del calendario
 */
export default function CashmindCalendar({
  visible,
  selectedDate,
  onSelect,
  onClose,
  businessOnly = false,
  title = 'Selecciona una fecha',
}) {
  const today = new Date();
  const [viewYear,  setViewYear]  = useState(selectedDate?.getFullYear()  ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(selectedDate?.getMonth()     ?? today.getMonth());

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const firstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  const isSelected = (day) => {
    if (!selectedDate) return false;
    return (
      selectedDate.getDate()     === day &&
      selectedDate.getMonth()    === viewMonth &&
      selectedDate.getFullYear() === viewYear
    );
  };

  const isToday = (day) => (
    today.getDate()     === day &&
    today.getMonth()    === viewMonth &&
    today.getFullYear() === viewYear
  );

  const isDisabled = (day) => {
    if (!businessOnly) return false;
    const d = new Date(viewYear, viewMonth, day);
    return !isBusinessDay(d);
  };

  // ── Build calendar grid ──────────────────────────────────────────────────────
  const totalDays  = daysInMonth(viewYear, viewMonth);
  const startDay   = firstDayOfMonth(viewYear, viewMonth);
  const cells      = [];

  // Empty cells before first day
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(d);
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  const rows = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} onPress={onClose} activeOpacity={1} />

      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnTxt}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Month navigator */}
        <View style={styles.nav}>
          <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
            <Text style={styles.navBtnTxt}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.navLabel}>
            {MONTHS_ES[viewMonth]} {viewYear}
          </Text>
          <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
            <Text style={styles.navBtnTxt}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Day of week headers */}
        <View style={styles.dowRow}>
          {DAYS_OF_WEEK.map((d, i) => (
            <Text key={i} style={[styles.dowTxt, (i === 0 || i === 6) && styles.dowWeekend]}>
              {d}
            </Text>
          ))}
        </View>

        {/* Calendar grid */}
        {rows.map((row, ri) => (
          <View key={ri} style={styles.row}>
            {row.map((day, di) => {
              if (!day) return <View key={di} style={styles.cell} />;
              const selected  = isSelected(day);
              const todayCell = isToday(day);
              const disabled  = isDisabled(day);
              const isWeekend = di === 0 || di === 6;

              return (
                <TouchableOpacity
                  key={di}
                  style={[
                    styles.cell,
                    selected  && styles.cellSelected,
                    todayCell && !selected && styles.cellToday,
                  ]}
                  onPress={() => {
                    if (disabled) return;
                    onSelect(new Date(viewYear, viewMonth, day));
                  }}
                  activeOpacity={disabled ? 1 : 0.7}
                >
                  <Text style={[
                    styles.cellTxt,
                    selected  && styles.cellTxtSelected,
                    disabled  && styles.cellTxtDisabled,
                    isWeekend && !selected && !disabled && styles.cellTxtWeekend,
                    todayCell && !selected && styles.cellTxtToday,
                  ]}>
                    {day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}

        {/* Legend */}
        {businessOnly && (
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.textMuted }]} />
              <Text style={styles.legendTxt}>Día inhábil</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.primary }]} />
              <Text style={styles.legendTxt}>Seleccionado</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { borderWidth: 1, borderColor: COLORS.primary }]} />
              <Text style={styles.legendTxt}>Hoy</Text>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const CELL_SIZE = 40;

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  container: {
    position: 'absolute',
    top: '50%',
    left: 20, right: 20,
    transform: [{ translateY: -220 }],
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },

  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: SPACING.lg,
  },
  title: { fontSize: FONTS.md, fontWeight: '700', color: COLORS.textPrimary },
  closeBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: COLORS.cardBg, alignItems: 'center', justifyContent: 'center',
  },
  closeBtnTxt: { fontSize: FONTS.sm, color: COLORS.textMuted },

  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.lg },
  navBtn: {
    width: 36, height: 36, borderRadius: RADIUS.md,
    backgroundColor: COLORS.cardBg, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.cardBorder,
  },
  navBtnTxt: { fontSize: 22, color: COLORS.textPrimary, lineHeight: 28 },
  navLabel: { fontSize: FONTS.md, fontWeight: '700', color: COLORS.textPrimary },

  dowRow: { flexDirection: 'row', marginBottom: SPACING.sm },
  dowTxt: { flex: 1, textAlign: 'center', fontSize: FONTS.sm, color: COLORS.textMuted, fontWeight: '600' },
  dowWeekend: { color: COLORS.danger + 'AA' },

  row: { flexDirection: 'row', marginBottom: 4 },
  cell: {
    flex: 1, height: CELL_SIZE,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: CELL_SIZE / 2,
  },
  cellSelected: { backgroundColor: COLORS.primary },
  cellToday: { borderWidth: 1.5, borderColor: COLORS.primary },

  cellTxt: { fontSize: FONTS.base, color: COLORS.textPrimary, fontWeight: '500' },
  cellTxtSelected: { color: COLORS.white, fontWeight: '700' },
  cellTxtDisabled: { color: COLORS.textMuted, opacity: 0.4 },
  cellTxtWeekend: { color: COLORS.danger + 'CC' },
  cellTxtToday: { color: COLORS.primary, fontWeight: '700' },

  legend: {
    flexDirection: 'row', justifyContent: 'center',
    gap: SPACING.lg, marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1, borderTopColor: COLORS.cardBorder,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  legendDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: 'transparent' },
  legendTxt: { fontSize: FONTS.sm, color: COLORS.textMuted },
});
