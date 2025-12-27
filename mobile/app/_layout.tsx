import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/authStore';
import { colors } from '@/constants/colors';

// Keep splash screen visible while we check auth
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { isLoading, checkAuth } = useAuthStore();

  useEffect(() => {
    // Check for existing auth on app start
    const initAuth = async () => {
      await checkAuth();
      await SplashScreen.hideAsync();
    };
    initAuth();
  }, []);

  if (isLoading) {
    // Still checking auth, splash screen is visible
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background.light },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(main)" options={{ headerShown: false }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
