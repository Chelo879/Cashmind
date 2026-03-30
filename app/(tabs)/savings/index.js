/**
 * app/(tabs)/savings/index.js
 * Lista de objetivos de ahorro con banner resumen.
 */
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import ScreenWrapper from '../../../components/ScreenWrapper';
import AnimatedBar from '../../../components/AnimatedBar';
import CashmindModal from '../../../components/CashmindModal';
import EmptyState from '../../../components/EmptyState';
import { COLORS, FONTS, RADIUS, SPACING } from '../../../constants/theme';
import { fmt, fraction } from '../../../utils/format';
import { useAppStore, agregarAhorro, eliminarAhorro } from '../../../utils/appStore';

const SAVING_ICON_MAP = {
  shield: 'shield-checkmark', airplane: 'airplane', laptop: 'laptop',
  car: 'car', home: 'home', phone: 'phone-portrait', school: 'school',
  diamond: 'diamond', barbell: 'barbell', 'musical-notes': 'musical-notes',
  leaf: 'leaf', medkit: 'medkit',
};

function TarjetaAhorro({ item, onPress, onEliminar }) {
  const progreso  = fraction(item.saved, item.goal);
  const restante  = item.goal - item.saved;
  const iconName  = SAVING_ICON_MAP[item.iconKey] ?? 'wallet-outline';

  const confirmarEliminar = () => {
    Alert.alert(
      'Eliminar objetivo',
      `¿Eliminar "${item.label}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => onEliminar(item.id) },
      ]
    );
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.cardHeader}>
        <View style={[styles.cardIconWrap, { backgroundColor: item.color + '22' }]}>
          <Ionicons name={iconName} size={22} color={item.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{item.label}</Text>
          <Text style={styles.cardTarget}>Meta: {item.targetDate}</Text>
        </View>
        <View style={styles.cardRight}>
          <Text style={styles.cardAmount}>{fmt(item.saved)}</Text>
          <Text style={styles.cardSub}>de {fmt(item.goal)}</Text>
        </View>
        <TouchableOpacity onPress={confirmarEliminar} style={styles.deleteBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="trash-outline" size={16} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>
      <AnimatedBar progress={progreso} color={item.color} />
      <View style={styles.cardFooter}>
        <Text style={styles.cardFooterTxt}>{Math.round(progreso * 100)}% alcanzado</Text>
        <Text style={styles.cardFooterTxt}>Faltan {fmt(restante)}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function SavingsScreen() {
  const router = useRouter();
  const { savings }             = useAppStore();
  const [modalVisible, setModalVisible] = useState(false);

  const totalSaved = savings.reduce((s, v) => s + v.saved, 0);
  const totalGoal  = savings.reduce((s, v) => s + v.goal, 0);

  return (
    <ScreenWrapper scrollable={false}>
      {/* Banner resumen — solo se muestra si hay ahorros */}
      {savings.length > 0 && (
        <View style={styles.banner}>
          <Text style={styles.bannerLabel}>Total ahorrado</Text>
          <Text style={styles.bannerAmount}>{fmt(totalSaved)}</Text>
          <AnimatedBar progress={fraction(totalSaved, totalGoal)} color={COLORS.lavender} height={6} />
          <Text style={styles.bannerSub}>de {fmt(totalGoal)} en todos los objetivos</Text>
        </View>
      )}

      <FlatList
        data={savings}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<EmptyState type="saving" onAction={() => setModalVisible(true)} />}
        contentContainerStyle={[styles.list, savings.length === 0 && { flex: 1 }]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TarjetaAhorro
            item={item}
            onPress={() => router.push({ pathname: '/savings/[id]', params: { id: item.id } })}
            onEliminar={eliminarAhorro}
          />
        )}
        ListFooterComponent={savings.length > 0 ? (
          <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)} activeOpacity={0.8}>
            <Text style={styles.addBtnTxt}>＋  Nuevo objetivo de ahorro</Text>
          </TouchableOpacity>
        ) : null}
      />

      <CashmindModal
        visible={modalVisible}
        type="saving"
        onClose={() => setModalVisible(false)}
        onSaveSaving={agregarAhorro}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: COLORS.primaryDark, borderRadius: RADIUS.xl,
    padding: SPACING.xxl, marginHorizontal: SPACING.xl,
    marginTop: SPACING.lg, marginBottom: SPACING.xl,
  },
  bannerLabel:   { fontSize: FONTS.base, color: COLORS.textLight, marginBottom: 4 },
  bannerAmount:  { fontSize: FONTS.hero - 4, fontWeight: '800', color: COLORS.white, letterSpacing: -0.5, marginBottom: SPACING.md },
  bannerSub:     { fontSize: FONTS.sm, color: COLORS.textLight, marginTop: 6 },
  list:          { paddingHorizontal: SPACING.xl, paddingBottom: 40 },
  card: {
    backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg,
    padding: SPACING.lg, marginBottom: SPACING.md,
    borderWidth: 1, borderColor: COLORS.cardBorder,
  },
  cardHeader:    { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md },
  cardIconWrap:  { width: 44, height: 44, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md },
  cardTitle:     { fontSize: FONTS.md, fontWeight: '600', color: COLORS.textPrimary },
  cardTarget:    { fontSize: FONTS.sm, color: COLORS.textMuted, marginTop: 2 },
  cardRight:     { alignItems: 'flex-end', marginRight: SPACING.sm },
  cardAmount:    { fontSize: FONTS.lg - 1, fontWeight: '700', color: COLORS.textPrimary },
  cardSub:       { fontSize: FONTS.sm, color: COLORS.textMuted },
  deleteBtn:     { padding: 4 },
  cardFooter:    { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.sm },
  cardFooterTxt: { fontSize: FONTS.sm, color: COLORS.textMuted },
  addBtn: {
    backgroundColor: COLORS.primaryAlpha12, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.primaryAlpha30,
    paddingVertical: SPACING.lg, alignItems: 'center', marginTop: SPACING.sm,
  },
  addBtnTxt: { fontSize: FONTS.md, fontWeight: '600', color: COLORS.primary },
});
