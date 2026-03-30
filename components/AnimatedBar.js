import React, { useRef, useEffect } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { COLORS } from '../constants/theme';

/**
 * AnimatedBar
 * @param {number}  progress  0–1 fill fraction
 * @param {string}  color     fill color
 * @param {number}  height    bar height in px (default 6)
 * @param {number}  duration  animation duration ms (default 900)
 */
export default function AnimatedBar({
  progress = 0,
  color = COLORS.primary,
  height = 6,
  duration = 900,
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: Math.min(1, Math.max(0, progress)),
      duration,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  return (
    <View style={[styles.bg, { height, borderRadius: height }]}>
      <Animated.View
        style={[
          styles.fill,
          {
            height,
            borderRadius: height,
            backgroundColor: color,
            width: anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { backgroundColor: COLORS.whiteAlpha10, overflow: 'hidden' },
  fill: {},
});
