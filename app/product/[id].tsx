import Feather from '@expo/vector-icons/Feather';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import Head from 'expo-router/head';
import { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand, Type } from '@/constants/theme';
import { CATALOG, findProduct, formatPrice, Product } from '@/src/constants/catalog';
import { useBag } from '@/src/context/BagContext';
import { Button, Display, Eyebrow, ProductCard } from '@/src/components/ui';
import { getRemote } from '@/src/lib/remoteProducts';
import { trackItems } from '@/src/lib/track';

export default function ProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const { add, currency } = useBag();
  const p: Product | undefined = findProduct(String(id)) ?? getRemote(String(id));
  const [size, setSize] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const wide = width >= 900;
  const pad = wide ? 40 : 20;
  const swing = useRef(new Animated.Value(1)).current;
  const sway = (from: number) => {
    swing.setValue(from);
    Animated.spring(swing, { toValue: 0, friction: 2.6, tension: 30, useNativeDriver: Platform.OS !== 'web' }).start();
  };
  const tilt = swing.interpolate({ inputRange: [-1, 1], outputRange: ['-14deg', '14deg'] });
  const hang = swing.interpolate({ inputRange: [-1, 1], outputRange: ['-2deg', '2deg'] });

  useEffect(() => { sway(1); }, [p?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (p) trackItems('view_item', currency, [{ p }]); }, [p?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!p) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Brand.bone, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <Head><title>Product not found — Crazy Button SA</title></Head>
        <Display size={32}>Product not found</Display>
        <Button label="Back to shop" onPress={() => router.replace('/catalog')} />
      </SafeAreaView>
    );
  }

  const sizes = p.sizes ?? ['One size'];
  const chosen = size ?? (sizes.length === 1 ? sizes[0] : null);
  const related = CATALOG.filter((x) => x.id !== p.id && (x.collection === p.collection || x.category === p.category)).slice(0, 4);
  const relW = (Math.min(width, 1360) - pad * 2 - 14 * (wide ? 3 : 1)) / (wide ? 4 : 2);

  const onAdd = () => {
    if (!chosen) return;
    add(p.id, chosen);
    setAdded(true);
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: Brand.bone }}>
      <Head>
        <title>{`${p.title} — Crazy Button SA`}</title>
        <meta name="description" content={p.description} />
      </Head>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={{ flexDirection: wide ? 'row' : 'column', maxWidth: 1360, width: '100%', alignSelf: 'center' }}>
          <View style={{ flex: 1, aspectRatio: 4 / 5, backgroundColor: Brand.studio }}>
            <Animated.View style={[StyleSheet.absoluteFill, { transformOrigin: '50% 4%', transform: [{ rotate: hang }] }]}>
              <Image source={p.image} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
              <View style={styles.stem} />
              <View style={styles.hook} />
            </Animated.View>
            <View style={styles.rail} />
            <Animated.View style={[styles.tagWrap, { transformOrigin: '50% 0%', transform: [{ rotate: tilt }] }]} accessibilityLabel={`Price ${formatPrice(p, currency)}`}>
              <View style={styles.string} />
              <View style={styles.hangTag}>
                <View style={styles.hole} />
                <Text style={styles.tagPrice}>{formatPrice(p, currency)}</Text>
                <Text style={styles.tagSize}>{chosen ?? sizes.join(' · ')}</Text>
              </View>
            </Animated.View>
            <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/catalog'))} style={styles.back} accessibilityRole="button" accessibilityLabel="Back">
              <Feather name="arrow-left" size={20} color={Brand.ink} />
            </Pressable>
          </View>
          <View style={{ flex: 1, padding: pad, gap: 18 }}>
            <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
              {p.badge ? <Text style={[styles.tag, { backgroundColor: Brand.ink, color: Brand.bone }]}>{p.badge}</Text> : null}
              <Text style={[styles.tag, { backgroundColor: Brand.gold }]}>{p.collection}</Text>
              <Text style={[styles.tag, { borderWidth: 1, borderColor: Brand.ink }]}>{p.category}</Text>
            </View>
            <Display size={wide ? 64 : 40}>{p.title}</Display>
            <Text style={styles.price}>{formatPrice(p, currency)}</Text>
            <Text style={styles.body}>{p.description}</Text>

            <View style={{ gap: 10 }}>
              <Eyebrow color={Brand.ink}>Size{chosen ? `: ${chosen}` : ''}</Eyebrow>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {sizes.map((s) => (
                  <Pressable key={s} onPress={() => { setSize(s); setAdded(false); sway(-0.7); }} accessibilityRole="radio" accessibilityState={{ checked: chosen === s }} style={[styles.size, chosen === s && { backgroundColor: Brand.ink }]}>
                    <Text style={[styles.sizeText, chosen === s && { color: Brand.bone }]}>{s}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <Button label={added ? 'In the bag ✓' : chosen ? 'Add to bag' : 'Pick a size'} onPress={onAdd} variant={added ? 'gold' : 'dark'} />
            {added ? <Button label="View bag" variant="outline" onPress={() => router.push('/bag')} /> : null}

            <View style={styles.specs}>
              {[['Materials', 'Premium cotton & trims — final spec on request'], ['Delivery', 'South Africa & Europe'], ['Returns', '14-day returns on unworn items']].map(([k, v]) => (
                <View key={k} style={styles.specRow}><Text style={styles.specKey}>{k}</Text><Text style={styles.specVal}>{v}</Text></View>
              ))}
            </View>
          </View>
        </View>

        {related.length ? (
          <View style={{ padding: pad, gap: 16, maxWidth: 1360, width: '100%', alignSelf: 'center' }}>
            <Display size={wide ? 44 : 30}>Complete the fit</Display>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>{related.map((r) => <ProductCard key={r.id} p={r} currency={currency} width={relW} />)}</View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  rail: { position: 'absolute', top: 22, left: 0, right: 0, height: 12, borderRadius: 6, backgroundColor: '#C9A25A', borderTopWidth: 3, borderTopColor: '#F1DDA8', borderBottomWidth: 2, borderBottomColor: '#7E5A22', boxShadow: '0 5px 6px -2px rgba(18,18,18,.25)' },
  hook: { position: 'absolute', top: 15, left: '50%', marginLeft: -12, width: 24, height: 24, borderRadius: 12, borderWidth: 3, borderColor: '#2F2C2A', borderBottomColor: 'transparent', borderRightColor: 'transparent', transform: [{ rotate: '45deg' }] },
  stem: { position: 'absolute', top: 27, left: '50%', marginLeft: -1.5, width: 3, height: 44, backgroundColor: '#2F2C2A' },
  tagWrap: { position: 'absolute', top: 30, right: '5%', alignItems: 'center' },
  string: { width: 1.5, height: 46, backgroundColor: '#6E4F28' },
  hangTag: { minWidth: 96, paddingTop: 20, paddingBottom: 12, paddingHorizontal: 14, backgroundColor: Brand.bone, borderWidth: 1, borderColor: 'rgba(18,18,18,.18)', borderRadius: 4, alignItems: 'center', gap: 2, boxShadow: '0 8px 14px -6px rgba(18,18,18,.35)' },
  hole: { position: 'absolute', top: 7, width: 7, height: 7, borderRadius: 4, backgroundColor: '#C9A25A' },
  tagPrice: { fontFamily: Type.display, fontSize: 22, color: Brand.ink },
  tagSize: { fontFamily: Type.bodyBold ?? Type.body, fontSize: 12, color: Brand.smoke },
  back: { position: 'absolute', top: 48, left: 14, width: 44, height: 44, borderRadius: 22, backgroundColor: Brand.bone, alignItems: 'center', justifyContent: 'center' },
  tag: { paddingHorizontal: 8, paddingVertical: 4, fontFamily: Type.mono, fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', color: Brand.ink, overflow: 'hidden' },
  price: { fontFamily: Type.monoBold, fontSize: 20, color: Brand.ink },
  body: { fontFamily: Type.body, fontSize: 17, lineHeight: 26, color: Brand.ink },
  size: { minWidth: 54, minHeight: 46, paddingHorizontal: 12, borderWidth: 1, borderColor: Brand.ink, alignItems: 'center', justifyContent: 'center' },
  sizeText: { fontFamily: Type.monoBold, fontSize: 13, color: Brand.ink },
  specs: { borderTopWidth: 1, borderColor: Brand.ink, paddingTop: 14, gap: 10 },
  specRow: { flexDirection: 'row', gap: 12 },
  specKey: { width: 92, fontFamily: Type.monoBold, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: Brand.ink, paddingTop: 2 },
  specVal: { flex: 1, fontFamily: Type.body, fontSize: 15, color: Brand.smoke },
});
