import { useLocalSearchParams } from 'expo-router';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand, Type } from '@/constants/theme';
import { CATALOG, CATEGORIES } from '@/src/constants/catalog';
import { useBag } from '@/src/context/BagContext';
import { Chip, Display, Eyebrow, ProductCard } from '@/src/components/ui';
import { db } from '@/src/firebase';
import { rememberRemote } from '@/src/lib/remoteProducts';

// Firestore product -> app product shape
const fromFirestore = (d) => ({
  id: `fs-${d.id}`,
  title: d.title ?? 'Untitled',
  collection: d.collection ?? d.category ?? 'Core Range',
  category: CATEGORIES.includes(d.category) ? d.category : 'Tees',
  subtitle: d.subtitle ?? '',
  description: d.description ?? '',
  image: d.images?.[0]?.url ? { uri: d.images[0].url } : require('@/assets/images/crazy-button-logo.png'),
  priceZAR: d.priceZAR || null,
  priceEUR: d.priceEUR || null,
  badge: d.labels?.includes('New') ? 'New' : undefined,
  sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
});

export default function ShopScreen() {
  const params = useLocalSearchParams();
  const { width } = useWindowDimensions();
  const { currency, setCurrency } = useBag();
  const [remote, setRemote] = useState([]);
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState(typeof params.category === 'string' ? params.category : 'All');

  useEffect(() => { if (typeof params.category === 'string') setCat(params.category); }, [params.category]);

  useEffect(() => {
    try {
      const q = query(collection(db, 'products'), where('status', '==', 'published'));
      return onSnapshot(q, (snap) => {
        const list = snap.docs.map((d) => fromFirestore({ id: d.id, ...d.data() }));
        list.forEach(rememberRemote);
        setRemote(list);
      }, () => setRemote([]));
    } catch {
      return undefined;
    }
  }, []);

  const all = useMemo(() => [...remote, ...CATALOG], [remote]);
  const visible = useMemo(() => all.filter((p) => (cat === 'All' || p.category === cat) && p.title.toLowerCase().includes(search.trim().toLowerCase())), [all, cat, search]);
  const count = (c) => (c === 'All' ? all.length : all.filter((p) => p.category === c).length);

  const pad = width >= 900 ? 40 : 20;
  const cols = width >= 1100 ? 4 : width >= 700 ? 3 : 2;
  const cardW = (Math.min(width, 1360) - pad * 2 - 14 * (cols - 1)) / cols;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: Brand.ink }}>
      <View style={[styles.header, { paddingHorizontal: pad }]}>
        <View style={styles.rowBetween}>
          <View>
            <Eyebrow color={Brand.vapour}>Shop · {visible.length} {visible.length === 1 ? 'piece' : 'pieces'}</Eyebrow>
            <Display size={width >= 900 ? 80 : 52} color={Brand.bone}>{cat === 'All' ? 'Shop all' : cat}</Display>
          </View>
          <View style={styles.currency} accessibilityRole="radiogroup" accessibilityLabel="Currency">
            {['ZAR', 'EUR'].map((c) => (
              <Pressable key={c} onPress={() => setCurrency(c)} accessibilityRole="radio" accessibilityState={{ checked: currency === c }} style={[styles.curBtn, currency === c && { backgroundColor: Brand.bone }]}>
                <Text style={[styles.curText, currency === c && { color: Brand.ink }]}>{c}</Text>
              </Pressable>
            ))}
          </View>
        </View>
        <TextInput placeholder="Search the drop" placeholderTextColor={Brand.washed} value={search} onChangeText={setSearch} style={styles.search} accessibilityLabel="Search products" />
      </View>
      <View style={{ backgroundColor: Brand.bone, borderBottomWidth: 1, borderColor: Brand.concrete }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: pad, paddingVertical: 12 }}>
          {['All', ...CATEGORIES].map((c) => <Chip key={c} label={`${c} · ${count(c)}`} active={cat === c} onPress={() => setCat(c)} />)}
        </ScrollView>
      </View>
      <FlatList
        key={cols}
        style={{ backgroundColor: Brand.bone }}
        data={visible}
        keyExtractor={(p) => p.id}
        numColumns={cols}
        columnWrapperStyle={{ gap: 14 }}
        contentContainerStyle={{ padding: pad, gap: 28, paddingBottom: 60 }}
        renderItem={({ item }) => <ProductCard p={item} currency={currency} width={cardW} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Display size={30}>Something heavy is coming</Display>
            <Text style={styles.emptyText}>Nothing here yet. Join the list to cop first.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: Brand.ink, paddingTop: 24, paddingBottom: 18, gap: 14 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12 },
  currency: { flexDirection: 'row', borderWidth: 1, borderColor: Brand.bone },
  curBtn: { minWidth: 56, minHeight: 40, alignItems: 'center', justifyContent: 'center' },
  curText: { fontFamily: Type.monoBold, fontSize: 12, color: Brand.bone, letterSpacing: 1 },
  search: { borderWidth: 1, borderColor: '#3A3836', color: Brand.bone, minHeight: 46, paddingHorizontal: 14, fontFamily: Type.body, fontSize: 16 },
  empty: { padding: 40, borderWidth: 1, borderColor: Brand.ink, alignItems: 'center', gap: 8 },
  emptyText: { fontFamily: Type.body, fontSize: 16, color: Brand.smoke },
});
