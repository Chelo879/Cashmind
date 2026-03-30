/**
 * app/onboarding.js
 * 3 pantallas de onboarding:
 *   1. Bienvenida a Cashmind
 *   2. El modelo Simplex — cómo funciona el optimizador
 *   3. Cómo empezar
 * Accesible desde el perfil y en el primer uso.
 */
import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Dimensions, Animated, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, RADIUS, SPACING } from '../constants/theme';

const { width, height } = Dimensions.get('window');

// ─── Slide illustrations ──────────────────────────────────────────────────────

function WelcomeIllustration() {
  return (
    <View style={ill.container}>
      <View style={ill.orb1} />
      <View style={ill.orb2} />
      <View style={ill.heroCard}>
        <View style={ill.heroCardTop}>
          <Text style={ill.heroCardLabel}>Deuda total</Text>
          <View style={ill.heroBadge}><Text style={ill.heroBadgeTxt}>-12%</Text></View>
        </View>
        <Text style={ill.heroCardAmt}>$85,400</Text>
        <View style={ill.heroBarWrap}>
          <View style={[ill.heroBar, { width: '65%' }]} />
        </View>
        <View style={ill.heroCardRow}>
          <View style={ill.heroMini}>
            <Text style={ill.heroMiniLabel}>Ahorros</Text>
            <Text style={ill.heroMiniVal}>$18,320</Text>
          </View>
          <View style={ill.heroMini}>
            <Text style={ill.heroMiniLabel}>Presupuesto</Text>
            <Text style={ill.heroMiniVal}>$8,500</Text>
          </View>
        </View>
      </View>
      <View style={[ill.miniCard, { top: 40, right: -10 }]}>
        <Ionicons name="card" size={16} color={COLORS.primary} style={{ marginBottom: 4 }} />
        <Text style={ill.miniCardTxt}>Tarjeta Banamex</Text>
        <Text style={ill.miniCardAmt}>$14,000</Text>
      </View>
      <View style={[ill.miniCard, { bottom: 20, left: -10 }]}>
        <Ionicons name="shield-checkmark" size={16} color={COLORS.success} style={{ marginBottom: 4 }} />
        <Text style={ill.miniCardTxt}>Emergencias</Text>
        <Text style={ill.miniCardAmt}>$3,200</Text>
      </View>
    </View>
  );
}

function SimplexIllustration() {
  return (
    <View style={ill.container}>
      <View style={ill.orb3} />
      {/* Formula card */}
      <View style={ill.formulaCard}>
        <Text style={ill.formulaTitle}>Modelo Simplex</Text>
        <Text style={ill.formulaEq}>Min Z = Σ (CAT_i × x_i)</Text>
        <View style={ill.formulaDivider} />
        <View style={ill.constraintRow}>
          <Text style={ill.constraintDot}>●</Text>
          <Text style={ill.constraintTxt}>Σ x_i ≤ P  (presupuesto)</Text>
        </View>
        <View style={ill.constraintRow}>
          <Text style={ill.constraintDot}>●</Text>
          <Text style={ill.constraintTxt}>x_i ≥ m_i  (minimo)</Text>
        </View>
        <View style={ill.constraintRow}>
          <Text style={ill.constraintDot}>●</Text>
          <Text style={ill.constraintTxt}>x_i ≤ S_i  (saldo)</Text>
        </View>
      </View>
      {/* Distribution bars */}
      <View style={ill.barsCard}>
        {[
          { label: 'TDC 42%', pct: 0.75, color: '#6366F1' },
          { label: 'Auto 18%', pct: 0.45, color: '#818CF8' },
          { label: 'Hipoteca', pct: 0.25, color: '#A5B4FC' },
        ].map((b, i) => (
          <View key={i} style={ill.barRow}>
            <Text style={ill.barLabel}>{b.label}</Text>
            <View style={ill.barTrack}>
              <View style={[ill.barFill, { width: `${b.pct * 100}%`, backgroundColor: b.color }]} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function StartIllustration() {
  const steps = [
    { n: '1', icon: 'card-outline', txt: 'Agrega tus deudas con CAT y pagos minimos' },
    { n: '2', icon: 'cash-outline', txt: 'Define tu presupuesto mensual disponible (P)' },
    { n: '3', icon: 'hardware-chip-outline', txt: 'El optimizador calcula el plan de pagos optimo' },
    { n: '4', icon: 'trending-down', txt: 'Registra pagos y sigue tu progreso mes a mes' },
  ];
  return (
    <View style={ill.stepsContainer}>
      {steps.map((s, i) => (
        <View key={i} style={ill.stepRow}>
          <View style={ill.stepNum}>
            <Text style={ill.stepNumTxt}>{s.n}</Text>
          </View>
          <Ionicons name={s.icon} size={20} color={COLORS.primary} style={{ marginRight: 12 }} />
          <Text style={ill.stepTxt}>{s.txt}</Text>
        </View>
      ))}
    </View>
  );
}

const ill = StyleSheet.create({
  container:     { width: width - 80, height: 260, position: 'relative', alignItems: 'center', justifyContent: 'center' },
  orb1:          { position: 'absolute', top: -20, right: 20, width: 120, height: 120, borderRadius: 60, backgroundColor: COLORS.primaryAlpha40 },
  orb2:          { position: 'absolute', bottom: -10, left: -10, width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(224,231,255,0.15)' },
  orb3:          { position: 'absolute', top: 10, left: 10, width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.primaryAlpha12 },
  heroCard: {
    backgroundColor: COLORS.primaryDark, borderRadius: 16, padding: 16,
    width: 220, shadowColor: COLORS.primary, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8,
  },
  heroCardTop:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  heroCardLabel: { fontSize: 11, color: COLORS.textLight },
  heroBadge:     { backgroundColor: 'rgba(16,185,129,0.2)', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  heroBadgeTxt:  { fontSize: 10, color: COLORS.success, fontWeight: '700' },
  heroCardAmt:   { fontSize: 22, fontWeight: '800', color: COLORS.white, marginBottom: 10, letterSpacing: -0.5 },
  heroBarWrap:   { height: 4, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 2, marginBottom: 12 },
  heroBar:       { height: 4, backgroundColor: COLORS.lavender, borderRadius: 2 },
  heroCardRow:   { flexDirection: 'row', gap: 12 },
  heroMini:      {},
  heroMiniLabel: { fontSize: 9, color: COLORS.textLight },
  heroMiniVal:   { fontSize: 12, fontWeight: '700', color: COLORS.white },
  miniCard: {
    position: 'absolute', backgroundColor: COLORS.cardBg,
    borderRadius: 12, padding: 10, borderWidth: 1, borderColor: COLORS.cardBorder,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, elevation: 4, minWidth: 130,
  },
  miniCardEmoji: { fontSize: 16, marginBottom: 4 },
  miniCardTxt:   { fontSize: 10, color: COLORS.textMuted },
  miniCardAmt:   { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  formulaCard: {
    backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: COLORS.primaryAlpha30, width: 220,
  },
  formulaTitle:  { fontSize: 11, color: COLORS.primary, fontWeight: '700', marginBottom: 8 },
  formulaEq:     { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary, fontFamily: 'monospace', marginBottom: 10 },
  formulaDivider:{ height: 1, backgroundColor: COLORS.cardBorder, marginBottom: 8 },
  constraintRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  constraintDot: { fontSize: 8, color: COLORS.primary },
  constraintTxt: { fontSize: 10, color: COLORS.textMuted, fontFamily: 'monospace' },
  barsCard: {
    position: 'absolute', bottom: 0, right: -10,
    backgroundColor: COLORS.cardBg, borderRadius: 12, padding: 10,
    borderWidth: 1, borderColor: COLORS.cardBorder, width: 160,
  },
  barRow:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  barLabel: { fontSize: 9, color: COLORS.textMuted, width: 50 },
  barTrack: { flex: 1, height: 6, backgroundColor: COLORS.whiteAlpha10, borderRadius: 3, overflow: 'hidden' },
  barFill:  { height: 6, borderRadius: 3 },
  stepsContainer: { width: width - 80, gap: 16 },
  stepRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.cardBg, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: COLORS.cardBorder },
  stepNum:   { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  stepNumTxt:{ fontSize: 13, fontWeight: '800', color: COLORS.white },
  stepIcon:  { fontSize: 20 },
  stepTxt:   { flex: 1, fontSize: 12, color: COLORS.textMuted, lineHeight: 17 },
});

// ─── Slide data ───────────────────────────────────────────────────────────────
const SLIDES = [
  {
    illustration: <WelcomeIllustration />,
    tag:     'Bienvenido',
    title:   'Toma el control de\ntus finanzas',
    body:    'Cashmind centraliza todas tus deudas y ahorros en un solo lugar y usa matemáticas para decirte exactamente cuánto pagar cada mes.',
    color:   COLORS.primary,
  },
  {
    illustration: <SimplexIllustration />,
    tag:     'Optimizador',
    title:   'El cerebro detrás\nde Cashmind',
    body:    'Usamos el Modelo Simplex para distribuir tu presupuesto entre tus deudas minimizando al máximo los intereses que pagas. Si el dinero no alcanza, el Modelo Gran M sugiere qué deuda sacrificar este mes.',
    color:   '#818CF8',
  },
  {
    illustration: <StartIllustration />,
    tag:     'Empezar',
    title:   'Listo en\n4 pasos',
    body:    'En menos de 5 minutos tendrás tu plan de pagos optimizado y sabrás exactamente cuántos meses te faltan para liquidar todas tus deudas.',
    color:   COLORS.success,
  },
];

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function OnboardingScreen() {
  const router       = useRouter();
  const [current, setCurrent] = useState(0);
  const scrollRef    = useRef(null);
  const fadeAnim     = useRef(new Animated.Value(1)).current;

  const goTo = (index) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
    setCurrent(index);
    scrollRef.current?.scrollTo({ x: index * width, animated: true });
  };

  const handleNext = () => {
    if (current < SLIDES.length - 1) goTo(current + 1);
    else router.back();
  };

  const handleSkip = () => router.back();

  const slide = SLIDES[current];

  return (
    <View style={styles.container}>
      {/* Background glow */}
      <View style={[styles.bgGlow, { backgroundColor: slide.color + '18' }]} />

      {/* Skip */}
      {current < SLIDES.length - 1 && (
        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
          <Text style={styles.skipTxt}>Omitir</Text>
        </TouchableOpacity>
      )}

      {/* Scroll content */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        style={{ flex: 1 }}
      >
        {SLIDES.map((s, i) => (
          <View key={i} style={styles.slide}>
            {/* Illustration */}
            <View style={styles.illustrationWrap}>
              {s.illustration}
            </View>

            {/* Text */}
            <Animated.View style={[styles.textWrap, { opacity: fadeAnim }]}>
              <View style={[styles.tag, { backgroundColor: slide.color + '22', borderColor: slide.color + '44' }]}>
                <Text style={[styles.tagTxt, { color: slide.color }]}>{s.tag}</Text>
              </View>
              <Text style={styles.title}>{s.title}</Text>
              <Text style={styles.body}>{s.body}</Text>
            </Animated.View>
          </View>
        ))}
      </ScrollView>

      {/* Bottom controls */}
      <View style={styles.bottom}>
        {/* Dots */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => goTo(i)}>
              <View style={[
                styles.dot,
                i === current && { backgroundColor: slide.color, width: 24 },
              ]} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Button */}
        <TouchableOpacity
          style={[styles.nextBtn, { backgroundColor: slide.color }]}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <Text style={styles.nextBtnTxt}>
            {current === SLIDES.length - 1 ? 'Comenzar' : 'Siguiente'}
          </Text>
          <Text style={styles.nextBtnArrow}>→</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  bgGlow:    { position: 'absolute', top: 0, left: 0, right: 0, height: height * 0.6, borderBottomLeftRadius: 60, borderBottomRightRadius: 60 },

  skipBtn: { position: 'absolute', top: 56, right: SPACING.xl, zIndex: 10, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
  skipTxt: { fontSize: FONTS.base, color: COLORS.textMuted, fontWeight: '600' },

  slide:            { width, flex: 1, alignItems: 'center', paddingTop: 80, paddingHorizontal: 40 },
  illustrationWrap: { alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.xxl, height: 280 },

  textWrap:  { alignItems: 'center' },
  tag:       { borderRadius: RADIUS.xl, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderWidth: 1, marginBottom: SPACING.lg },
  tagTxt:    { fontSize: FONTS.sm, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  title:     { fontSize: FONTS.xxl + 2, fontWeight: '800', color: COLORS.textPrimary, textAlign: 'center', lineHeight: 36, marginBottom: SPACING.lg, letterSpacing: -0.5 },
  body:      { fontSize: FONTS.base, color: COLORS.textMuted, textAlign: 'center', lineHeight: 22 },

  bottom:  { paddingHorizontal: SPACING.xl, paddingBottom: 48, paddingTop: SPACING.lg },
  dots:    { flexDirection: 'row', justifyContent: 'center', gap: SPACING.sm, marginBottom: SPACING.xl },
  dot:     { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.whiteAlpha10 },

  nextBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: RADIUS.lg, paddingVertical: SPACING.lg, gap: SPACING.sm },
  nextBtnTxt:  { fontSize: FONTS.md, fontWeight: '700', color: COLORS.white },
  nextBtnArrow:{ fontSize: FONTS.lg, color: COLORS.white },
});
