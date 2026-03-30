/**
 * utils/keyboard.js
 * Hook reutilizable para detectar la altura del teclado en iOS y Android.
 * Usado en los modales de pago y depósito.
 */
import { useState, useEffect } from 'react';
import { Keyboard, Platform, TouchableOpacity, Text, View } from 'react-native';
import { COLORS } from '../constants/theme';

export function useKeyboardHeight() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => setKeyboardHeight(e.endCoordinates.height)
    );
    const hide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0)
    );
    return () => { show.remove(); hide.remove(); };
  }, []);

  return keyboardHeight;
}

/** Barra "Listo" que aparece sobre el teclado en iOS para cerrarlo */
export function ListoBar({ visible }) {
  if (Platform.OS !== 'ios' || !visible) return null;
  return (
    <View style={{
      flexDirection: 'row', justifyContent: 'flex-end',
      paddingHorizontal: 16, paddingVertical: 10,
      borderTopWidth: 1, borderTopColor: 'rgba(99,102,241,0.25)',
    }}>
      <TouchableOpacity
        onPress={() => Keyboard.dismiss()}
        style={{
          backgroundColor: COLORS.primary,
          paddingHorizontal: 24, paddingVertical: 8, borderRadius: 20,
        }}
      >
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Listo</Text>
      </TouchableOpacity>
    </View>
  );
}
