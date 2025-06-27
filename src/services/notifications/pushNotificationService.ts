
import { supabase } from '@/integrations/supabase/client';

export interface PushNotificationData {
  title: string;
  body: string;
  data?: any;
  icon?: string;
  badge?: string;
  tag?: string;
}

export class PushNotificationService {
  private static swRegistration: ServiceWorkerRegistration | null = null;

  /**
   * Inizializza il service worker per le notifiche push
   */
  static async initialize(): Promise<boolean> {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('⚠️ Push notifications not supported');
        return false;
      }

      // Registra il service worker
      this.swRegistration = await navigator.serviceWorker.register('/sw.js');
      console.log('✅ Service Worker registrato:', this.swRegistration);

      return true;
    } catch (error) {
      console.error('❌ Errore inizializzazione service worker:', error);
      return false;
    }
  }

  /**
   * Richiede il permesso per le notifiche push
   */
  static async requestPermission(): Promise<boolean> {
    try {
      if (!('Notification' in window)) {
        console.warn('⚠️ Notifications not supported');
        return false;
      }

      const permission = await Notification.requestPermission();
      console.log('🔔 Permesso notifiche:', permission);

      return permission === 'granted';
    } catch (error) {
      console.error('❌ Errore richiesta permesso:', error);
      return false;
    }
  }

  /**
   * Sottoscrive l'utente alle notifiche push
   */
  static async subscribeUser(userId: string): Promise<boolean> {
    try {
      if (!this.swRegistration) {
        await this.initialize();
      }

      if (!this.swRegistration) {
        throw new Error('Service Worker non disponibile');
      }

      const subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlB64ToUint8Array(
          // Chiave pubblica VAPID - dovrebbe essere configurata nelle secrets
          'BEl62iUYgUivxIkv69yViEuiBIa40HI6VH8I5_9S7fVgWCzD6V5nHJPKdD2CnwGmPYpwB8lBhyAhCJCzZuJv9Hs'
        )
      });

      // Salva la subscription nel database
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: userId,
          subscription: subscription.toJSON(),
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('❌ Errore salvataggio subscription:', error);
        return false;
      }

      console.log('✅ Utente sottoscritto alle notifiche push');
      return true;

    } catch (error) {
      console.error('❌ Errore sottoscrizione push:', error);
      return false;
    }
  }

  /**
   * Invia una notifica push locale (per test)
   */
  static async sendLocalNotification(data: PushNotificationData): Promise<boolean> {
    try {
      if (Notification.permission !== 'granted') {
        console.warn('⚠️ Permesso notifiche non concesso');
        return false;
      }

      new Notification(data.title, {
        body: data.body,
        icon: data.icon || '/lovable-uploads/72d5a60c-404a-4167-9430-511af91c523b.png',
        badge: data.badge,
        tag: data.tag,
        data: data.data
      });

      return true;
    } catch (error) {
      console.error('❌ Errore invio notifica locale:', error);
      return false;
    }
  }

  /**
   * Converte la chiave VAPID da base64 a Uint8Array
   */
  private static urlB64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}
