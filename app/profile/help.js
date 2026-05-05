import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import ScreenWrapper from '../../components/ScreenWrapper';
import { COLORS, FONTS, RADIUS, SPACING } from '../../constants/theme';

export default function HelpScreen() {
  const router = useRouter();

  const handleEmail = () => {
    Linking.openURL('mailto:soporte@cashmind.app?subject=Soporte%20Tecnico%20-%20Consulta&body=Hola%20equipo%20de%20Cashmind,');
  };

  const handleCall = () => {
    Linking.openURL('tel:+18002274646');
  };

  return (
    <ScreenWrapper scrollable={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Centro de Ayuda</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.illustrationWrap}>
          <View style={styles.iconCircle}>
            <Ionicons name="headset-outline" size={40} color={COLORS.primary} />
          </View>
          <Text style={styles.title}>¿Cómo podemos ayudarte?</Text>
          <Text style={styles.subtitle}>Nuestro equipo está disponible para resolver tus dudas sobre el optimizador Simplex o cualquier problema técnico.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Información de Contacto</Text>
          
          <TouchableOpacity style={styles.contactRow} onPress={handleEmail}>
            <View style={[styles.contactIcon, { backgroundColor: COLORS.primary + '15' }]}>
              <Ionicons name="mail-outline" size={20} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.contactLabel}>Correo Electrónico</Text>
              <Text style={styles.contactValue}>soporte@cashmind.app</Text>
            </View>
            <Ionicons name="external-link-outline" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactRow} onPress={handleCall}>
            <View style={[styles.contactIcon, { backgroundColor: '#10B98115' }]}>
              <Ionicons name="call-outline" size={20} color="#10B981" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.contactLabel}>Línea de Atención</Text>
              <Text style={styles.contactValue}>+1 (800) CASH-MIND</Text>
            </View>
            <Ionicons name="external-link-outline" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={styles.instructions}>
          <Text style={styles.instrTitle}>Guía para tu reporte</Text>
          <Text style={styles.instrText}>
            Para ayudarte más rápido, por favor asegúrate de que tu correo incluya:
          </Text>
          
          <View style={styles.bulletRow}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>
              <Text style={{ fontWeight: '700', color: COLORS.textPrimary }}>Asunto:</Text> "Soporte Técnico - [Tu nombre]"
            </Text>
          </View>
          
          <View style={styles.bulletRow}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>
              <Text style={{ fontWeight: '700', color: COLORS.textPrimary }}>Contenido:</Text> Describe el error o duda y, si es posible, adjunta una captura de pantalla.
            </Text>
          </View>

          <View style={styles.infoBox}>
            <Ionicons name="time-outline" size={16} color={COLORS.textMuted} style={{ marginRight: 8 }} />
            <Text style={styles.infoBoxText}>Tiempo promedio de respuesta: 24 horas hábiles.</Text>
          </View>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  headerTitle: {
    fontSize: FONTS.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  content: {
    padding: SPACING.xl,
    paddingBottom: 40,
  },
  illustrationWrap: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONTS.xl,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: FONTS.base,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: SPACING.md,
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: SPACING.xl,
  },
  cardTitle: {
    fontSize: FONTS.base,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactLabel: {
    fontSize: FONTS.xs,
    color: COLORS.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  contactValue: {
    fontSize: FONTS.base,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  instructions: {
    paddingHorizontal: SPACING.xs,
  },
  instrTitle: {
    fontSize: FONTS.base,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  instrText: {
    fontSize: FONTS.sm,
    color: COLORS.textMuted,
    marginBottom: SPACING.md,
    lineHeight: 20,
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
    paddingRight: SPACING.md,
  },
  bullet: {
    fontSize: 16,
    color: COLORS.primary,
    marginRight: 8,
    marginTop: -2,
  },
  bulletText: {
    fontSize: FONTS.sm,
    color: COLORS.textMuted,
    lineHeight: 20,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    marginTop: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  infoBoxText: {
    fontSize: FONTS.xs,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
});
