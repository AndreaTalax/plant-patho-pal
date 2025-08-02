// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { isSupported } from 'firebase/messaging';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBvZZ4z_YtXKjT3Q3oKFqHQVZJ-6XKbQeM",
  authDomain: "plant-patho-pal.firebaseapp.com",
  projectId: "plant-patho-pal",
  storageBucket: "plant-patho-pal.firebasestorage.app",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456789012345678"
};

// Initialize Firebase - check if app already exists
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Cloud Messaging and get a reference to the service
let messaging: any = null;

// Check if messaging is supported in this environment
const initializeMessaging = async () => {
  try {
    const supported = await isSupported();
    if (supported) {
      messaging = getMessaging(app);
      console.log('🔔 Firebase Messaging initialized');
      return messaging;
    } else {
      console.warn('⚠️ Firebase Messaging not supported in this environment');
      return null;
    }
  } catch (error) {
    console.error('❌ Error initializing Firebase Messaging:', error);
    return null;
  }
};

// VAPID key for web push notifications
const VAPID_KEY = "BK7Z9XZzYzz1ZzZzZzZzZzZzZzZzZzZzZzZzZzZzZzZzZzZzZzZzZzZzZzZzZzZzZzZzZzZzZzZz";

export { app, messaging, initializeMessaging, VAPID_KEY };

/**
 * Firebase Push Notification Service
 */
export class FirebasePushService {
  private static messaging: any = null;
  private static isInitialized = false;

  /**
   * Inizializza il servizio di notifiche Firebase
   */
  static async initialize(): Promise<boolean> {
    try {
      if (this.isInitialized) return true;

      this.messaging = await initializeMessaging();
      
      if (!this.messaging) {
        console.warn('⚠️ Firebase Messaging not available');
        return false;
      }

      // Register service worker
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
          console.log('✅ Service Worker registered:', registration);
        } catch (error) {
          console.error('❌ Service Worker registration failed:', error);
        }
      }

      this.isInitialized = true;
      console.log('🔔 Firebase Push Service initialized');
      return true;
    } catch (error) {
      console.error('❌ Error initializing Firebase Push Service:', error);
      return false;
    }
  }

  /**
   * Richiede il permesso per le notifiche e ottiene il token FCM
   */
  static async getNotificationPermission(): Promise<string | null> {
    try {
      if (!this.messaging) {
        await this.initialize();
        if (!this.messaging) return null;
      }

      // Request notification permission
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        console.log('✅ Notification permission granted');
        
        // Get FCM token
        const token = await getToken(this.messaging, {
          vapidKey: VAPID_KEY
        });
        
        if (token) {
          console.log('🔑 FCM Token:', token);
          return token;
        } else {
          console.warn('⚠️ No FCM token available');
          return null;
        }
      } else {
        console.warn('⚠️ Notification permission denied');
        return null;
      }
    } catch (error) {
      console.error('❌ Error getting notification permission:', error);
      return null;
    }
  }

  /**
   * Imposta il listener per i messaggi in primo piano
   */
  static onForegroundMessage(callback: (payload: any) => void): void {
    if (!this.messaging) {
      console.warn('⚠️ Firebase Messaging not initialized');
      return;
    }

    onMessage(this.messaging, (payload) => {
      console.log('📱 Foreground message received:', payload);
      callback(payload);
    });
  }

  /**
   * Salva il token FCM nel database Supabase
   */
  static async saveTokenToDatabase(userId: string, token: string): Promise<boolean> {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: userId,
          subscription: {
            type: 'fcm',
            token: token,
            endpoint: `https://fcm.googleapis.com/fcm/send/${token}`,
            created_at: new Date().toISOString()
          }
        });

      if (error) {
        console.error('❌ Error saving FCM token to database:', error);
        return false;
      }

      console.log('✅ FCM token saved to database');
      return true;
    } catch (error) {
      console.error('❌ Error in saveTokenToDatabase:', error);
      return false;
    }
  }

  /**
   * Invia una notifica di test
   */
  static async sendTestNotification(title: string, body: string): Promise<void> {
    try {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        
        registration.showNotification(title, {
          body: body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: 'test-notification',
          requireInteraction: true
        });
      }
    } catch (error) {
      console.error('❌ Error sending test notification:', error);
    }
  }
}