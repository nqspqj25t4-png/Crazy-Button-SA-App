/**
 * Local product catalogue — the showroom fallback.
 * The Shop shows Firestore "published" products first; anything here fills the rest,
 * so the app always looks complete in a demo even before the database is filled.
 * Prices are placeholders until the final price list is confirmed.
 */
import { ImageSourcePropType } from 'react-native';

export type Category = 'Hoodies' | 'Jackets' | 'Knitwear' | 'Shirts' | 'Tees' | 'Pants' | 'Hats' | 'Bags' | 'Patches';

export type Product = {
  id: string;
  title: string;
  collection: string;
  category: Category;
  subtitle: string;
  description: string;
  image: ImageSourcePropType | { uri: string };
  priceZAR: number | null;
  priceEUR: number | null;
  badge?: string;
  sizes?: string[];
};

const APPAREL = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const ONE = ['One size'];

export const CATEGORIES: Category[] = ['Hoodies', 'Jackets', 'Knitwear', 'Shirts', 'Tees', 'Pants', 'Hats', 'Bags', 'Patches'];

export const CATALOG: Product[] = [
  { id: 'umlazi-unit-hoodie', title: 'Umlazi Unit Hoodie', collection: 'Core Range', category: 'Hoodies', badge: 'Hero', subtitle: 'Olive fleece, gold embroidered CB', description: 'The uniform of the underground. Olive heavyweight hoodie with gold embroidered CB letters, “Umlazi Unit” stitching, flag-colour sleeve stripes and a leather cuff tab.', image: require('@/assets/images/products/hoodie.jpg'), priceZAR: 2449, priceEUR: 135, sizes: APPAREL },
  { id: 'craziest-threads-varsity', title: 'Craziest Threads Varsity Jacket', collection: 'Core Range', category: 'Jackets', badge: 'New', subtitle: 'Black & gold varsity, chenille CB', description: 'Black wool body, gold leather sleeves, chenille CB, shield and taxi patches. Craziest threads on the block.', image: require('@/assets/images/products/varsity.jpg'), priceZAR: 3599, priceEUR: 195, sizes: APPAREL },
  { id: 'kwa-mashu-bomber', title: 'Kwa Mashu To The World Bomber', collection: 'Zulu Future', category: 'Jackets', badge: 'Limited', subtitle: 'Quilted flag-colour sleeves', description: 'Black bomber with quilted sleeves in the flag palette and a Kwa Mashu To The World chest patch.', image: require('@/assets/images/products/bomber.jpg'), priceZAR: 3199, priceEUR: 175, sizes: APPAREL },
  { id: 'umlazi-ailwo-knit', title: 'Umlazi Ailwo! Button Knit', collection: 'Core Range', category: 'Knitwear', badge: 'New', subtitle: 'Deep green knit, rows of buttons', description: 'Deep green crew knit with rows of statement buttons and an Umlazi Ailwo! badge.', image: require('@/assets/images/products/buttonsdown.jpg'), priceZAR: 2749, priceEUR: 150, sizes: APPAREL },
  { id: 'button-ups-knit', title: 'Button Ups Knit', collection: 'Core Range', category: 'Knitwear', subtitle: 'Navy knit, red colour-block', description: 'Navy knit with scattered buttons and a red colour-block panel.', image: require('@/assets/images/products/buttonups.jpg'), priceZAR: 2749, priceEUR: 150, sizes: APPAREL },
  { id: 'yizwa-ke-manje-cardigan', title: 'Yizwa Ke Manje Cardigan', collection: 'Thrift Flex', category: 'Knitwear', subtitle: 'Ash grey, flag-stripe trim', description: 'Eclectic grandpa meets streetwear. Ash grey cardigan, flag-stripe trim, gold Crazy Button badge and “Yizwa ke manje” in the lining.', image: require('@/assets/images/products/cardigan.jpg'), priceZAR: 3049, priceEUR: 165, sizes: APPAREL },
  { id: 'big-bob-shirt', title: 'Big Bob Shirt', collection: 'Core Range', category: 'Shirts', subtitle: 'Bone, flag button patch', description: 'Bone short-sleeve shirt with a flag button patch and red and green stripe.', image: require('@/assets/images/products/bigbob.jpg'), priceZAR: 2049, priceEUR: 110, sizes: APPAREL },
  { id: 'contract-c-shirt', title: 'Contract C Shirt', collection: 'Core Range', category: 'Shirts', subtitle: 'White, sleeve buttons', description: 'White short-sleeve with sleeve buttons and Crazy Button SA chest print.', image: require('@/assets/images/products/contractc.jpg'), priceZAR: 2049, priceEUR: 110, sizes: APPAREL },
  { id: 'mama-said-tee', title: 'Mama Said Tee', collection: 'Mama Said', category: 'Tees', subtitle: 'Wear something warm', description: 'Cream oversized box-cut tee with a vintage gogo stamp print. Mama said wear something warm.', image: require('@/assets/images/products/mamasaid.jpg'), priceZAR: 1699, priceEUR: 95, sizes: APPAREL },
  { id: 'craziest-threads-tee', title: 'Craziest Threads On The Block Tee', collection: 'Core Range', category: 'Tees', subtitle: 'Black unisex, skyline back print', description: 'Black unisex tee, back print with Jozi skyline and flag stripe.', image: require('@/assets/images/products/tee.jpg'), priceZAR: 1449, priceEUR: 80, sizes: APPAREL },
  { id: 'taxi-rank-tee', title: 'Taxi Rank Chronicles Tee', collection: 'Core Range', category: 'Tees', subtitle: 'Washed grey, Daily Route 1', description: 'Washed grey tee with a taxi rank illustration and CBSA Daily Route 1.', image: require('@/assets/images/products/taxi.jpg'), priceZAR: 1449, priceEUR: 80, sizes: APPAREL },
  { id: 'braam-nights-track-pants', title: 'Braam Nights Wide-Leg Track Pants', collection: 'Braam Nights', category: 'Pants', subtitle: 'Midnight blue, side stripe', description: 'Midnight blue nylon-silk blend with green and red side stripe. Hidden waistband message: we move different.', image: require('@/assets/images/products/pants.jpg'), priceZAR: 2249, priceEUR: 125, sizes: APPAREL },
  { id: 'crazy-button-bucket', title: 'Crazy Button Bucket Hat', collection: 'Core Range', category: 'Hats', subtitle: 'Gold, embroidered logo', description: 'Gold bucket hat with green embroidered button logo.', image: require('@/assets/images/products/buckethat.jpg'), priceZAR: 1299, priceEUR: 70, sizes: ONE },
  { id: 'spaza-bucket', title: 'Spaza Bucket Hat', collection: 'Spaza Drip', category: 'Hats', badge: 'New', subtitle: 'Spaza shop front', description: 'Flag colour-block bucket with an embroidered spaza shop front.', image: require('@/assets/images/products/spaza.jpg'), priceZAR: 1449, priceEUR: 80, sizes: ONE },
  { id: 'kwa-mashu-daylife-bucket', title: 'Kwa Mashu Daylife Bucket Hat', collection: 'Core Range', category: 'Hats', subtitle: 'Rise & grind kasi style', description: 'Gold and green bucket with the Kwa Mashu Daylife patch.', image: require('@/assets/images/products/daylife.jpg'), priceZAR: 1399, priceEUR: 75, sizes: ONE },
  { id: 'umlazi-nights-bucket', title: 'Umlazi Nights Bucket Hat', collection: 'Core Range', category: 'Hats', subtitle: 'Purple and black skyline', description: 'Purple and black bucket with embroidered skyline and dancers.', image: require('@/assets/images/products/umlazihat.jpg'), priceZAR: 1449, priceEUR: 80, sizes: ONE },
  { id: 'cbsa-drawstring', title: 'CBSA Drawstring Bag', collection: 'Core Range', category: 'Bags', subtitle: 'Umlazi · Workshop · Berea · CBD', description: 'Black drawstring bag with CBSA graffiti and a Durban street sign.', image: require('@/assets/images/products/drawstring.jpg'), priceZAR: 1249, priceEUR: 70, sizes: ONE },
  { id: 'cbsa-drawstring-range', title: 'CBSA Drawstring Range', collection: 'Core Range', category: 'Bags', subtitle: 'Camo, black and denim', description: 'The drawstring in camo, black and denim.', image: require('@/assets/images/products/drawrange.jpg'), priceZAR: 2249, priceEUR: 125, sizes: ONE },
  { id: 'luggage-black', title: 'Luggage Cover — Black', collection: 'Core Range', category: 'Bags', subtitle: 'Premium Brand button crest', description: 'Stretch suitcase cover with the Premium Brand button crest.', image: require('@/assets/images/products/lugblack.jpg'), priceZAR: 1599, priceEUR: 90, sizes: ['S', 'M', 'L'] },
  { id: 'luggage-white', title: 'Luggage Cover — White', collection: 'Core Range', category: 'Bags', subtitle: 'Full-colour button crest', description: 'Stretch suitcase cover with the full-colour button crest.', image: require('@/assets/images/products/lugwhite.jpg'), priceZAR: 1599, priceEUR: 90, sizes: ['S', 'M', 'L'] },
  { id: 'patch-pack-vol-1', title: 'Patch Drop Vol. 1 — Full Pack', collection: 'Patch Drop Vol. 1', category: 'Patches', badge: 'Limited', subtitle: 'All twelve iron-on patches', description: 'Every patch from Vol. 1 in one drop. Made for denim, bags and caps.', image: require('@/assets/images/products/patch-pack.jpg'), priceZAR: 2799, priceEUR: 150, sizes: ONE },
  { id: 'patch-kwa-mashu', title: 'Kwa Mashu To The World Patch', collection: 'Patch Drop Vol. 1', category: 'Patches', subtitle: 'Bold banner vibes', description: 'From eKasi to global, rep your roots loud.', image: require('@/assets/images/products/p-kwamashu.jpg'), priceZAR: 349, priceEUR: 20, sizes: ONE },
  { id: 'patch-umlazi-nights', title: 'Umlazi Nights Patch', collection: 'Patch Drop Vol. 1', category: 'Patches', subtitle: 'Neon skyline and basslines', description: 'Umlazi after dark.', image: require('@/assets/images/products/p-umlazinights.jpg'), priceZAR: 349, priceEUR: 20, sizes: ONE },
  { id: 'patch-flag-barcode', title: 'SA Flag Barcode Patch', collection: 'Patch Drop Vol. 1', category: 'Patches', subtitle: 'Scan this vibe', description: 'Flag drip meets street tech. Nation-coded.', image: require('@/assets/images/products/p-flag.jpg'), priceZAR: 349, priceEUR: 20, sizes: ONE },
  { id: 'patch-izinto-zothando', title: 'Izinto Zothando Patch', collection: 'Patch Drop Vol. 1', category: 'Patches', subtitle: 'Stitched with love', description: 'Broken heart stitched with love. Gogo meets kota.', image: require('@/assets/images/products/p-zothando.jpg'), priceZAR: 349, priceEUR: 20, sizes: ONE },
  { id: 'patch-made-in-township', title: 'Made In The Township Patch', collection: 'Patch Drop Vol. 1', category: 'Patches', subtitle: 'Stamped with pride', description: 'Tough thread, tougher history.', image: require('@/assets/images/products/p-township.jpg'), priceZAR: 349, priceEUR: 20, sizes: ONE },
  { id: 'patch-mascot', title: 'Crazy Button Mascot Patch', collection: 'Patch Drop Vol. 1', category: 'Patches', subtitle: 'The brand got a face', description: 'Gold tooth, sneakers, mad attitude.', image: require('@/assets/images/products/p-mascot.jpg'), priceZAR: 349, priceEUR: 20, sizes: ONE },
  { id: 'patch-no-haters', title: 'No Haters Club Patch', collection: 'Patch Drop Vol. 1', category: 'Patches', subtitle: 'Haters left at the gate', description: 'Varsity block with peaceful fists.', image: require('@/assets/images/products/p-nohaters.jpg'), priceZAR: 349, priceEUR: 20, sizes: ONE },
  { id: 'patch-eish', title: 'Eish! Patch', collection: 'Patch Drop Vol. 1', category: 'Patches', subtitle: 'Speech bubble drip', description: 'For moments when words fail, but slang speaks.', image: require('@/assets/images/products/p-eish.jpg'), priceZAR: 349, priceEUR: 20, sizes: ONE },
  { id: 'patch-grootman', title: 'Grootman Approved Patch', collection: 'Patch Drop Vol. 1', category: 'Patches', subtitle: 'Certified wisdom', description: 'For the OGs and day ones.', image: require('@/assets/images/products/p-grootman.jpg'), priceZAR: 349, priceEUR: 20, sizes: ONE },
  { id: 'patch-drip', title: 'Drip Built Different Patch', collection: 'Patch Drop Vol. 1', category: 'Patches', subtitle: 'Kasi-built, never copied', description: 'Brick by brick. Streetwear made for pressure.', image: require('@/assets/images/products/p-drip.jpg'), priceZAR: 349, priceEUR: 20, sizes: ONE },
  { id: 'patch-kasi-dreams', title: 'Pushin’ Kasi Dreams Patch', collection: 'Patch Drop Vol. 1', category: 'Patches', subtitle: 'We move different', description: 'Skater meets taxi hustle.', image: require('@/assets/images/products/p-kasi.jpg'), priceZAR: 349, priceEUR: 20, sizes: ONE },
  { id: 'patch-braam', title: 'Braam Certified Patch', collection: 'Patch Drop Vol. 1', category: 'Patches', subtitle: 'Nightlife in thread', description: 'Neon triangle. Streetlight. Shades.', image: require('@/assets/images/products/p-braam.jpg'), priceZAR: 349, priceEUR: 20, sizes: ONE },
];

export const TAGLINES = ['Wear loud. Walk proud.', 'For the brave. From the block.', 'Mzansi made, globally played.', 'No chill, all drip.', 'Culture in every stitch.'];

export const COLLECTIONS = [
  { name: 'Spaza Drip', desc: 'Spaza shop colours and signage.', color: '#C8322B' },
  { name: 'Zulu Future', desc: 'Bold outerwear, bead accents.', color: '#121212' },
  { name: 'Ekasi Royalty', desc: 'Americana meets township drip.', color: '#1B2D7A' },
  { name: 'Thrift Flex', desc: 'Grandpa knits, recycled wool.', color: '#8C6A3F' },
  { name: 'Braam Nights', desc: 'We move different.', color: '#5B3FA0' },
  { name: 'Mama Said', desc: 'Wear something warm.', color: '#0F5A36' },
];

export const formatPrice = (p: Product, currency: 'ZAR' | 'EUR') => {
  const v = currency === 'ZAR' ? p.priceZAR : p.priceEUR;
  if (v == null) return currency === 'ZAR' ? 'R —' : '€ —';
  return currency === 'ZAR' ? `R${v.toLocaleString('en-ZA')}` : `€${v}`;
};

export const findProduct = (id: string) => CATALOG.find((p) => p.id === id);
