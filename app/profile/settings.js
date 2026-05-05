/**
 * app/profile/settings.js
 * Configuración del perfil — Nombre, fecha de registro, seguridad.
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  TextInput, Modal, ScrollView, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../../components/ScreenWrapper';
import { COLORS, FONTS, RADIUS, SPACING } from '../../constants/theme';
import { useAuth, changeUserPassword, deleteAccount as firebaseDeleteAccount, updateUserName } from '../../utils/authStore';

function ActionButton({ label, icon, onPress, danger, isLast }) {
  return (
    <TouchableOpacity
      style={[styles.actionBtn, isLast && styles.actionBtnLast]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons
        name={icon}
        size={20}
        color={danger ? COLORS.danger : COLORS.primary}
        style={styles.actionIcon}
      />
      <Text style={[styles.actionLabel, danger && styles.actionLabelDanger]}>{label}</Text>
      <Ionicons
        name="chevron-forward"
        size={16}
        color={danger ? COLORS.danger : COLORS.textMuted}
      />
    </TouchableOpacity>
  );
}

export default function ProfileSettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [pwModal, setPwModal] = useState(false);
  const [delModal, setDelModal] = useState(false);
  const [nameModal, setNameModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Name update states
  const [newName, setNewName] = useState(user.name || '');

  // Password change states
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw]         = useState('');
  const [confirmNewPw, setConfirmNewPw] = useState('');

  // Delete account states
  const [delPw1, setDelPw1] = useState('');
  const [delPw2, setDelPw2] = useState('');

  const handleUpdateName = async () => {
    if (!newName.trim()) {
      return Alert.alert('Error', 'El nombre no puede estar vacío');
    }

    setLoading(true);
    try {
      await updateUserName(newName.trim());
      Alert.alert('Éxito', 'Nombre actualizado correctamente');
      setNameModal(false);
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el nombre.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPw || !newPw || !confirmNewPw) {
      return Alert.alert('Error', 'Todos los campos son obligatorios');
    }
    if (newPw !== confirmNewPw) {
      return Alert.alert('Error', 'Las nuevas contraseñas no coinciden');
    }
    if (newPw.length < 6) {
      return Alert.alert('Error', 'La nueva contraseña debe tener al menos 6 caracteres');
    }

    setLoading(true);
    try {
      await changeUserPassword(currentPw, newPw);
      Alert.alert('Éxito', 'Contraseña actualizada correctamente');
      setPwModal(false);
      resetPwStates();
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar la contraseña. Verifica tu contraseña actual.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!delPw1 || !delPw2) {
      return Alert.alert('Error', 'Debes escribir tu contraseña dos veces');
    }
    if (delPw1 !== delPw2) {
      return Alert.alert('Error', 'Las contraseñas no coinciden');
    }

    setLoading(true);
    try {
      await firebaseDeleteAccount(delPw1);
      Alert.alert('Cuenta eliminada', 'Tu cuenta ha sido eliminada permanentemente.');
      // El logout y redirección debería ser automático por onAuthStateChanged
    } catch (error) {
      Alert.alert('Error', 'No se pudo eliminar la cuenta. Verifica tu contraseña.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const resetPwStates = () => {
    setCurrentPw('');
    setNewPw('');
    setConfirmNewPw('');
  };

  const resetDelStates = () => {
    setDelPw1('');
    setDelPw2('');
  };

  return (
    <ScreenWrapper>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Información del Perfil</Text>
      </View>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <View style={styles.avatarLarge}>
          <Text style={styles.avatarLargeTxt}>
            {user.name ? user.name[0].toUpperCase() : '?'}
          </Text>
        </View>
        <Text style={styles.userName}>{user.name || 'Usuario'}</Text>
        <Text style={styles.userEmail}>{user.email}</Text>
        {user.memberSince ? (
          <View style={styles.badge}>
            <Text style={styles.badgeTxt}>Miembro desde {user.memberSince}</Text>
          </View>
        ) : null}
      </View>

      {/* Actions */}
      <Text style={styles.sectionTitle}>General</Text>
      <View style={styles.actionGroup}>
        <ActionButton
          icon="person-outline"
          label="Cambiar nombre"
          onPress={() => {
            setNewName(user.name || '');
            setNameModal(true);
          }}
          isLast
        />
      </View>

      <Text style={[styles.sectionTitle, { marginTop: SPACING.lg }]}>Seguridad</Text>
      <View style={styles.actionGroup}>
        <ActionButton
          icon="key-outline"
          label="Cambiar contraseña"
          onPress={() => setPwModal(true)}
        />
        <ActionButton
          icon="trash-outline"
          label="Eliminar cuenta"
          onPress={() => setDelModal(true)}
          danger
          isLast
        />
      </View>

      {/* Name Change Modal */}
      <Modal visible={nameModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cambiar nombre</Text>
              <TouchableOpacity onPress={() => setNameModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Nuevo nombre</Text>
              <TextInput
                style={styles.input}
                value={newName}
                onChangeText={setNewName}
                placeholder="Tu nombre"
                placeholderTextColor={COLORS.textMuted}
                autoFocus
              />

              <TouchableOpacity
                style={[styles.saveBtn, loading && styles.btnDisabled]}
                onPress={handleUpdateName}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.saveBtnTxt}>Guardar cambios</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Password Change Modal */}
      <Modal visible={pwModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cambiar contraseña</Text>
              <TouchableOpacity onPress={() => { setPwModal(false); resetPwStates(); }}>
                <Ionicons name="close" size={24} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Contraseña actual</Text>
              <TextInput
                style={styles.input}
                secureTextEntry
                value={currentPw}
                onChangeText={setCurrentPw}
                placeholder="••••••••"
                placeholderTextColor={COLORS.textMuted}
              />

              <Text style={[styles.inputLabel, { marginTop: SPACING.lg }]}>Nueva contraseña</Text>
              <TextInput
                style={styles.input}
                secureTextEntry
                value={newPw}
                onChangeText={setNewPw}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor={COLORS.textMuted}
              />

              <Text style={[styles.inputLabel, { marginTop: SPACING.lg }]}>Confirmar nueva contraseña</Text>
              <TextInput
                style={styles.input}
                secureTextEntry
                value={confirmNewPw}
                onChangeText={setConfirmNewPw}
                placeholder="Repite la contraseña"
                placeholderTextColor={COLORS.textMuted}
              />

              <TouchableOpacity
                style={[styles.saveBtn, loading && styles.btnDisabled]}
                onPress={handleChangePassword}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.saveBtnTxt}>Actualizar contraseña</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Delete Account Modal */}
      <Modal visible={delModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: COLORS.danger }]}>Eliminar cuenta</Text>
              <TouchableOpacity onPress={() => { setDelModal(false); resetDelStates(); }}>
                <Ionicons name="close" size={24} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.warningBox}>
                <Ionicons name="warning" size={24} color={COLORS.danger} />
                <Text style={styles.warningTxt}>
                  Esta acción es permanente y no se puede deshacer. Se borrarán todos tus datos de deudas y ahorros.
                </Text>
              </View>

              <Text style={styles.inputLabel}>Para confirmar, escribe tu contraseña:</Text>
              <TextInput
                style={styles.input}
                secureTextEntry
                value={delPw1}
                onChangeText={setDelPw1}
                placeholder="Tu contraseña"
                placeholderTextColor={COLORS.textMuted}
              />

              <Text style={[styles.inputLabel, { marginTop: SPACING.lg }]}>Escríbela de nuevo:</Text>
              <TextInput
                style={styles.input}
                secureTextEntry
                value={delPw2}
                onChangeText={setDelPw2}
                placeholder="Confirma tu contraseña"
                placeholderTextColor={COLORS.textMuted}
              />

              <TouchableOpacity
                style={[styles.deleteBtn, loading && styles.btnDisabled]}
                onPress={handleDeleteAccount}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.saveBtnTxt}>Eliminar cuenta definitivamente</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xl,
    paddingTop: SPACING.md,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.cardBg, alignItems: 'center', justifyContent: 'center',
    marginRight: SPACING.md, borderWidth: 1, borderColor: COLORS.cardBorder,
  },
  headerTitle: { fontSize: FONTS.xl, fontWeight: '800', color: COLORS.textPrimary },

  infoCard: {
    backgroundColor: COLORS.cardBg, borderRadius: RADIUS.xl,
    padding: SPACING.xl, alignItems: 'center', marginBottom: SPACING.xxl,
    borderWidth: 1, borderColor: COLORS.cardBorder,
  },
  avatarLarge: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  avatarLargeTxt: { fontSize: 32, fontWeight: '800', color: COLORS.white },
  userName:  { fontSize: FONTS.xl, fontWeight: '700', color: COLORS.textPrimary },
  userEmail: { fontSize: FONTS.base, color: COLORS.textMuted, marginTop: 4 },
  badge: {
    backgroundColor: COLORS.primaryAlpha12, borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md, paddingVertical: 4, marginTop: SPACING.md,
  },
  badgeTxt: { fontSize: FONTS.xs, fontWeight: '700', color: COLORS.primary, textTransform: 'uppercase' },

  sectionTitle: {
    fontSize: FONTS.sm, fontWeight: '700', color: COLORS.textMuted,
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: SPACING.sm, marginLeft: 4,
  },
  actionGroup: {
    backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.cardBorder, overflow: 'hidden',
  },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', padding: SPACING.lg,
    borderBottomWidth: 1, borderBottomColor: COLORS.cardBorder,
  },
  actionBtnLast: { borderBottomWidth: 0 },
  actionIcon:    { marginRight: SPACING.md },
  actionLabel:   { flex: 1, fontSize: FONTS.base, color: COLORS.textPrimary },
  actionLabelDanger: { color: COLORS.danger },

  // Modals
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.background, borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl, padding: SPACING.xl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  modalTitle: { fontSize: FONTS.lg, fontWeight: '800', color: COLORS.textPrimary },
  modalBody:  { marginBottom: SPACING.xxl },

  inputLabel: { fontSize: FONTS.sm, fontWeight: '600', color: COLORS.textPrimary, marginBottom: SPACING.xs },
  input: {
    backgroundColor: COLORS.cardBg, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.cardBorder,
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
    fontSize: FONTS.base, color: COLORS.textPrimary,
  },

  saveBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.lg,
    paddingVertical: SPACING.lg, alignItems: 'center', marginTop: SPACING.xxl,
  },
  deleteBtn: {
    backgroundColor: COLORS.danger, borderRadius: RADIUS.lg,
    paddingVertical: SPACING.lg, alignItems: 'center', marginTop: SPACING.xxl,
  },
  btnDisabled: { opacity: 0.5 },
  saveBtnTxt:  { color: COLORS.white, fontWeight: '700', fontSize: FONTS.base },

  warningBox: {
    flexDirection: 'row', backgroundColor: 'rgba(239,68,68,0.1)',
    borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.xl,
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)', gap: SPACING.md,
    alignItems: 'center',
  },
  warningTxt: { flex: 1, fontSize: FONTS.sm, color: COLORS.danger, lineHeight: 20 },
});
