/**
 * components/EmptyState.js
 * Ilustración SVG + mensaje + botón para cuando no hay datos
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, RADIUS, SPACING } from '../constants/theme';

// ─── SVG-style illustrations using View/Text ──────────────────────────────────

function DebtIllustration() {
  return (
    <View style={ill.wrap}>
      {/* Card stack */}
      <View style={[ill.card, { bottom: 0, left: 20, backgroundColor: COLORS.primaryAlpha30, transform: [{ rotate: '-8deg' }] }]} />
      <View style={[ill.card, { bottom: 8, left: 10, backgroundColor: '#4F46E5AA', transform: [{ rotate: '-3deg' }] }]} />
      <View style={[ill.card, { bottom: 16 }]}>
        <View style={ill.cardChip} />
        <View style={ill.cardLines}>
          <View style={ill.cardLine} />
          <View style={[ill.cardLine, { width: 50 }]} />
        </View>
      </View>
      {/* Plus badge */}
      <View style={ill.plusBadge}>
        <Text style={ill.plusTxt}>+</Text>
      </View>
    </View>
  );
}

function SavingsIllustration() {
  return (
    <View style={ill.wrap}>
      {/* Piggy bank style */}
      <View style={ill.piggyBody}>
        <Ionicons name='wallet' size={36} color={COLORS.primary} />
        <View style={ill.piggySlot} />
      </View>
      {/* Coins falling */}
      <View style={[ill.coin, { top: 8, left: 55, opacity: 0.9 }]}>
        <Text style={ill.coinTxt}>$</Text>
      </View>
      <View style={[ill.coin, { top: 30, left: 72, opacity: 0.6, width: 20, height: 20 }]}>
        <Text style={[ill.coinTxt, { fontSize: 10 }]}>$</Text>
      </View>
      <View style={[ill.coin, { top: 16, left: 40, opacity: 0.4, width: 14, height: 14 }]}>
        <Text style={[ill.coinTxt, { fontSize: 8 }]}>$</Text>
      </View>
      {/* Plus badge */}
      <View style={ill.plusBadge}>
        <Text style={ill.plusTxt}>+</Text>
      </View>
    </View>
  );
}

function HomeIllustration() {
  return (
    <View style={ill.wrap}>
      {/* Phone frame */}
      <View style={ill.phone}>
        <View style={ill.phoneScreen}>
          <View style={ill.phoneRow}>
            <View style={[ill.phoneBar, { width: 60, backgroundColor: COLORS.primary }]} />
            <View style={[ill.phoneBar, { width: 40, backgroundColor: COLORS.primaryAlpha30 }]} />
          </View>
          <View style={[ill.phoneBlock, { backgroundColor: COLORS.primaryDark }]}>
            <View style={[ill.phoneBar, { width: 80, backgroundColor: 'rgba(255,255,255,0.3)', marginBottom: 6 }]} />
            <View style={[ill.phoneBar, { width: 50, backgroundColor: 'rgba(255,255,255,0.5)', height: 12 }]} />
          </View>
          <View style={ill.phoneRow}>
            <View style={[ill.phoneBar, { width: 50, backgroundColor: COLORS.primaryAlpha30 }]} />
            <View style={[ill.phoneBar, { width: 50, backgroundColor: COLORS.primaryAlpha30 }]} />
          </View>
        </View>
      </View>
      {/* Plus badge */}
      <View style={ill.plusBadge}>
        <Text style={ill.plusTxt}>+</Text>
      </View>
    </View>
  );
}

const ill = StyleSheet.create({
  wrap:       { width: 120, height: 100, position: 'relative', marginBottom: SPACING.xl },
  card:       { position: 'absolute', width: 90, height: 56, borderRadius: 10, backgroundColor: COLORS.primary, padding: 10 },
  cardChip:   { width: 20, height: 14, borderRadius: 3, backgroundColor: COLORS.lavender + 'AA', marginBottom: 8 },
  cardLines:  { gap: 4 },
  cardLine:   { height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.3)', width: 70 },
  plusBadge:  { position: 'absolute', bottom: -4, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.success, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.background },
  plusTxt:    { fontSize: 18, color: COLORS.white, fontWeight: '700', lineHeight: 22 },
  piggyBody:  { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primaryAlpha12, borderWidth: 2, borderColor: COLORS.primaryAlpha30, alignItems: 'center', justifyContent: 'center' },
  piggySlot:  { width: 24, height: 4, borderRadius: 2, backgroundColor: COLORS.primary, marginTop: 4 },
  coin:       { position: 'absolute', width: 26, height: 26, borderRadius: 13, backgroundColor: COLORS.warning, alignItems: 'center', justifyContent: 'center' },
  coinTxt:    { fontSize: 12, fontWeight: '800', color: COLORS.white },
  phone:       { width: 80, height: 100, borderRadius: 12, backgroundColor: COLORS.cardBg, borderWidth: 2, borderColor: COLORS.cardBorder, overflow: 'hidden', padding: 6 },
  phoneScreen: { flex: 1, gap: 6 },
  phoneRow:    { flexDirection: 'row', gap: 6 },
  phoneBar:    { height: 6, borderRadius: 3, backgroundColor: COLORS.primaryAlpha12 },
  phoneBlock:  { borderRadius: 8, padding: 8 },
  miniBar:     { flex: 1, backgroundColor: COLORS.primary, borderRadius: 2, marginHorizontal: 1, alignSelf: 'flex-end' },
});


function ReportsIllustration() {
  return (
    <View style={ill.wrap}>
      <View style={ill.phone}>
        <View style={ill.phoneScreen}>
          <View style={[ill.phoneBlock, { backgroundColor: COLORS.primaryDark, marginBottom: 6 }]}>
            <View style={[ill.phoneBar, { width: 60, backgroundColor: 'rgba(255,255,255,0.4)', marginBottom: 4 }]} />
            <View style={[ill.phoneBar, { width: 40, backgroundColor: 'rgba(255,255,255,0.2)' }]} />
          </View>
          <View style={ill.phoneRow}>
            {[40, 28, 55, 35, 48, 20].map((h, i) => (
              <View key={i} style={[ill.miniBar, { height: h }]} />
            ))}
          </View>
        </View>
      </View>
      <View style={[ill.plusBadge, { backgroundColor: COLORS.primary }]}>
        <Ionicons name="bar-chart" size={14} color={COLORS.white} />
      </View>
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function EmptyState({ type = 'debt', onAction }) {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const config = {
    debt: {
      illustration: <DebtIllustration />,
      title:   'Sin deudas registradas',
      message: 'Agrega tus deudas para que el optimizador Simplex calcule la mejor estrategia de pago y minimice los intereses que pagas.',
      action:  'Agregar primera deuda',
    },
    saving: {
      illustration: <SavingsIllustration />,
      title:   'Sin objetivos de ahorro',
      message: 'Crea tu primer objetivo de ahorro y define un plazo. El sistema calculara automaticamente cuanto depositar cada mes para llegar a tu meta.',
      action:  'Crear primer objetivo',
    },
    reports: {
      illustration: <ReportsIllustration />,
      title:   'Sin datos para reportar',
      message: 'Agrega al menos una deuda para que el optimizador Simplex calcule tu plan de pagos y proyección de intereses.',
      action:  null,
    },
    home: {
      illustration: <HomeIllustration />,
      title:   'Bienvenido a Cashmind',
      message: 'Agrega tus deudas y define tu presupuesto mensual para que el optimizador calcule tu plan de pagos personalizado.',
      action:  'Agregar mi primera deuda',
    },
  };

  const c = config[type] ?? config.debt;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      {c.illustration}
      <Text style={styles.title}>{c.title}</Text>
      <Text style={styles.message}>{c.message}</Text>
      {c.action && (
        <TouchableOpacity style={styles.btn} onPress={onAction} activeOpacity={0.85}>
          <Text style={styles.btnTxt}>{c.action}</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: SPACING.xxl, paddingVertical: SPACING.xxl,
  },
  title:   { fontSize: FONTS.xl, fontWeight: '700', color: COLORS.textPrimary, textAlign: 'center', marginBottom: SPACING.md },
  message: { fontSize: FONTS.base, color: COLORS.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: SPACING.xxl },
  btn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md, paddingHorizontal: SPACING.xxl,
  },
  btnTxt: { fontSize: FONTS.md, fontWeight: '700', color: COLORS.white },
});
