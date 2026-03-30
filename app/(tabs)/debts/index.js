/**
 * app/(tabs)/debts/index.js
 * Lista de deudas con banner resumen y modal para agregar nueva deuda.
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
import { useAppStore, agregarDeuda, eliminarDeuda } from '../../../utils/appStore';

// Ícono por categoría de deuda
const DEBT_ICON = {
  credit_card: 'card',
  mortgage:    'home',
  auto:        'car',
  personal:    'person',
  other:       'wallet-outline',
};

function TarjetaDeuda({ item, onPress, onEliminar }) {
  const restante  = item.totalAmount - item.paidAmount;
  const progreso  = fraction(item.paidAmount, item.totalAmount);
  const isUrgent  = item.daysUntilDue <= 7;
  const iconName  = DEBT_ICON[item.categoryKey] ?? 'card';

  const confirmarEliminar = () => {
    Alert.alert(
      'Eliminar deuda',
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
          <Ionicons name={iconName} size={20} color={item.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.label}</Text>
          <Text style={styles.cardCategory}>{item.category}</Text>
        </View>
        <View style={styles.cardRight}>
          <Text style={styles.cardAmount}>{fmt(restante)}</Text>
          <Text style={styles.cardSub}>pendiente</Text>
        </View>
        <TouchableOpacity onPress={confirmarEliminar} style={styles.deleteBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="trash-outline" size={16} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      <AnimatedBar progress={progreso} color={item.color} />

      <View style={styles.cardFooter}>
        <Text style={styles.cardFooterTxt}>{Math.round(progreso * 100)}% pagado</Text>
        <View style={styles.dueBadge}>
          {isUrgent && <Ionicons name="warning-outline" size={12} color={COLORS.danger} style={{ marginRight: 3 }} />}
          <Text style={[styles.dueTxt, isUrgent && { color: COLORS.danger }]}>
            Vence {item.dueDateLabel}
          </Text>
        </View>
      </View>

      {item.minPayment && (
        <View style={styles.minPayRow}>
          <Text style={styles.minPayTxt}>Pago mínimo: </Text>
          <Text style={styles.minPayAmt}>{fmt(item.minPayment)}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function DebtsScreen() {
  const router = useRouter();
  const { debts }               = useAppStore();
  const [modalVisible, setModalVisible] = useState(false);

  const totalDebt     = debts.reduce((s, d) => s + (d.totalAmount - d.paidAmount), 0);
  const totalPaid     = debts.reduce((s, d) => s + d.paidAmount, 0);
  const totalOriginal = debts.reduce((s, d) => s + d.totalAmount, 0);

  return (
    <ScreenWrapper scrollable={false}>
      {/* Banner resumen — solo se muestra si hay deudas */}
      {debts.length > 0 && (
        <View style={styles.banner}>
          <Text style={styles.bannerLabel}>Deuda total pendiente</Text>
          <Text style={styles.bannerAmount}>{fmt(totalDebt)}</Text>
          <AnimatedBar progress={fraction(totalPaid, totalOriginal)} color={COLORS.lavender} height={6} />
          <Text style={styles.bannerSub}>
            {Math.round(fraction(totalPaid, totalOriginal) * 100)}% pagado de {fmt(totalOriginal)} original
          </Text>
        </View>
      )}

      <FlatList
        data={debts}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<EmptyState type="debt" onAction={() => setModalVisible(true)} />}
        contentContainerStyle={[styles.list, debts.length === 0 && { flex: 1 }]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TarjetaDeuda
            item={item}
            onPress={() => router.push({ pathname: '/debts/[id]', params: { id: item.id } })}
            onEliminar={eliminarDeuda}
          />
        )}
        ListFooterComponent={debts.length > 0 ? (
          <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)} activeOpacity={0.8}>
            <Text style={styles.addBtnTxt}>＋  Nueva deuda</Text>
          </TouchableOpacity>
        ) : null}
      />

      <CashmindModal
        visible={modalVisible}
        type="debt"
        onClose={() => setModalVisible(false)}
        onSaveDebt={agregarDeuda}
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
  bannerLabel:  { fontSize: FONTS.base, color: COLORS.textLight, marginBottom: 4 },
  bannerAmount: { fontSize: FONTS.hero - 4, fontWeight: '800', color: COLORS.white, letterSpacing: -0.5, marginBottom: SPACING.md },
  bannerSub:    { fontSize: FONTS.sm, color: COLORS.textLight, marginTop: 6 },

  list: { paddingHorizontal: SPACING.xl, paddingBottom: 40 },

  card: {
    backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg,
    padding: SPACING.lg, marginBottom: SPACING.md,
    borderWidth: 1, borderColor: COLORS.cardBorder,
  },
  cardHeader:   { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md },
  cardIconWrap: { width: 44, height: 44, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md },
  cardTitle:    { fontSize: FONTS.md, fontWeight: '600', color: COLORS.textPrimary },
  cardCategory: { fontSize: FONTS.sm, color: COLORS.textMuted, marginTop: 2 },
  cardRight:    { alignItems: 'flex-end', marginRight: SPACING.sm },
  cardAmount:   { fontSize: FONTS.lg - 1, fontWeight: '700', color: COLORS.textPrimary },
  cardSub:      { fontSize: FONTS.sm, color: COLORS.textMuted },
  deleteBtn:    { padding: 4 },

  cardFooter:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: SPACING.sm },
  cardFooterTxt: { fontSize: FONTS.sm, color: COLORS.textMuted },
  dueBadge:      { flexDirection: 'row', alignItems: 'center' },
  dueTxt:        { fontSize: FONTS.sm, color: COLORS.textMuted },

  minPayRow: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.xs, paddingTop: SPACING.xs, borderTopWidth: 1, borderTopColor: COLORS.cardBorder },
  minPayTxt: { fontSize: FONTS.sm, color: COLORS.textMuted },
  minPayAmt: { fontSize: FONTS.sm, fontWeight: '700', color: COLORS.primary },

  addBtn: {
    backgroundColor: COLORS.primaryAlpha12, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.primaryAlpha30,
    paddingVertical: SPACING.lg, alignItems: 'center', marginTop: SPACING.sm,
  },
  addBtnTxt: { fontSize: FONTS.md, fontWeight: '600', color: COLORS.primary },
});
