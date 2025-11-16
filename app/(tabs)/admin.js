import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, FlatList, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import * as Crypto from 'expo-crypto';

import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { addDoc, collection, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';

import { STANDARD_LABELS, DEFAULT_CATEGORIES } from '@/src/constants/products';
import { Colors, Fonts } from '@/constants/theme';
import { useAuth } from '@/src/context/AuthContext';
import { auth, db, storage } from '@/src/firebase';

const initialForm = {
  id: null,
  title: '',
  subtitle: '',
  description: '',
  category: DEFAULT_CATEGORIES[0],
  tagsText: '',
  labels: ['New'],
  priceZAR: '',
  priceEUR: '',
  compareAtPriceZAR: '',
  compareAtPriceEUR: '',
  sku: '',
  barcode: '',
  stock: '',
  weight: '',
  dimensions: { length: '', width: '', height: '' },
  materials: '',
  careInstructions: '',
  fitNotes: '',
  sizeGuideUrl: '',
  webUrl: 'https://crazybuttonsa.com/products/',
  status: 'draft',
  images: [],
};

const statuses = ['draft', 'published'];

const uriToBlob = async (uri) => {
  const res = await fetch(uri);
  return await res.blob();
};

export default function AdminScreen() {
  const { user, loading } = useAuth();
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState([]);
  const [syncing, setSyncing] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('updatedAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
      setProducts(list);
      setSyncing(false);
    });
    return unsub;
  }, []);

  const parsedTags = useMemo(() =>
    form.tagsText
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean),
  [form.tagsText]);

  const toggleLabel = (label) => {
    setForm((prev) => ({
      ...prev,
      labels: prev.labels.includes(label)
        ? prev.labels.filter((l) => l !== label)
        : [...prev.labels, label],
    }));
  };

  const pickImages = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      quality: 0.85,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });
    if (!res.canceled) {
      const newImages = res.assets.map((asset) => ({ uri: asset.uri, name: asset.fileName }));
      setForm((prev) => ({ ...prev, images: [...prev.images, ...newImages] }));
    }
  };

  const removeImage = async (index) => {
    const image = form.images[index];
    if (image?.storagePath) {
      await deleteObject(ref(storage, image.storagePath)).catch(() => null);
    }
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== index),
    }));
  };

  const resetForm = () => setForm(initialForm);

  const handleAuth = async () => {
    try {
      await signInWithEmailAndPassword(auth, authEmail.trim(), authPassword);
      setAuthPassword('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert('Login failed', error.message);
    }
  };

  const signOutAdmin = async () => {
    await signOut(auth);
  };

  const uploadImage = async (image) => {
    if (image.url) return image; // already uploaded
    const blob = await uriToBlob(image.uri);
    const fileName = `${Crypto.randomUUID?.() ?? Date.now()}-${image.name ?? 'asset'}`;
    const storagePath = `products/${fileName}`;
    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, blob);
    const url = await getDownloadURL(storageRef);
    return { url, storagePath, alt: image.alt ?? (form.title || 'Crazy Button SA') };
  };

  const handleSave = async () => {
    if (!form.title) return Alert.alert('Missing title', 'Please enter a product title.');
    setSaving(true);
    try {
      const uploadedImages = await Promise.all(form.images.map(uploadImage));
      const payload = {
        title: form.title,
        subtitle: form.subtitle,
        description: form.description,
        category: form.category,
        tags: parsedTags,
        labels: form.labels,
        priceZAR: Number(form.priceZAR) || 0,
        priceEUR: Number(form.priceEUR) || 0,
        compareAtPriceZAR: Number(form.compareAtPriceZAR) || null,
        compareAtPriceEUR: Number(form.compareAtPriceEUR) || null,
        sku: form.sku,
        barcode: form.barcode,
        stock: Number(form.stock) || 0,
        weight: Number(form.weight) || null,
        dimensions: {
          length: Number(form.dimensions.length) || null,
          width: Number(form.dimensions.width) || null,
          height: Number(form.dimensions.height) || null,
        },
        materials: form.materials,
        careInstructions: form.careInstructions,
        fitNotes: form.fitNotes,
        sizeGuideUrl: form.sizeGuideUrl,
        webUrl: form.webUrl,
        status: form.status,
        images: uploadedImages,
        updatedAt: serverTimestamp(),
        updatedBy: user?.email ?? 'admin',
      };

      if (form.id) {
        await updateDoc(doc(db, 'products', form.id), payload);
      } else {
        await addDoc(collection(db, 'products'), {
          ...payload,
          createdAt: serverTimestamp(),
          createdBy: user?.email ?? 'admin',
        });
      }

      Alert.alert('Saved', `${form.title} saved successfully.`);
      resetForm();
    } catch (error) {
      Alert.alert('Save failed', error.message);
    } finally {
      setSaving(false);
    }
  };

  const loadProduct = (product) => {
    setForm({
      ...initialForm,
      ...product,
      id: product.id,
      tagsText: product.tags?.join(', ') ?? '',
      images: product.images ?? [],
    });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Checking admin access…</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.authContainer}>
        <Text style={styles.h}>Admin Sign In</Text>
        <TextInput
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={authEmail}
          onChangeText={setAuthEmail}
          style={styles.input}
        />
        <TextInput
          placeholder="Password"
          secureTextEntry
          value={authPassword}
          onChangeText={setAuthPassword}
          style={styles.input}
        />
        <Button title="Sign In" onPress={handleAuth} />
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <View style={styles.headerRow}>
        <Text style={styles.h}>Welcome, {user.email}</Text>
        <Button title="Sign Out" onPress={signOutAdmin} />
      </View>

      <Text style={styles.sectionTitle}>Products</Text>
      <FlatList
        data={products}
        horizontal
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.productList}
        ListEmptyComponent={<Text>{syncing ? 'Loading…' : 'No products yet.'}</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.productCard} onPress={() => loadProduct(item)}>
            {item.images?.[0]?.url ? (
              <Image source={{ uri: item.images[0].url }} style={styles.productThumb} />
            ) : (
              <View style={[styles.productThumb, styles.productThumbPlaceholder]} />
            )}
            <Text numberOfLines={1} style={styles.productTitle}>{item.title}</Text>
            <Text style={styles.productMeta}>{item.status?.toUpperCase()}</Text>
          </TouchableOpacity>
        )}
      />

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.sectionTitle}>Product Details</Text>
        <TextInput placeholder="Title" value={form.title} onChangeText={(text) => setForm((prev) => ({ ...prev, title: text }))} style={styles.input} />
        <TextInput placeholder="Subtitle" value={form.subtitle} onChangeText={(text) => setForm((prev) => ({ ...prev, subtitle: text }))} style={styles.input} />
        <TextInput
          placeholder="Description"
          value={form.description}
          onChangeText={(text) => setForm((prev) => ({ ...prev, description: text }))}
          style={[styles.input, styles.multiline]}
          multiline
        />

        <TextInput placeholder="Category" value={form.category} onChangeText={(text) => setForm((prev) => ({ ...prev, category: text }))} style={styles.input} />
        <TextInput placeholder="Tags (comma separated)" value={form.tagsText} onChangeText={(text) => setForm((prev) => ({ ...prev, tagsText: text }))} style={styles.input} />

        <Text style={styles.label}>Labels</Text>
        <View style={styles.chipRow}>
          {STANDARD_LABELS.map((label) => (
            <TouchableOpacity key={label} style={[styles.chip, form.labels.includes(label) && styles.chipActive]} onPress={() => toggleLabel(label)}>
              <Text style={[styles.chipText, form.labels.includes(label) && styles.chipTextActive]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.row}>
          <TextInput placeholder="Price (ZAR)" value={form.priceZAR} onChangeText={(text) => setForm((prev) => ({ ...prev, priceZAR: text }))} keyboardType="decimal-pad" style={[styles.input, styles.flex]} />
          <TextInput placeholder="Price (EUR)" value={form.priceEUR} onChangeText={(text) => setForm((prev) => ({ ...prev, priceEUR: text }))} keyboardType="decimal-pad" style={[styles.input, styles.flex]} />
        </View>
        <View style={styles.row}>
          <TextInput placeholder="Compare at ZAR" value={form.compareAtPriceZAR} onChangeText={(text) => setForm((prev) => ({ ...prev, compareAtPriceZAR: text }))} keyboardType="decimal-pad" style={[styles.input, styles.flex]} />
          <TextInput placeholder="Compare at EUR" value={form.compareAtPriceEUR} onChangeText={(text) => setForm((prev) => ({ ...prev, compareAtPriceEUR: text }))} keyboardType="decimal-pad" style={[styles.input, styles.flex]} />
        </View>

        <View style={styles.row}>
          <TextInput placeholder="SKU" value={form.sku} onChangeText={(text) => setForm((prev) => ({ ...prev, sku: text }))} style={[styles.input, styles.flex]} />
          <TextInput placeholder="Barcode" value={form.barcode} onChangeText={(text) => setForm((prev) => ({ ...prev, barcode: text }))} style={[styles.input, styles.flex]} />
        </View>
        <View style={styles.row}>
          <TextInput placeholder="Stock" value={form.stock} onChangeText={(text) => setForm((prev) => ({ ...prev, stock: text }))} style={[styles.input, styles.flex]} keyboardType="number-pad" />
          <TextInput placeholder="Weight (g)" value={form.weight} onChangeText={(text) => setForm((prev) => ({ ...prev, weight: text }))} style={[styles.input, styles.flex]} keyboardType="decimal-pad" />
        </View>
        <View style={styles.row}>
          <TextInput placeholder="Length (cm)" value={form.dimensions.length} onChangeText={(text) => setForm((prev) => ({ ...prev, dimensions: { ...prev.dimensions, length: text } }))} style={[styles.input, styles.flex]} keyboardType="decimal-pad" />
          <TextInput placeholder="Width (cm)" value={form.dimensions.width} onChangeText={(text) => setForm((prev) => ({ ...prev, dimensions: { ...prev.dimensions, width: text } }))} style={[styles.input, styles.flex]} keyboardType="decimal-pad" />
          <TextInput placeholder="Height (cm)" value={form.dimensions.height} onChangeText={(text) => setForm((prev) => ({ ...prev, dimensions: { ...prev.dimensions, height: text } }))} style={[styles.input, styles.flex]} keyboardType="decimal-pad" />
        </View>

        <TextInput placeholder="Materials" value={form.materials} onChangeText={(text) => setForm((prev) => ({ ...prev, materials: text }))} style={styles.input} />
        <TextInput placeholder="Care Instructions" value={form.careInstructions} onChangeText={(text) => setForm((prev) => ({ ...prev, careInstructions: text }))} style={styles.input} />
        <TextInput placeholder="Fit Notes" value={form.fitNotes} onChangeText={(text) => setForm((prev) => ({ ...prev, fitNotes: text }))} style={styles.input} />
        <TextInput placeholder="Size Guide URL" value={form.sizeGuideUrl} onChangeText={(text) => setForm((prev) => ({ ...prev, sizeGuideUrl: text }))} style={styles.input} />
        <TextInput placeholder="Product Web URL" value={form.webUrl} onChangeText={(text) => setForm((prev) => ({ ...prev, webUrl: text }))} style={styles.input} />

        <Text style={styles.label}>Status</Text>
        <View style={styles.chipRow}>
          {statuses.map((status) => (
            <TouchableOpacity key={status} style={[styles.chip, form.status === status && styles.chipActive]} onPress={() => setForm((prev) => ({ ...prev, status }))}>
              <Text style={[styles.chipText, form.status === status && styles.chipTextActive]}>{status}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Images</Text>
        <Button title="Pick Images" onPress={pickImages} />
        <View style={styles.imagesRow}>
          {form.images.map((img, idx) => (
            <View key={img.uri || img.url} style={styles.thumbWrapper}>
              <Image source={{ uri: img.uri || img.url }} style={styles.thumb} />
              <TouchableOpacity style={styles.removeBadge} onPress={() => removeImage(idx)}>
                <Text style={styles.removeBadgeText}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={styles.buttonRow}>
          <Button title="Reset" onPress={resetForm} color="#888" />
          <Button title={form.id ? 'Update Product' : 'Create Product'} onPress={handleSave} disabled={saving} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  authContainer: { flex: 1, justifyContent: 'center', padding: 24, gap: 12, backgroundColor: Colors.light.background },
  container: { padding: 16, gap: 12, backgroundColor: Colors.light.background },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12 },
  sectionTitle: { fontSize: 18, fontFamily: Fonts.sans, color: Colors.light.text, marginHorizontal: 16, marginTop: 16 },
  h: { fontSize: 20, fontFamily: Fonts.sans, color: Colors.light.text },
  input: { borderWidth: 1, borderColor: Colors.light.border, padding: 10, borderRadius: 10, backgroundColor: Colors.light.card, marginBottom: 4, fontFamily: Fonts.body },
  multiline: { minHeight: 90, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 8 },
  flexGrow: { flex: 1 },
  label: { fontWeight: '600', marginTop: 6, color: Colors.light.text, fontFamily: Fonts.sans },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: Colors.light.border, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: Colors.light.card },
  chipActive: { backgroundColor: Colors.light.tint, borderColor: Colors.light.tint },
  chipText: { color: Colors.light.text, fontFamily: Fonts.body },
  chipTextActive: { color: '#fff', fontFamily: Fonts.body },
  imagesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 },
  thumbWrapper: { position: 'relative' },
  thumb: { width: 90, height: 90, borderRadius: 10, backgroundColor: '#f0f0f0' },
  removeBadge: { position: 'absolute', top: -6, right: -6, backgroundColor: Colors.light.accentRed, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  removeBadgeText: { color: '#fff', fontWeight: '700' },
  productList: { paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  productCard: { width: 140, padding: 8, borderRadius: 12, borderWidth: 1, borderColor: Colors.light.border, backgroundColor: Colors.light.card, marginRight: 12 },
  productThumb: { width: '100%', height: 90, borderRadius: 10, backgroundColor: '#eee' },
  productThumbPlaceholder: { borderWidth: 1, borderColor: '#ddd', borderStyle: 'dashed' },
  productTitle: { fontWeight: '600', marginTop: 6, fontFamily: Fonts.sans, color: Colors.light.text },
  productMeta: { fontSize: 12, color: '#666', fontFamily: Fonts.body },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
});
