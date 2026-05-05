import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, StatusBar, Platform, View } from 'react-native';
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
    Platform.OS === 'android' && { paddingTop: StatusBar.currentHeight + SPACING.lg },
    style
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="transparent" 
        translucent={true} 
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
        <View style={contentStyle}>
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
