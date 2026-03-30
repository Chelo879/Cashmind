import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, FONTS, SPACING } from '../constants/theme';

/**
 * SectionHeader
 * @param {string}    title       section title
 * @param {string}    actionLabel label for the right action (optional)
 * @param {function}  onAction    callback for right action
 */
export default function SectionHeader({ title, actionLabel, onAction }) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {actionLabel && (
        <TouchableOpacity onPress={onAction} activeOpacity={0.7}>
          <Text style={styles.action}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  title: { fontSize: FONTS.lg, fontWeight: '700', color: COLORS.textPrimary },
  action: { fontSize: FONTS.base, color: COLORS.primary, fontWeight: '600' },
});
