import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand, Type } from '@/constants/theme';
import { findProduct, formatPrice } from '@/src/constants/catalog';
import { useBag } from '@/src/context/BagContext';
import { Button, Display, Eyebrow } from '@/src/components/ui';
import { getRemote } from '@/src/lib/remoteProducts';

// Orders are taken over WhatsApp until online payments (e.g. PayFast / Stripe) are connected.
const WHATSAPP = 'https://wa.me/41762523825';

export default function BagScreen() {
  const { lines, setQty, clear, currency, count } = useBag();
  const items = lines.map((l) => ({ ...l, p: findProduct(l.id) ?? getRemote(l.id) })).filter((x) => x.p);

  const order = () => {
    const text = ['Hi Crazy Button SA, I want to order:', ...items.map((x) => `• ${x.qty} × ${x.p!.title} (${x.size})`)].join('\n');
    Linking.openURL(`${WHATSAPP}?text=${encodeURIComponent(text)}`);
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: Brand.bone }}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 18, maxWidth: 900, width: '100%', alignSelf: 'center' }}>
        <Eyebrow>Your bag · {count} {count === 1 ? 'item' : 'items'}</Eyebrow>
        <Display size={52}>The bag</Display>
        {items.length === 0 ? (
          <View style={styles.empty}>
            <Display size={26}>Nothing in here yet</Display>
            <Text style={styles.small}>Don’t brick the drop — the good stuff goes fast.</Text>
            <Button label="Shop the drop" onPress={() => router.push('/catalog')} />
          </View>
        ) : (
          <>
            {items.map((x) => (
              <View key={`${x.id}-${x.size}`} style={styles.line}>
                <View style={styles.thumb}><Image source={x.p!.image} style={StyleSheet.absoluteFill} contentFit="cover" /></View>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={styles.meta}>{x.p!.collection} · Size {x.size}</Text>
                  <Text style={styles.title}>{x.p!.title}</Text>
                  <Text style={styles.price}>{formatPrice(x.p!, currency)}</Text>
                  <View style={styles.qty}>
                    <Pressable onPress={() => setQty(x.id, x.size, x.qty - 1)} style={styles.qtyBtn} accessibilityLabel="Decrease quantity"><Text style={styles.qtyText}>−</Text></Pressable>
                    <Text style={styles.qtyText}>{x.qty}</Text>
                    <Pressable onPress={() => setQty(x.id, x.size, x.qty + 1)} style={styles.qtyBtn} accessibilityLabel="Increase quantity"><Text style={styles.qtyText}>+</Text></Pressable>
                  </View>
                </View>
              </View>
            ))}
            <Button label="Order on WhatsApp" variant="dark" onPress={order} />
            <Button label="Clear bag" variant="outline" onPress={clear} />
            <Text style={styles.small}>Prices and online checkout go live with the launch drop.</Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  empty: { borderWidth: 1, borderColor: Brand.ink, padding: 28, gap: 12, alignItems: 'flex-start' },
  small: { fontFamily: Type.body, fontSize: 15, color: Brand.smoke },
  line: { flexDirection: 'row', gap: 14, borderBottomWidth: 1, borderColor: Brand.concrete, paddingBottom: 14 },
  thumb: { width: 96, aspectRatio: 4 / 5, backgroundColor: Brand.tile, overflow: 'hidden' },
  meta: { fontFamily: Type.mono, fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', color: Brand.smoke },
  title: { fontFamily: Type.display, fontSize: 20, textTransform: 'uppercase', color: Brand.ink },
  price: { fontFamily: Type.monoBold, fontSize: 13, color: Brand.ink },
  qty: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 4 },
  qtyBtn: { width: 40, height: 40, borderWidth: 1, borderColor: Brand.ink, alignItems: 'center', justifyContent: 'center' },
  qtyText: { fontFamily: Type.monoBold, fontSize: 16, color: Brand.ink },
});
