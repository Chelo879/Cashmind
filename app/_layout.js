/**
 * app/_layout.js
 * Raíz del Stack de navegación. Declara todas las rutas de la app.
 */
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="firstrun" />
    </Stack>
  );
}
