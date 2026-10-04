import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { Brand, Type } from '@/constants/theme';
import { Product, formatPrice } from '@/src/constants/catalog';

export const Eyebrow = ({ children, color = Brand.smoke }: { children: ReactNode; color?: string }) => (
  <Text style={[s.eyebrow, { color }]}>{children}</Text>
);

export const Display = ({ children, size = 44, color = Brand.ink, style }: { children: ReactNode; size?: number; color?: string; style?: object }) => (
  <Text style={[s.display, { fontSize: size, lineHeight: size * 0.98, color }, style]}>{children}</Text>
);

export const Button = ({ label, onPress, variant = 'dark', style }: { label: string; onPress?: () => void; variant?: 'dark' | 'light' | 'gold' | 'outline'; style?: ViewStyle }) => {
  const v = {
    dark: { bg: Brand.ink, fg: Brand.bone, border: Brand.ink },
    light: { bg: Brand.bone, fg: Brand.ink, border: Brand.bone },
    gold: { bg: Brand.gold, fg: Brand.ink, border: Brand.gold },
    outline: { bg: 'transparent', fg: Brand.ink, border: Brand.ink },
  }[variant];
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [s.btn, { backgroundColor: v.bg, borderColor: v.border, opacity: pressed ? 0.85 : 1 }, style]}>
      <Text style={[s.btnText, { color: v.fg }]}>{label}</Text>
    </Pressable>
  );
};

export const Chip = ({ label, active, onPress }: { label: string; active?: boolean; onPress?: () => void }) => (
  <Pressable accessibilityRole="button" accessibilityState={{ selected: !!active }} onPress={onPress} style={[s.chip, active && { backgroundColor: Brand.ink }]}>
    <Text style={[s.chipText, active && { color: Brand.bone }]}>{label}</Text>
  </Pressable>
);

export const FlagStripe = () => (
  <View style={{ flexDirection: 'row', height: 5 }}>
    {[Brand.green, Brand.gold, Brand.ink, Brand.red, Brand.blue, Brand.bone].map((c) => (
      <View key={c} style={{ flex: 1, backgroundColor: c }} />
    ))}
  </View>
);

export const ProductCard = ({ p, currency, width }: { p: Product; currency: 'ZAR' | 'EUR'; width?: number }) => (
  <Link href={{ pathname: '/product/[id]', params: { id: p.id } }} asChild>
    <Pressable style={{ width, gap: 8 }} accessibilityRole="link" accessibilityLabel={p.title}>
      <View style={s.tile}>
        <Image source={p.image} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
        {p.badge ? <Text style={s.badge}>{p.badge}</Text> : null}
      </View>
      <Text style={s.cardMeta} numberOfLines={1}>{p.collection} · {p.category}</Text>
      <Text style={s.cardTitle} numberOfLines={2}>{p.title}</Text>
      <Text style={s.cardPrice}>{formatPrice(p, currency)}</Text>
    </Pressable>
  </Link>
);

const s = StyleSheet.create({
  eyebrow: { fontFamily: Type.mono, fontSize: 11, letterSpacing: 1.6, textTransform: 'uppercase' },
  display: { fontFamily: Type.display, textTransform: 'uppercase' },
  btn: { minHeight: 52, paddingHorizontal: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  btnText: { fontFamily: Type.monoBold, fontSize: 13, letterSpacing: 1.6, textTransform: 'uppercase' },
  chip: { minHeight: 40, paddingHorizontal: 14, justifyContent: 'center', borderWidth: 1, borderColor: Brand.ink },
  chipText: { fontFamily: Type.monoBold, fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', color: Brand.ink },
  tile: { aspectRatio: 4 / 5, backgroundColor: Brand.tile, overflow: 'hidden' },
  badge: { position: 'absolute', top: 10, left: 10, backgroundColor: Brand.ink, color: Brand.bone, paddingHorizontal: 8, paddingVertical: 4, fontFamily: Type.mono, fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase' },
  cardMeta: { fontFamily: Type.mono, fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', color: Brand.smoke },
  cardTitle: { fontFamily: Type.display, fontSize: 18, lineHeight: 20, textTransform: 'uppercase', color: Brand.ink },
  cardPrice: { fontFamily: Type.monoBold, fontSize: 13, color: Brand.ink },
});
