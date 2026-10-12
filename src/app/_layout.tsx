import { Stack } from 'expo-router';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { MasarakNav } from '../components/masarak-nav';
import { colors, ui } from '../constants/design';
import { AuthProvider, useAuth } from '../contexts/auth-context';

function AppScreens() {
  const auth = useAuth();
  if (!auth.ready) return <SafeAreaView style={[ui.screen, { alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 }]}>
    {auth.error ? <><Text style={ui.text}>{auth.error}</Text><Pressable accessibilityRole="button" onPress={auth.reload} style={ui.button}><Text style={ui.buttonText}>إعادة المحاولة</Text></Pressable></> : <><ActivityIndicator color={colors.primary} /><Text style={ui.text}>جارٍ فتح مسارك…</Text></>}
  </SafeAreaView>;
  return <View key={auth.session?.user.id ?? 'guest'} style={{ flex: 1 }}>
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />
    <MasarakNav />
  </View>;
}
export default function RootLayout() {
  useEffect(() => { SplashScreen.hideAsync().catch(() => {}); }, []);
  return <SafeAreaProvider><AuthProvider><StatusBar style="dark" /><AppScreens /></AuthProvider></SafeAreaProvider>;
}
