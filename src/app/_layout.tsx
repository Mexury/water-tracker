import {
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
  useFonts,
} from '@expo-google-fonts/nunito';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { StoreProvider } from '../lib/store';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold, Nunito_900Black });
  if (!fontsLoaded) return null;

  return (
    <StoreProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </StoreProvider>
  );
}
