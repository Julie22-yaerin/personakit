// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const firebaseConfig = {
  apiKey: "AIzaSyAU7tndPshfmNNClBNZA3WbBBGzbmzRWI4",
  authDomain: "pclick-9f190.firebaseapp.com",
  projectId: "pclick-9f190",
  storageBucket: "pclick-9f190.firebasestorage.app",
  messagingSenderId: "43342438061",
  appId: "1:43342438061:web:2b9e5019339e6cf0e87024",
  measurementId: "G-H8BF2M6ERM"
};

// Initialize Firebase (singleton pattern)
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Analytics safely (only in supported browser environments)
export const initAnalytics = async () => {
  if (typeof window !== "undefined") {
    try {
      const supported = await isSupported();
      if (supported) {
        return getAnalytics(app);
      }
    } catch {
      // Ignore analytics errors in environments that block tracking
    }
  }
  return null;
};
