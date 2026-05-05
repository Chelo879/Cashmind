/**
 * app/(tabs)/profile/index.js
 * Perfil del usuario — datos reales del registro, presupuesto, notificaciones.
 */
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  TextInput, Switch, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../../../components/ScreenWrapper';
import { COLORS, FONTS, RADIUS, SPACING } from '../../../constants/theme';
import { fmt } from '../../../utils/format';
import { useAppStore, setBudget } from '../../../utils/appStore';
import { useAuth, logout } from '../../../utils/authStore';

function OptionRow({ icon, label, onPress, isSwitch, switchValue, onSwitchChange, danger, isLast }) {
  return (
    <TouchableOpacity
      style={[styles.optionRow, isLast && styles.optionRowLast]}
      onPress={onPress}
      activeOpacity={isSwitch ? 1 : 0.7}
      disabled={isSwitch}
    >
      <Ionicons
        name={icon}
        size={20}
        color={danger ? COLORS.danger : COLORS.textMuted}
        style={styles.optionIcon}
      />
      <Text style={[styles.optionLabel, danger && styles.optionLabelDanger]}>{label}</Text>
      {isSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: COLORS.cardBorder, true: COLORS.primary }}
          thumbColor={COLORS.white}
        />
      ) : (
        <Ionicons name="chevron-forward" size={16} color={danger ? COLORS.danger : COLORS.textMuted} />
      )}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const router  = useRouter();
  const { budget }                        = useAppStore();
  const { user }                          = useAuth();
  const [editingBudget, setEditingBudget] = useState(false);
  const [tempBudget,    setTempBudget]    = useState('');
  const [notifications, setNotifications] = useState(true);

  const nombreInicial = user.name ? user.name[0].toUpperCase() : '?';

  const handleEditBudget = () => {
    setTempBudget(budget.toString());
    setEditingBudget(true);
  };

  const handleSaveBudget = async () => {
    const val = parseFloat(tempBudget);
    if (val > 0) await setBudget(val);
    setEditingBudget(false);
  };

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesión', style: 'destructive',
        onPress: async () => { await logout(); },
      },
    ]);
  };

  return (
    <ScreenWrapper>
      <Text style={styles.screenTitle}>Perfil</Text>

      {/* Avatar + datos del usuario */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarTxt}>{nombreInicial}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.userName}>{user.name || 'Usuario'}</Text>
          <Text style={styles.userEmail}>{user.email || ''}</Text>
          {user.memberSince ? (
            <Text style={styles.userSince}>Miembro desde {user.memberSince}</Text>
          ) : null}
        </View>
      </View>

      {/* Presupuesto */}
      <View style={styles.budgetCard}>
        <View style={styles.budgetCardTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.budgetCardLabel}>Presupuesto mensual (P)</Text>
            <Text style={styles.budgetCardHint}>Disponible para pagar deudas este mes</Text>
          </View>
          {!editingBudget && (
            <TouchableOpacity style={styles.budgetEditBtn} onPress={handleEditBudget} activeOpacity={0.8}>
              <Text style={styles.budgetEditTxt}>Editar</Text>
            </TouchableOpacity>
          )}
        </View>

        {editingBudget ? (
          <View style={styles.budgetInputRow}>
            <Text style={styles.budgetPrefix}>$</Text>
            <TextInput
              style={styles.budgetInput}
              value={tempBudget}
              onChangeText={setTempBudget}
              keyboardType="decimal-pad"
              autoFocus
              selectTextOnFocus
            />
            <TouchableOpacity style={styles.budgetSaveBtn} onPress={handleSaveBudget}>
              <Text style={styles.budgetSaveTxt}>Guardar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.budgetAmount}>{fmt(budget)}</Text>
        )}
      </View>

      {/* Cuenta */}
      <Text style={styles.sectionTitle}>Cuenta</Text>
      <View style={styles.optionGroup}>
        <OptionRow
          icon="person-circle-outline"
          label="Información del Perfil"
          onPress={() => router.push('/profile/settings')}
        />
        <OptionRow
          icon="notifications-outline"
          label="Notificaciones"
          isSwitch
          switchValue={notifications}
          onSwitchChange={setNotifications}
          isLast
        />
      </View>

      {/* App */}
      <Text style={styles.sectionTitle}>App</Text>
      <View style={styles.optionGroup}>
        <OptionRow
          icon="school-outline"
          label="Cómo funciona Cashmind"
          onPress={() => router.push('/onboarding')}
        />
        <OptionRow
          icon="help-circle-outline"
          label="Ayuda y Soporte"
          onPress={() => router.push('/profile/help')}
          isLast
        />
      </View>

      {/* Cerrar sesión */}
      <View style={[styles.optionGroup, { marginTop: SPACING.md }]}>
        <OptionRow
          icon="log-out-outline"
          label="Cerrar sesión"
          onPress={handleLogout}
          danger
          isLast
        />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  screenTitle: { fontSize: FONTS.xxl, fontWeight: '800', color: COLORS.textPrimary, marginBottom: SPACING.xl, letterSpacing: -0.5 },

  avatarSection: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.lg,
    backgroundColor: COLORS.cardBg, borderRadius: RADIUS.xl,
    padding: SPACING.xl, marginBottom: SPACING.xl,
    borderWidth: 1, borderColor: COLORS.cardBorder,
  },
  avatar:    { width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { fontSize: 26, fontWeight: '700', color: COLORS.white },
  userName:  { fontSize: FONTS.lg, fontWeight: '700', color: COLORS.textPrimary },
  userEmail: { fontSize: FONTS.sm, color: COLORS.textMuted, marginTop: 2 },
  userSince: { fontSize: FONTS.sm, color: COLORS.textMuted, marginTop: 2 },

  budgetCard:      { backgroundColor: COLORS.primaryDark, borderRadius: RADIUS.xl, padding: SPACING.xl, marginBottom: SPACING.xl, borderWidth: 1, borderColor: COLORS.cardBorder },
  budgetCardTop:   { flexDirection: 'row', alignItems: 'flex-start', marginBottom: SPACING.md },
  budgetCardLabel: { fontSize: FONTS.base, fontWeight: '600', color: COLORS.textLight },
  budgetCardHint:  { fontSize: FONTS.sm, color: COLORS.textMuted, marginTop: 2 },
  budgetEditBtn:   { backgroundColor: COLORS.primaryAlpha30, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs },
  budgetEditTxt:   { fontSize: FONTS.sm, color: COLORS.lavender, fontWeight: '600' },
  budgetAmount:    { fontSize: 34, fontWeight: '800', color: COLORS.white, letterSpacing: -0.5 },
  budgetInputRow:  { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  budgetPrefix:    { fontSize: FONTS.xl, color: COLORS.textLight, fontWeight: '700' },
  budgetInput:     { flex: 1, fontSize: FONTS.xl, fontWeight: '700', color: COLORS.white, borderBottomWidth: 2, borderBottomColor: COLORS.primary, paddingVertical: 4 },
  budgetSaveBtn:   { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm },
  budgetSaveTxt:   { fontSize: FONTS.base, color: COLORS.white, fontWeight: '700' },

  sectionTitle:      { fontSize: FONTS.sm, fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: SPACING.sm, marginLeft: 4 },
  optionGroup:       { backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.cardBorder, marginBottom: SPACING.lg, overflow: 'hidden' },
  optionRow:         { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.cardBorder },
  optionRowLast:     { borderBottomWidth: 0 },
  optionIcon:        { marginRight: SPACING.md },
  optionLabel:       { flex: 1, fontSize: FONTS.base, color: COLORS.textPrimary },
  optionLabelDanger: { color: COLORS.danger },
});
