import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import ScreenWrapper from '../../components/ScreenWrapper';
import AnimatedBar from '../../components/AnimatedBar';
import CashmindModal from '../../components/CashmindModal';
import { COLORS, FONTS, RADIUS, SPACING } from '../../constants/theme';
import { mockDebts } from '../../constants/mockData';
import EmptyState from '../../components/EmptyState';
import { fmt, fraction } from '../../utils/format';

function DebtCard({ item, onPress }) {
  const remaining = item.totalAmount - item.paidAmount;
  const progress  = fraction(item.paidAmount, item.totalAmount);
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.cardHeader}>
        <View style={[styles.dot, { backgroundColor: item.color }]} />
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{item.label}</Text>
          <Text style={styles.cardCategory}>{item.category}</Text>
        </View>
        <View style={styles.cardRight}>
          <Text style={styles.cardAmount}>{fmt(remaining)}</Text>
          <Text style={styles.cardSub}>pendiente</Text>
        </View>
      </View>
      <AnimatedBar progress={progress} color={item.color} />
      <View style={styles.cardFooter}>
        <Text style={styles.cardFooterTxt}>Pagado {fmt(item.paidAmount)}</Text>
        <Text style={styles.cardFooterTxt}>Vence {item.dueDateLabel}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function DebtsScreen() {
  const router    = useRouter();
  const [debts, setDebts]               = useState(mockDebts);
  const [modalVisible, setModalVisible] = useState(false);

  const totalDebt = debts.reduce((s, d) => s + (d.totalAmount - d.paidAmount), 0);

  const handleAddDebt = (newDebt) => setDebts((prev) => [...prev, newDebt]);

  return (
    <ScreenWrapper scrollable={false}>
      <View style={styles.banner}>
        <Text style={styles.bannerLabel}>Total adeudado</Text>
        <Text style={styles.bannerAmount}>{fmt(totalDebt)}</Text>
        <Text style={styles.bannerSub}>{debts.length} deudas activas</Text>
      </View>
      <FlatList
        data={debts}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<EmptyState type="debt" onAction={() => setModalVisible(true)} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <DebtCard item={item} onPress={() => router.push({ pathname: '/debts/[id]', params: { id: item.id } })} />
        )}
        ListFooterComponent={
          <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)} activeOpacity={0.8}>
            <Text style={styles.addBtnTxt}>＋  Añadir deuda</Text>
          </TouchableOpacity>
        }
      />
      <CashmindModal
        visible={modalVisible}
        type="debt"
        onClose={() => setModalVisible(false)}
        onSaveDebt={handleAddDebt}
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
  bannerLabel: { fontSize: FONTS.base, color: COLORS.textLight, marginBottom: 4 },
  bannerAmount: { fontSize: FONTS.hero - 4, fontWeight: '800', color: COLORS.white, letterSpacing: -0.5 },
  bannerSub: { fontSize: FONTS.base, color: COLORS.textLight, marginTop: 4 },
  list: { paddingHorizontal: SPACING.xl, paddingBottom: 40 },
  card: {
    backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg,
    padding: SPACING.lg, marginBottom: SPACING.md,
    borderWidth: 1, borderColor: COLORS.cardBorder,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md },
  dot: { width: 12, height: 12, borderRadius: 6, marginRight: SPACING.sm },
  cardTitle: { fontSize: FONTS.md, fontWeight: '600', color: COLORS.textPrimary },
  cardCategory: { fontSize: FONTS.sm, color: COLORS.textMuted, marginTop: 2 },
  cardRight: { alignItems: 'flex-end' },
  cardAmount: { fontSize: FONTS.lg - 1, fontWeight: '700', color: COLORS.textPrimary },
  cardSub: { fontSize: FONTS.sm, color: COLORS.textMuted },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.sm },
  cardFooterTxt: { fontSize: FONTS.sm, color: COLORS.textMuted },
  addBtn: {
    backgroundColor: COLORS.primaryAlpha12, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.primaryAlpha30,
    paddingVertical: SPACING.lg, alignItems: 'center', marginTop: SPACING.sm,
  },
  addBtnTxt: { fontSize: FONTS.md, fontWeight: '600', color: COLORS.primary },
});
