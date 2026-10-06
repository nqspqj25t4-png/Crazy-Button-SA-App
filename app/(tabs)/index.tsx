import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Linking, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand, Type } from '@/constants/theme';
import { CATALOG, CATEGORIES, COLLECTIONS, TAGLINES } from '@/src/constants/catalog';
import { useBag } from '@/src/context/BagContext';
import { Button, Display, Eyebrow, FlagStripe, ProductCard } from '@/src/components/ui';
import { ShopTheLook } from '@/src/components/ShopTheLook';

const LOGO = require('@/assets/images/crazy-button-logo.png');

function Marquee() {
  const x = useRef(new Animated.Value(0)).current;
  const text = [...TAGLINES, ...TAGLINES].join('   ●   ');
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(x, { toValue: -1400, duration: 26000, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [x]);
  return (
    <View style={styles.marquee} accessible accessibilityLabel={TAGLINES.join('. ')}>
      <Animated.Text numberOfLines={1} style={[styles.marqueeText, { transform: [{ translateX: x }] }]}>{text}   ●   {text}</Animated.Text>
    </View>
  );
}

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const { currency } = useBag();
  const wide = width >= 900;
  const pad = wide ? 40 : 20;
  const cols = width >= 1100 ? 4 : width >= 700 ? 3 : 2;
  const cardW = (Math.min(width, 1360) - pad * 2 - 14 * (cols - 1)) / cols;
  const fresh = ['craziest-threads-varsity', 'kwa-mashu-bomber', 'umlazi-ailwo-knit', 'spaza-bucket'].map((id) => CATALOG.find((p) => p.id === id)!);
  const patches = CATALOG.filter((p) => p.category === 'Patches' && !p.id.startsWith('patch-pack'));
  const catImage = (c: string) => CATALOG.find((p) => p.category === c)!.image;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: Brand.ink }}>
      <ScrollView style={{ backgroundColor: Brand.bone }} contentContainerStyle={{ paddingBottom: 48 }}>
        {/* Top bar */}
        <View style={[styles.topbar, { paddingHorizontal: pad }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Image source={LOGO} style={{ width: 40, height: 38 }} contentFit="contain" />
            <Text style={styles.wordmark}>Crazy Button <Text style={{ color: Brand.red }}>SA</Text></Text>
          </View>
          <Text style={styles.drop}>NO RE-UP · DROP LIVE</Text>
        </View>

        {/* Hero */}
        <View style={[styles.hero, { flexDirection: wide ? 'row' : 'column' }]}>
          <View style={{ flex: 1, padding: pad, paddingVertical: wide ? 64 : 32, gap: 18, justifyContent: 'center' }}>
            <Eyebrow color={Brand.vapour}>Est. 2011 · Designed in Mzansi</Eyebrow>
            <Display size={wide ? 112 : 64} color={Brand.bone}>Wear loud.{'\n'}<Text style={{ color: Brand.gold }}>Walk proud.</Text></Display>
            <Text style={styles.heroBody}>Mzansi’s loudest streetwear. Bold threads for the brave — straight from Kwa Mashu and Umlazi, rocked worldwide.</Text>
            <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
              <Button label="Cop the drop" variant="light" onPress={() => router.push('/catalog')} />
              <Button label="Hero piece" variant="gold" onPress={() => router.push({ pathname: '/product/[id]', params: { id: 'umlazi-unit-hoodie' } })} />
            </View>
          </View>
          <Pressable onPress={() => router.push({ pathname: '/product/[id]', params: { id: 'umlazi-unit-hoodie' } })} style={wide ? { flex: 1, minHeight: 660, backgroundColor: Brand.studio } : { width: '100%', aspectRatio: 4 / 5, backgroundColor: Brand.studio }} accessibilityRole="link" accessibilityLabel="Umlazi Unit Hoodie">
            <Image source={CATALOG[0].image} style={StyleSheet.absoluteFill} contentFit="cover" />
            <View style={styles.heroTag}>
              <Eyebrow>Hero piece</Eyebrow>
              <Display size={24}>Umlazi Unit Hoodie</Display>
            </View>
          </Pressable>
        </View>
        <FlagStripe />
        <Marquee />

        {/* Fresh off the needle */}
        <View style={{ padding: pad, paddingTop: 40, gap: 18, maxWidth: 1360, width: '100%', alignSelf: 'center' }}>
          <View style={styles.rowBetween}>
            <View><Eyebrow>01 — New arrivals</Eyebrow><Display size={wide ? 56 : 38}>Fresh off the needle</Display></View>
            <Pressable onPress={() => router.push('/catalog')}><Text style={styles.link}>View all →</Text></Pressable>
          </View>
          <View style={styles.grid}>{fresh.map((p) => <ProductCard key={p.id} p={p} currency={currency} width={cardW} />)}</View>
        </View>

        {/* Categories */}
        <View style={{ paddingHorizontal: pad, paddingTop: 24, gap: 16, maxWidth: 1360, width: '100%', alignSelf: 'center' }}>
          <Eyebrow>02 — Shop by category</Eyebrow>
          <Display size={wide ? 56 : 38}>Find your fit</Display>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
            {CATEGORIES.map((c) => (
              <Pressable key={c} onPress={() => router.push({ pathname: '/catalog', params: { category: c } })} style={styles.catTile} accessibilityRole="link">
                <Image source={catImage(c)} style={StyleSheet.absoluteFill} contentFit="cover" />
                <View style={styles.catLabel}><Display size={22} color={Brand.bone}>{c}</Display></View>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Collections */}
        <View style={{ padding: pad, paddingTop: 40, gap: 16, maxWidth: 1360, width: '100%', alignSelf: 'center' }}>
          <Eyebrow>03 — The collections</Eyebrow>
          <Display size={wide ? 56 : 38}>Named after the streets</Display>
          <View style={styles.collections}>
            {COLLECTIONS.map((c) => (
              <View key={c.name} style={[styles.collection, { width: wide ? '32.8%' : '49.6%' }]}>
                <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: c.color }} />
                <Display size={24}>{c.name}</Display>
                <Text style={styles.small}>{c.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Shop the look */}
        <ShopTheLook wide={wide} pad={pad} />

        {/* Patches */}
        <View style={{ padding: pad, paddingTop: 40, gap: 16, maxWidth: 1360, width: '100%', alignSelf: 'center' }}>
          <Eyebrow color={Brand.red}>05 — Limited release</Eyebrow>
          <Display size={wide ? 56 : 38}>Patch Drop Vol. 1</Display>
          <View style={styles.grid}>
            {patches.map((p) => (
              <Pressable key={p.id} onPress={() => router.push({ pathname: '/product/[id]', params: { id: p.id } })} style={{ width: (Math.min(width, 1360) - pad * 2 - 14 * (cols + 1)) / (cols + 2), aspectRatio: 1, backgroundColor: Brand.tile }} accessibilityRole="link" accessibilityLabel={p.title}>
                <Image source={p.image} style={StyleSheet.absoluteFill} contentFit="cover" />
              </Pressable>
            ))}
          </View>
          <Button label="Cop the full pack" variant="gold" onPress={() => router.push({ pathname: '/product/[id]', params: { id: 'patch-pack-vol-1' } })} style={{ alignSelf: 'flex-start' }} />
        </View>

        {/* Newsletter / footer */}
        <View style={{ backgroundColor: Brand.green, padding: pad, paddingVertical: 36, gap: 12 }}>
          <Display size={wide ? 48 : 34} color={Brand.bone}>You’re on the list.{'\n'}Don’t brick it.</Display>
          <Text style={[styles.heroBody, { color: '#D7E6DC' }]}>Early cop access, drop alerts and the No Haters Club.</Text>
        </View>
        <View style={{ backgroundColor: Brand.ink, padding: pad, gap: 10 }}>
          <Pressable onPress={() => Linking.openURL('https://www.instagram.com/crazybuttonsa/')}><Text style={[styles.link, { color: Brand.bone }]}>@crazybuttonsa</Text></Pressable>
          <Text style={[styles.small, { color: Brand.washed }]}>© Crazy Button SA · Est. 2011 · Mzansi made, globally played</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  topbar: { backgroundColor: Brand.bone, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: Brand.ink },
  wordmark: { fontFamily: Type.display, fontSize: 22, textTransform: 'uppercase', color: Brand.ink },
  drop: { fontFamily: Type.monoBold, fontSize: 10, letterSpacing: 1.2, color: Brand.red },
  hero: { backgroundColor: Brand.ink },
  heroBody: { fontFamily: Type.body, fontSize: 17, lineHeight: 26, color: Brand.concrete, maxWidth: 460 },
  heroTag: { position: 'absolute', left: 16, bottom: 16, backgroundColor: Brand.bone, paddingHorizontal: 14, paddingVertical: 10 },
  marquee: { backgroundColor: Brand.gold, paddingVertical: 12, overflow: 'hidden', borderBottomWidth: 1, borderColor: Brand.ink },
  marqueeText: { fontFamily: Type.display, fontSize: 24, textTransform: 'uppercase', color: Brand.ink, width: 4000 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12 },
  link: { fontFamily: Type.monoBold, fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase', color: Brand.ink },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  catTile: { width: 170, height: 220, backgroundColor: Brand.tile, overflow: 'hidden' },
  catLabel: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: Brand.ink, paddingHorizontal: 10, paddingVertical: 8 },
  collections: { flexDirection: 'row', flexWrap: 'wrap', gap: 2, backgroundColor: Brand.ink, borderWidth: 1, borderColor: Brand.ink },
  collection: { backgroundColor: Brand.bone, padding: 16, gap: 8, minHeight: 130 },
  small: { fontFamily: Type.body, fontSize: 14, lineHeight: 20, color: Brand.smoke },
});
