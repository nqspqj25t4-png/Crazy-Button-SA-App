import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import Constants from 'expo-constants';

let firebaseConfig = Constants.expoConfig?.extra?.firebase;

if (!firebaseConfig) {
  try {
    // Optional local fallback for development; create src/firebase/config.json by copying config.example.json
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    firebaseConfig = require('./config.json');
  } catch (e) {
    // no config yet
  }
}

if (!firebaseConfig) {
  console.warn('Firebase config not found. Create src/firebase/config.json or set expo.extra.firebase in app.json');
}

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig || {});

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
