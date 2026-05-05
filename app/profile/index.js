import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch, Alert, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import ScreenWrapper from '../../components/ScreenWrapper';
import { COLORS, FONTS, RADIUS, SPACING } from '../../constants/theme';
import { mockUser } from '../../constants/mockData';
import { fmt } from '../../utils/format';

function OptionRow({ emoji, label, onPress, isSwitch, switchValue, onSwitchChange, danger }) {
  return (
    <TouchableOpacity
      style={styles.optionRow}
      onPress={isSwitch ? undefined : onPress}
      activeOpacity={isSwitch ? 1 : 0.7}
    >
      <Text style={styles.optionEmoji}>{emoji}</Text>
      <Text style={[styles.optionLabel, danger && { color: COLORS.danger }]}>{label}</Text>
      {isSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: COLORS.whiteAlpha10, true: COLORS.primary }}
          thumbColor={COLORS.white}
        />
      ) : (
        <Text style={styles.optionChevron}>{'>'}</Text>
      )}
    </TouchableOpacity>
  );
}

function OptionGroup({ title, children }) {
  return (
    <View style={styles.group}>
      {title ? <Text style={styles.groupTitle}>{title}</Text> : null}
      <View style={styles.groupCard}>{children}</View>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState(true);
  const [biometrics,    setBiometrics]    = useState(false);
  const [budget,        setBudget]        = useState('10000');
  const [editingBudget, setEditingBudget] = useState(false);
  const [tempBudget,    setTempBudget]    = useState('');

  const handleEditBudget = () => {
    setTempBudget(budget);
    setEditingBudget(true);
  };

  const handleSaveBudget = () => {
    if (tempBudget && parseFloat(tempBudget) > 0) {
      setBudget(tempBudget);
    }
    setEditingBudget(false);
  };

  const handleLogout = () => {
    Alert.alert('Cerrar sesion', 'Estas seguro que deseas cerrar sesion?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesion', style: 'destructive', onPress: () => {} },
    ]);
  };

  return (
    <ScreenWrapper>
      {/* Avatar */}
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarTxt}>{mockUser.name[0]}</Text>
        </View>
        <Text style={styles.profileName}>{mockUser.name}</Text>
        <Text style={styles.profileEmail}>{mockUser.email}</Text>
        <Text style={styles.profileSince}>Miembro desde {mockUser.memberSince}</Text>
      </View>

      {/* Budget Card */}
      <View style={styles.budgetCard}>
        <View style={styles.budgetCardTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.budgetCardLabel}>Presupuesto mensual (P)</Text>
            <Text style={styles.budgetCardHint}>Disponible para pagar deudas este mes</Text>
          </View>
          <TouchableOpacity style={styles.budgetEditBtn} onPress={handleEditBudget} activeOpacity={0.8}>
            <Text style={styles.budgetEditTxt}>Editar</Text>
          </TouchableOpacity>
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
              placeholder="0.00"
              placeholderTextColor={COLORS.textMuted}
            />
            <TouchableOpacity style={styles.budgetSaveBtn} onPress={handleSaveBudget} activeOpacity={0.8}>
              <Text style={styles.budgetSaveTxt}>Guardar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.budgetAmount}>{fmt(parseFloat(budget) || 0)}</Text>
        )}

        <View style={styles.budgetInfoRow}>
          <Text style={styles.budgetInfoTxt}>
            El optimizador usa este valor para distribuir tus pagos cada mes con el modelo Simplex
          </Text>
        </View>
      </View>

      {/* Options */}
      <OptionGroup title="Mi cuenta">
        <OptionRow emoji="👤" label="Editar perfil"      onPress={() => {}} />
        <OptionRow emoji="🔒" label="Cambiar contrasena" onPress={() => {}} />
        <OptionRow emoji="💳" label="Metodos de pago"    onPress={() => {}} />
      </OptionGroup>

      <OptionGroup title="Preferencias">
        <OptionRow emoji="🔔" label="Notificaciones"      isSwitch switchValue={notifications} onSwitchChange={setNotifications} />
        <OptionRow emoji="🌙" label="Tema oscuro"          isSwitch switchValue={true}          onSwitchChange={() => {}} />
      </OptionGroup>

      <OptionGroup title="Soporte">
        <OptionRow emoji="🎓" label="Como funciona Cashmind" onPress={() => router.push('/onboarding')} />
        <OptionRow emoji="📨" label="Contactar soporte"     onPress={() => router.push('/profile/help')} />
        <OptionRow emoji="📄" label="Terminos y privacidad" onPress={() => {}} />
      </OptionGroup>

      <OptionGroup>
        <OptionRow emoji="🚪" label="Cerrar sesion" onPress={handleLogout} danger />
      </OptionGroup>

      <Text style={styles.version}>Cashmind v1.0.0</Text>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  profileHeader: { alignItems: 'center', marginBottom: SPACING.xl },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.md, elevation: 6,
  },
  avatarTxt:    { fontSize: 36, fontWeight: '700', color: COLORS.white },
  profileName:  { fontSize: FONTS.xl, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  profileEmail: { fontSize: FONTS.base, color: COLORS.textMuted, marginBottom: 4 },
  profileSince: { fontSize: FONTS.sm, color: COLORS.textMuted },

  budgetCard: {
    backgroundColor: COLORS.primaryDark, borderRadius: RADIUS.xl,
    padding: SPACING.xl, marginBottom: SPACING.xl,
    borderWidth: 1, borderColor: COLORS.cardBorder,
  },
  budgetCardTop:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.md },
  budgetCardLabel:{ fontSize: FONTS.base, fontWeight: '700', color: COLORS.white },
  budgetCardHint: { fontSize: FONTS.sm, color: COLORS.textLight, marginTop: 2 },
  budgetEditBtn:  { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs },
  budgetEditTxt:  { fontSize: FONTS.sm, color: COLORS.white, fontWeight: '600' },
  budgetAmount:   { fontSize: 34, fontWeight: '800', color: COLORS.white, letterSpacing: -0.5, marginBottom: SPACING.md },
  budgetInputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md, gap: SPACING.sm },
  budgetPrefix:   { fontSize: FONTS.xl, color: COLORS.white, fontWeight: '700' },
  budgetInput:    { flex: 1, fontSize: 28, fontWeight: '800', color: COLORS.white, borderBottomWidth: 2, borderBottomColor: COLORS.lavender, paddingBottom: 4 },
  budgetSaveBtn:  { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
  budgetSaveTxt:  { fontSize: FONTS.sm, color: COLORS.white, fontWeight: '700' },
  budgetInfoRow:  { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: RADIUS.md, padding: SPACING.sm },
  budgetInfoTxt:  { fontSize: FONTS.sm, color: COLORS.textLight, lineHeight: 18 },

  group:      { marginBottom: SPACING.xl },
  groupTitle: { fontSize: FONTS.sm, color: COLORS.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: SPACING.sm },
  groupCard:  { backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.cardBorder, overflow: 'hidden' },
  optionRow:  { flexDirection: 'row', alignItems: 'center', padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.cardBorder },
  optionEmoji:   { fontSize: 18, marginRight: SPACING.md },
  optionLabel:   { flex: 1, fontSize: FONTS.md - 1, color: COLORS.textPrimary },
  optionChevron: { fontSize: FONTS.lg, color: COLORS.textMuted },
  version: { textAlign: 'center', fontSize: FONTS.sm, color: COLORS.textMuted, marginTop: SPACING.sm },
});
