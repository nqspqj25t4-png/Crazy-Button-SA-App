import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Brand, Type } from '@/constants/theme';
import { findProduct, formatPrice } from '@/src/constants/catalog';
import { useBag } from '@/src/context/BagContext';
import { Button, Display, Eyebrow } from '@/src/components/ui';

type Look = { no: string; name: string; collection: string; mood: string; image: number; items: string[] };

export const LOOKS: Look[] = [
  {
    no: '01', name: 'Kwa Mashu Nights', collection: 'Zulu Future',
    mood: 'Quilted flag sleeves, midnight track pants and the Umlazi skyline up top. Built for the long way home.',
    image: require('@/assets/images/looks/kwamashu-nights.jpg'),
    items: ['kwa-mashu-bomber', 'braam-nights-track-pants', 'umlazi-nights-bucket', 'patch-kwa-mashu'],
  },
  {
    no: '02', name: 'Weekend Hustle', collection: 'Spaza Drip',
    mood: 'Back print loud, the spaza on your head and the crest on your luggage. Out of town, never out of character.',
    image: require('@/assets/images/looks/weekend-hustle.jpg'),
    items: ['craziest-threads-tee', 'spaza-bucket', 'cbsa-drawstring', 'luggage-white', 'patch-flag-barcode'],
  },
  {
    no: '03', name: 'Thrift Flex', collection: 'Thrift Flex × Mama Said',
    mood: 'Grandpa knit over a gogo tee, Daylife bucket to finish. Mama said wear something warm.',
    image: require('@/assets/images/looks/thrift-flex.jpg'),
    items: ['yizwa-ke-manje-cardigan', 'mama-said-tee', 'kwa-mashu-daylife-bucket', 'patch-izinto-zothando'],
  },
  {
    no: '04', name: 'Craziest On The Block', collection: 'Core Range',
    mood: 'Varsity over the hero hoodie, gold bucket, black crest luggage. The full Crazy Button uniform.',
    image: require('@/assets/images/looks/craziest-block.jpg'),
    items: ['craziest-threads-varsity', 'umlazi-unit-hoodie', 'crazy-button-bucket', 'luggage-black'],
  },
];

export function ShopTheLook({ wide, pad }: { wide: boolean; pad: number }) {
  const [i, setI] = useState(0);
  const [added, setAdded] = useState<string | null>(null);
  const { add, currency } = useBag();
  const look = LOOKS[i];
  const items = look.items.map((id) => findProduct(id)!).filter(Boolean);

  const addAll = () => {
    items.forEach((p) => { const sz = p.sizes ?? ['One size']; add(p.id, sz.includes('M') ? 'M' : sz[0]); });
    setAdded(`${items.length} pieces from ${look.name} are in your bag`);
  };
  const pick = (n: number) => { setI(n); setAdded(null); };

  return (
    <View style={{ backgroundColor: Brand.ink, paddingHorizontal: pad, paddingVertical: wide ? 64 : 40 }}>
      <View style={{ maxWidth: 1360, width: '100%', alignSelf: 'center', gap: 24 }}>
        <View style={{ flexDirection: wide ? 'row' : 'column', justifyContent: 'space-between', alignItems: wide ? 'flex-end' : 'flex-start', gap: 16 }}>
          <View style={{ gap: 8 }}>
            <Eyebrow color={Brand.vapour}>04 — Shop the look</Eyebrow>
            <Display size={wide ? 64 : 40} color={Brand.bone}>Wear it like this</Display>
          </View>
          <View style={s.tabs} accessibilityRole="tablist">
            {LOOKS.map((l, n) => (
              <Pressable key={l.no} onPress={() => pick(n)} accessibilityRole="tab" accessibilityState={{ selected: n === i }} accessibilityLabel={l.name}
                style={[s.tab, n === i && { backgroundColor: Brand.gold, borderColor: Brand.gold }]}>
                <Text style={[s.tabNo, n === i && { color: Brand.ink }]}>{l.no}</Text>
                {wide ? <Text style={[s.tabName, n === i && { color: Brand.ink }]} numberOfLines={1}>{l.name}</Text> : null}
              </Pressable>
            ))}
          </View>
        </View>

        <View style={{ flexDirection: wide ? 'row' : 'column', gap: wide ? 40 : 20, alignItems: 'stretch' }}>
          <View style={[s.frame, wide ? { flex: 1.15 } : { width: '100%' }]}>
            <Image source={look.image} style={{ width: '100%', aspectRatio: 4 / 5 }} contentFit="cover" transition={250} accessibilityLabel={`${look.name} flat-lay: ${items.map((p) => p.title).join(', ')}`} />
            <View style={s.stamp}><Text style={s.stampText}>Look {look.no} / 04</Text></View>
          </View>

          <View style={[{ gap: 18 }, wide ? { flex: 1, justifyContent: 'center' } : null]}>
            <Eyebrow color={Brand.gold}>{look.collection}</Eyebrow>
            <Display size={wide ? 52 : 36} color={Brand.bone}>{look.name}</Display>
            <Text style={s.mood}>{look.mood}</Text>

            <View style={{ borderTopWidth: 1, borderColor: '#2E2C2A' }}>
              {items.map((p, n) => (
                <Pressable key={p.id} onPress={() => router.push({ pathname: '/product/[id]', params: { id: p.id } })} accessibilityRole="link" accessibilityLabel={`${p.title}, view product`}
                  style={({ pressed }) => [s.row, pressed && { backgroundColor: '#1C1C1C' }]}>
                  <Text style={s.rowNo}>{String(n + 1).padStart(2, '0')}</Text>
                  <View style={s.thumb}><Image source={p.image} style={StyleSheet.absoluteFill} contentFit="cover" /></View>
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={s.rowMeta} numberOfLines={1}>{p.category}</Text>
                    <Text style={s.rowTitle} numberOfLines={2}>{p.title}</Text>
                  </View>
                  <Text style={s.rowPrice}>{formatPrice(p, currency)}</Text>
                  <Text style={s.arrow}>→</Text>
                </Pressable>
              ))}
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              <Button label="Add the full look" variant="gold" onPress={addAll} />
              {added ? <Button label="View bag" variant="light" onPress={() => router.push('/bag')} /> : null}
            </View>
            {added ? <Text style={s.added} accessibilityLiveRegion="polite">✓ {added}</Text> : null}
          </View>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tab: { minHeight: 44, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#3A3835' },
  tabNo: { fontFamily: Type.monoBold, fontSize: 12, letterSpacing: 1.2, color: Brand.gold },
  tabName: { fontFamily: Type.monoBold, fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', color: Brand.concrete, maxWidth: 190 },
  frame: { backgroundColor: Brand.studio, overflow: 'hidden' },
  stamp: { position: 'absolute', left: 14, top: 14, backgroundColor: Brand.ink, paddingHorizontal: 10, paddingVertical: 6 },
  stampText: { fontFamily: Type.monoBold, fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase', color: Brand.bone },
  mood: { fontFamily: Type.body, fontSize: 17, lineHeight: 26, color: Brand.concrete, maxWidth: 520 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, borderBottomWidth: 1, borderColor: '#2E2C2A' },
  rowNo: { fontFamily: Type.monoBold, fontSize: 12, color: Brand.gold, width: 24 },
  thumb: { width: 56, height: 70, backgroundColor: Brand.tile, overflow: 'hidden' },
  rowMeta: { fontFamily: Type.mono, fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', color: Brand.washed },
  rowTitle: { fontFamily: Type.display, fontSize: 18, lineHeight: 20, textTransform: 'uppercase', color: Brand.bone },
  rowPrice: { fontFamily: Type.monoBold, fontSize: 13, color: Brand.bone },
  arrow: { fontFamily: Type.monoBold, fontSize: 14, color: Brand.washed },
  added: { fontFamily: Type.monoBold, fontSize: 12, letterSpacing: 1, color: Brand.gold },
});
