import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import ScreenWrapper from '../../components/ScreenWrapper';
import AnimatedBar from '../../components/AnimatedBar';
import CashmindModal from '../../components/CashmindModal';
import { COLORS, FONTS, RADIUS, SPACING } from '../../constants/theme';
import { mockSavings } from '../../constants/mockData';
import EmptyState from '../../components/EmptyState';
import { fmt, fraction } from '../../utils/format';

function SavingCard({ item, onPress }) {
  const progress  = fraction(item.saved, item.goal);
  const remaining = item.goal - item.saved;
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardEmoji}>{item.emoji}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{item.label}</Text>
          <Text style={styles.cardTarget}>Meta: {item.targetDate}</Text>
        </View>
        <View style={styles.cardRight}>
          <Text style={styles.cardAmount}>{fmt(item.saved)}</Text>
          <Text style={styles.cardSub}>de {fmt(item.goal)}</Text>
        </View>
      </View>
      <AnimatedBar progress={progress} color={item.color} />
      <View style={styles.cardFooter}>
        <Text style={styles.cardFooterTxt}>{Math.round(progress * 100)}% alcanzado</Text>
        <Text style={styles.cardFooterTxt}>Faltan {fmt(remaining)}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function SavingsScreen() {
  const router      = useRouter();
  const [savings, setSavings]           = useState(mockSavings);
  const [modalVisible, setModalVisible] = useState(false);

  const totalSaved = savings.reduce((s, v) => s + v.saved, 0);
  const totalGoal  = savings.reduce((s, v) => s + v.goal, 0);

  const handleAddSaving = (newSaving) => setSavings((prev) => [...prev, newSaving]);

  return (
    <ScreenWrapper scrollable={false}>
      <View style={styles.banner}>
        <Text style={styles.bannerLabel}>Total ahorrado</Text>
        <Text style={styles.bannerAmount}>{fmt(totalSaved)}</Text>
        <AnimatedBar progress={fraction(totalSaved, totalGoal)} color={COLORS.lavender} height={6} />
        <Text style={styles.bannerSub}>de {fmt(totalGoal)} en todos los objetivos</Text>
      </View>
      <FlatList
        data={savings}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<EmptyState type="saving" onAction={() => setModalVisible(true)} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <SavingCard item={item} onPress={() => router.push({ pathname: '/savings/[id]', params: { id: item.id } })} />
        )}
        ListFooterComponent={
          <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)} activeOpacity={0.8}>
            <Text style={styles.addBtnTxt}>＋  Nuevo objetivo de ahorro</Text>
          </TouchableOpacity>
        }
      />
      <CashmindModal
        visible={modalVisible}
        type="saving"
        onClose={() => setModalVisible(false)}
        onSaveSaving={handleAddSaving}
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
  bannerAmount: { fontSize: FONTS.hero - 4, fontWeight: '800', color: COLORS.white, letterSpacing: -0.5, marginBottom: SPACING.md },
  bannerSub: { fontSize: FONTS.sm, color: COLORS.textLight, marginTop: 6 },
  list: { paddingHorizontal: SPACING.xl, paddingBottom: 40 },
  card: {
    backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg,
    padding: SPACING.lg, marginBottom: SPACING.md,
    borderWidth: 1, borderColor: COLORS.cardBorder,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md },
  cardEmoji: { fontSize: 28, marginRight: SPACING.md },
  cardTitle: { fontSize: FONTS.md, fontWeight: '600', color: COLORS.textPrimary },
  cardTarget: { fontSize: FONTS.sm, color: COLORS.textMuted, marginTop: 2 },
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
