import { Anton_400Regular } from '@expo-google-fonts/anton';
import { SourceSans3_400Regular, SourceSans3_600SemiBold, SourceSans3_700Bold } from '@expo-google-fonts/source-sans-3';
import { SpaceMono_400Regular, SpaceMono_700Bold } from '@expo-google-fonts/space-mono';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';

import { Brand, Type } from '@/constants/theme';
import { AuthProvider } from '@/src/context/AuthContext';
import { BagProvider } from '@/src/context/BagContext';

export const unstable_settings = { anchor: '(tabs)' };

const theme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: Brand.bone, card: Brand.bone, text: Brand.ink, border: Brand.concrete, primary: Brand.red },
};

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Anton_400Regular,
    SpaceMono_400Regular,
    SpaceMono_700Bold,
    SourceSans3_400Regular,
    SourceSans3_600SemiBold,
    SourceSans3_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Brand.ink }}>
        <ActivityIndicator size="large" color={Brand.gold} />
      </View>
    );
  }

  return (
    <AuthProvider>
      <BagProvider>
        <ThemeProvider value={theme}>
          <Stack screenOptions={{ headerTitleStyle: { fontFamily: Type.display }, headerTintColor: Brand.ink, headerStyle: { backgroundColor: Brand.bone }, headerShadowVisible: false }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="product/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Crazy Button SA' }} />
          </Stack>
          <StatusBar style="dark" />
        </ThemeProvider>
      </BagProvider>
    </AuthProvider>
  );
}
