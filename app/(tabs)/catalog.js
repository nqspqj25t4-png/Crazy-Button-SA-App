import { useEffect, useMemo, useState } from 'react';
import { FlatList, Image, ImageBackground, Linking, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';

import { AUDIENCE_PERSONAS, BRAND_STORY, PATCH_DROP, STANDARD_LABELS, TAGLINE_OPTIONS } from '@/src/constants/products';
import { db } from '@/src/firebase';
import { Colors, Fonts } from '@/constants/theme';

const currencies = ['ZAR', 'EUR'];
const BACKGROUND_IMAGE = require('../../assets/images/crazy-button-logo.png');

export default function CatalogScreen() {
  const [products, setProducts] = useState([]);
  const [currency, setCurrency] = useState('ZAR');
  const [search, setSearch] = useState('');
  const [labelFilter, setLabelFilter] = useState(null);

  useEffect(() => {
    const q = query(collection(db, 'products'), where('status', '==', 'published'), orderBy('updatedAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  const filtered = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.title?.toLowerCase().includes(search.toLowerCase()) ?? true;
      const matchesLabel = labelFilter ? product.labels?.includes(labelFilter) : true;
      return matchesSearch && matchesLabel;
    });
  }, [products, search, labelFilter]);

  const formatPrice = (product) => {
    const value = currency === 'EUR' ? product.priceEUR : product.priceZAR;
    const compare = currency === 'EUR' ? product.compareAtPriceEUR : product.compareAtPriceZAR;
    if (value == null) return 'Coming soon';
    const formatted = `${currency} ${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const compareText = compare ? `  •  ${currency} ${Number(compare).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '';
    return formatted + compareText;
  };

  const openLink = (url) => {
    if (!url) return;
    Linking.openURL(url).catch(() => {});
  };

  const body = (
    <View style={styles.inner}>
      <View style={styles.brandCard}>
        <Text style={styles.brandTagline}>{BRAND_STORY.tagline}</Text>
        <Text style={styles.brandVoice}>{BRAND_STORY.voice}</Text>
        <Text style={styles.brandUSP}>{BRAND_STORY.usp}</Text>
        <TouchableOpacity onPress={() => openLink(BRAND_STORY.contact.instagram)}>
          <Text style={styles.brandLink}>{BRAND_STORY.contact.instagram.replace('https://', '')}</Text>
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.taglineRow}>
        {TAGLINE_OPTIONS.map((line) => (
          <View key={line} style={styles.taglineChip}>
            <Text style={styles.taglineText}>{line}</Text>
          </View>
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.personaRow}>
        {AUDIENCE_PERSONAS.map((persona) => (
          <View key={persona.name} style={styles.personaCard}>
            <Text style={styles.personaTitle}>{persona.name}</Text>
            <Text style={styles.personaDescription}>{persona.description}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={styles.patchList}>
        {PATCH_DROP.map((patch) => (
          <View key={patch.title} style={styles.patchCard}>
            <Text style={styles.patchTitle}>{patch.title}</Text>
            <Text style={styles.patchDescription}>{patch.description}</Text>
          </View>
        ))}
      </View>
      <View style={styles.controls}>
        <TextInput
          placeholder="Search products"
          value={search}
          onChangeText={setSearch}
          style={styles.search}
        />
        <View style={styles.currencyRow}>
          {currencies.map((c) => (
            <TouchableOpacity key={c} style={[styles.currencyChip, currency === c && styles.currencyChipActive]} onPress={() => setCurrency(c)}>
              <Text style={[styles.currencyChipText, currency === c && styles.currencyChipTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.filterRow}>
        <TouchableOpacity style={[styles.filterChip, !labelFilter && styles.filterChipActive]} onPress={() => setLabelFilter(null)}>
          <Text style={[styles.filterChipText, !labelFilter && styles.filterChipTextActive]}>All labels</Text>
        </TouchableOpacity>
        {STANDARD_LABELS.map((label) => (
          <TouchableOpacity key={label} style={[styles.filterChip, labelFilter === label && styles.filterChipActive]} onPress={() => setLabelFilter(label)}>
            <Text style={[styles.filterChipText, labelFilter === label && styles.filterChipTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={filtered.length === 0 && styles.empty}
        ListEmptyComponent={<Text style={styles.emptyText}>No products yet.</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => openLink(item.webUrl)}>
            {item.images?.[0]?.url ? (
              <Image source={{ uri: item.images[0].url }} style={styles.image} />
            ) : (
              <View style={[styles.image, styles.imagePlaceholder]} />
            )}
            <View style={styles.cardBody}>
              <Text style={styles.title}>{item.title}</Text>
              {item.subtitle ? <Text style={styles.subtitle}>{item.subtitle}</Text> : null}
              <Text style={styles.price}>{formatPrice(item)}</Text>
              <View style={styles.labelsRow}>
                {item.labels?.map((label) => (
                  <View key={label} style={styles.label}><Text style={styles.labelText}>{label}</Text></View>
                ))}
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );

  return (
    <ImageBackground source={BACKGROUND_IMAGE} style={styles.container} imageStyle={styles.backgroundImage}>
      <View style={styles.overlay}>{body}</View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backgroundImage: { opacity: 0.05, resizeMode: 'contain' },
  overlay: { flex: 1, backgroundColor: 'rgba(247,247,247,0.94)' },
  inner: { flex: 1, padding: 16 },
  brandCard: { backgroundColor: '#ffffffcc', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.light.border },
  brandTagline: { fontSize: 20, fontFamily: Fonts.sans, color: Colors.light.tint },
  brandVoice: { marginTop: 4, color: Colors.light.text, fontFamily: Fonts.body },
  brandUSP: { marginTop: 6, color: Colors.light.accentGreen, fontFamily: Fonts.sans },
  brandLink: { marginTop: 8, color: Colors.light.accentRed, fontFamily: Fonts.sans, textDecorationLine: 'underline' },
  taglineRow: { gap: 10, marginBottom: 12 },
  taglineChip: { backgroundColor: Colors.light.card, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: Colors.light.border },
  taglineText: { fontFamily: Fonts.body, color: Colors.light.text },
  personaRow: { gap: 12, marginBottom: 12 },
  personaCard: { width: 220, padding: 14, borderRadius: 14, backgroundColor: '#ffffffdd', borderWidth: 1, borderColor: Colors.light.border },
  personaTitle: { fontFamily: Fonts.sans, color: Colors.light.tint, marginBottom: 4 },
  personaDescription: { fontFamily: Fonts.body, color: Colors.light.text },
  patchList: { gap: 8, marginBottom: 16 },
  patchCard: { padding: 12, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.light.border },
  patchTitle: { fontFamily: Fonts.sans, color: Colors.light.accentGreen },
  patchDescription: { fontFamily: Fonts.body, color: Colors.light.text },
  controls: { marginBottom: 12, gap: 8 },
  search: { borderWidth: 1, borderColor: Colors.light.border, borderRadius: 12, padding: 12, backgroundColor: Colors.light.card, fontFamily: Fonts.body },
  currencyRow: { flexDirection: 'row', gap: 8 },
  currencyChip: { borderWidth: 1, borderColor: Colors.light.border, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: Colors.light.card },
  currencyChipActive: { backgroundColor: Colors.light.tint, borderColor: Colors.light.tint },
  currencyChipText: { color: Colors.light.text, fontFamily: Fonts.sans },
  currencyChipTextActive: { color: '#fff' },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  filterChip: { borderWidth: 1, borderColor: Colors.light.border, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: Colors.light.card },
  filterChipActive: { backgroundColor: Colors.light.accentGreen, borderColor: Colors.light.accentGreen },
  filterChipText: { color: Colors.light.text, fontFamily: Fonts.body },
  filterChipTextActive: { color: '#fff' },
  card: { backgroundColor: Colors.light.card, borderRadius: 20, overflow: 'hidden', marginBottom: 16, borderWidth: 1, borderColor: Colors.light.border, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  image: { width: '100%', height: 220 },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#e5e5e5' },
  cardBody: { padding: 14, gap: 4 },
  title: { fontSize: 20, fontFamily: Fonts.sans, color: Colors.light.text },
  subtitle: { color: '#4b5563', fontFamily: Fonts.body },
  price: { marginTop: 4, fontSize: 16, fontFamily: Fonts.sans, color: Colors.light.tint },
  labelsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  label: { backgroundColor: Colors.light.accentYellow, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  labelText: { color: Colors.light.text, fontSize: 12, fontFamily: Fonts.body },
  empty: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#777', fontFamily: Fonts.body },
});
