// firebase/firebaseConfig.js

import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyBTg35uoh0WUZAHdK7iUJlotD4b1WLWZzE",
  authDomain: "elevage-app-d1eb2.firebaseapp.com",
  projectId: "elevage-app-d1eb2",
  storageBucket: "elevage-app-d1eb2.firebasestorage.app",
  messagingSenderId: "722666907264",
  appId: "1:722666907264:web:42dc06ff5df761d6382865",
};

export const app = initializeApp(firebaseConfig);

// Auth avec persistance de session (l'utilisateur reste connecté)
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);
export const storage = getStorage(app);