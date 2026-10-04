/**
 * Crazy Button SA — brand tokens (from the company style guide).
 * Base: off-black, bone, concrete. Accents: flag red, deep green, gold, vapour blue.
 */
import { Platform } from 'react-native';

export const Brand = {
  ink: '#121212',
  bone: '#EDE8DF',
  studio: '#E8E2D8',
  tile: '#E2DCD1',
  concrete: '#CFCAC1',
  washed: '#8C8A85',
  smoke: '#5E5B57',
  red: '#C8322B',
  green: '#0F5A36',
  gold: '#F2B33D',
  blue: '#1B2D7A',
  vapour: '#9FC3D9',
  white: '#FFFFFF',
};

export const Colors = {
  light: {
    text: Brand.ink,
    background: Brand.bone,
    card: Brand.tile,
    border: Brand.concrete,
    tint: Brand.ink,
    accentRed: Brand.red,
    accentGreen: Brand.green,
    accentYellow: Brand.gold,
    icon: Brand.smoke,
    tabIconDefault: Brand.washed,
    tabIconSelected: Brand.red,
  },
  dark: {
    text: Brand.bone,
    background: Brand.ink,
    card: '#1C1C1C',
    border: '#2E2C2A',
    tint: Brand.gold,
    accentRed: Brand.red,
    accentGreen: Brand.green,
    accentYellow: Brand.gold,
    icon: Brand.concrete,
    tabIconDefault: Brand.washed,
    tabIconSelected: Brand.gold,
  },
};

/** Display = condensed bold (Anton); Mono = captions/specs (Space Mono); Body = Source Sans 3. */
export const Type = {
  display: 'Anton_400Regular',
  mono: 'SpaceMono_400Regular',
  monoBold: 'SpaceMono_700Bold',
  body: 'SourceSans3_400Regular',
  bodySemi: 'SourceSans3_600SemiBold',
  bodyBold: 'SourceSans3_700Bold',
};

// Kept for older screens that still import Fonts.
export const Fonts = Platform.select({
  default: { sans: Type.display, body: Type.body, rounded: Type.bodySemi, mono: Type.mono },
  web: { sans: Type.display, body: Type.body, rounded: Type.bodySemi, mono: Type.mono },
})!;
