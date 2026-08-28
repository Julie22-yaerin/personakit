"use client";

import { getApp, getApps, initializeApp } from "firebase/app";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";
import { GoogleAuthProvider, getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAU7tndPshfmNNClBNZA3WbBBGzbmzRWI4",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "pclick-9f190.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "pclick-9f190",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "pclick-9f190.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "43342438061",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:43342438061:web:2b9e5019339e6cf0e87024",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-H8BF2M6ERM",
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
export const googleProvider = new GoogleAuthProvider();

let analyticsPromise: Promise<Analytics | null> | null = null;

/** Analytics needs `window`/IndexedDB, so it's only ever initialized client-side, lazily. */
export function getFirebaseAnalytics(): Promise<Analytics | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (!analyticsPromise) {
    analyticsPromise = isSupported().then((supported) =>
      supported ? getAnalytics(firebaseApp) : null,
    );
  }
  return analyticsPromise;
}
