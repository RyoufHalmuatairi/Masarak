import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0D1B16' },
        }}
      />
    </SafeAreaProvider>
  );
}