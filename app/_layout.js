/**
 * app/_layout.js
 * Raíz del Stack de navegación. Declara todas las rutas de la app.
 */
import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useAuth } from '../utils/authStore';

// Evitar que el splash screen se oculte automáticamente
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { isLoggedIn, loading, firstRunDone } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Verificamos si el navegador de root ya está disponible
    if (navigationState?.key) {
      setIsReady(true);
    }
  }, [navigationState?.key]);

  useEffect(() => {
    if (loading || !isReady) return;

    const isLoginOrSignup = segments[0] === 'login' || segments[0] === 'signup';
    const allowedWithoutAuth = isLoginOrSignup || segments[0] === 'onboarding';

    if (!isLoggedIn && !allowedWithoutAuth) {
      // Si no está logueado y no está en una página permitida, al login
      router.replace('/login');
    } else if (isLoggedIn && isLoginOrSignup) {
      // Si está logueado pero intenta ir a login/signup explícitamente, al home
      if (!firstRunDone) {
        router.replace('/firstrun');
      } else {
        router.replace('/(tabs)');
      }
    }

    // Una vez que determinamos la ruta inicial, ocultamos el splash screen
    setTimeout(() => {
      SplashScreen.hideAsync();
    }, 100);

  }, [isLoggedIn, loading, segments, firstRunDone, isReady]);

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
