import React from 'react';
import { ScrollView, StyleSheet, StatusBar, Platform, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING } from '../constants/theme';

/**
 * ScreenWrapper
 * Wraps every screen with SafeAreaView + optional ScrollView.
 * @param {boolean} scrollable  enable scroll (default true)
 * @param {object}  style       extra style for content container
 */
export default function ScreenWrapper({ children, scrollable = true, style }) {
  const contentStyle = [
    styles.content,
    style
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={COLORS.background} 
        translucent={false} 
      />
      {scrollable ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={contentStyle}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.scroll, contentStyle]}>
          {children}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.lg, paddingBottom: 40 },
});
