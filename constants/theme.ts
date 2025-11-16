/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const brandNavy = '#1B2D7A';
const brandRed = '#E3312D';
const brandGreen = '#137A3C';
const brandYellow = '#F7B733';
const neutralDark = '#0F1115';
const neutralLight = '#F7F7F7';

export const Colors = {
  light: {
    text: neutralDark,
    background: neutralLight,
    card: '#FFFFFF',
    border: '#E5E7EB',
    tint: brandNavy,
    accentRed: brandRed,
    accentGreen: brandGreen,
    accentYellow: brandYellow,
    icon: '#5F6570',
    tabIconDefault: '#94A3B8',
    tabIconSelected: brandNavy,
  },
  dark: {
    text: '#F3F4F6',
    background: '#070B17',
    card: '#0F172A',
    border: '#1F2937',
    tint: brandYellow,
    accentRed: brandRed,
    accentGreen: brandGreen,
    accentYellow: brandYellow,
    icon: '#CBD5F5',
    tabIconDefault: '#475569',
    tabIconSelected: brandYellow,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'Montserrat_600SemiBold',
    body: 'SourceSansPro_400Regular',
    rounded: 'SFProRounded-Semibold',
    mono: 'SFMono-Regular',
  },
  default: {
    sans: 'Montserrat_600SemiBold',
    body: 'SourceSansPro_400Regular',
    rounded: 'system-ui',
    mono: 'monospace',
  },
  web: {
    sans: "'Montserrat', 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Arial, sans-serif",
    body: "'Source Sans Pro', 'Segoe UI', system-ui, sans-serif",
    rounded: "'Nunito', 'SF Pro Rounded', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
