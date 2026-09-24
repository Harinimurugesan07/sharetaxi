import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
};

export const isFirebaseConfigured = () =>
  Object.values(firebaseConfig).every((value) => value && String(value).trim() !== "");

const app = isFirebaseConfigured() ? initializeApp(firebaseConfig) : null;
const messaging = app ? getMessaging(app) : null;

export function isPushSupported() {
  return (
    "Notification" in window &&
    "serviceWorker" in navigator &&
    !!messaging &&
    !!import.meta.env.VITE_FIREBASE_VAPID_KEY
  );
}

export async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return null;

  try {
    return await navigator.serviceWorker.register("/firebase-messaging-sw.js");
  } catch (error) {
    console.warn("Firebase service worker registration failed:", error);
    return null;
  }
}

export async function requestPushToken() {
  if (!isPushSupported()) {
    return null;
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return null;
  }

  await registerServiceWorker();

  try {
    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    });

    if (token) {
      localStorage.setItem("st_push_token", token);
    }

    return token || null;
  } catch (error) {
    console.warn("Unable to obtain Firebase push token:", error);
    return null;
  }
}

export function listenForForegroundMessages(callback) {
  if (!messaging) {
    return () => {};
  }

  return onMessage(messaging, (payload) => {
    callback?.(payload);
  });
}
