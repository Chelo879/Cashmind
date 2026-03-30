import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, StatusBar } from 'react-native';
import { COLORS, SPACING } from '../constants/theme';

/**
 * ScreenWrapper
 * Wraps every screen with SafeAreaView + optional ScrollView.
 * @param {boolean} scrollable  enable scroll (default true)
 * @param {object}  style       extra style for content container
 */
export default function ScreenWrapper({ children, scrollable = true, style }) {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      {scrollable ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, style]}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        children
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.lg, paddingBottom: 40 },
});
