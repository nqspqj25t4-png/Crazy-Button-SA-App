import Feather from '@expo/vector-icons/Feather';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand, Type } from '@/constants/theme';
import { CATALOG, findProduct, formatPrice, Product } from '@/src/constants/catalog';
import { useBag } from '@/src/context/BagContext';
import { Button, Display, Eyebrow, ProductCard } from '@/src/components/ui';
import { getRemote } from '@/src/lib/remoteProducts';

export default function ProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const { add, currency } = useBag();
  const p: Product | undefined = findProduct(String(id)) ?? getRemote(String(id));
  const [size, setSize] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const wide = width >= 900;
  const pad = wide ? 40 : 20;

  if (!p) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Brand.bone, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
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
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={{ flexDirection: wide ? 'row' : 'column', maxWidth: 1360, width: '100%', alignSelf: 'center' }}>
          <View style={{ flex: 1, aspectRatio: 4 / 5, backgroundColor: Brand.studio }}>
            <Image source={p.image} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
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
                  <Pressable key={s} onPress={() => { setSize(s); setAdded(false); }} accessibilityRole="radio" accessibilityState={{ checked: chosen === s }} style={[styles.size, chosen === s && { backgroundColor: Brand.ink }]}>
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
  back: { position: 'absolute', top: 14, left: 14, width: 44, height: 44, borderRadius: 22, backgroundColor: Brand.bone, alignItems: 'center', justifyContent: 'center' },
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
