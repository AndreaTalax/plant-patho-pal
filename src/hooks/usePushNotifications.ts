
import { useEffect, useState } from 'react';
import { PushNotificationService } from '@/services/notifications/pushNotificationService';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const { user } = useAuth();

  useEffect(() => {
    const initializePushNotifications = async () => {
      // Verifica supporto
      const supported = 'serviceWorker' in navigator && 'PushManager' in window;
      setIsSupported(supported);

      if (!supported) {
        console.warn('⚠️ Push notifications non supportate');
        return;
      }

      // Inizializza service worker
      const initialized = await PushNotificationService.initialize();
      if (!initialized) {
        console.error('❌ Impossibile inizializzare service worker');
        return;
      }

      // Controlla permesso attuale
      if ('Notification' in window) {
        setPermission(Notification.permission);
      }
    };

    initializePushNotifications();
  }, []);

  const requestPermission = async (): Promise<boolean> => {
    try {
      const granted = await PushNotificationService.requestPermission();
      setPermission(Notification.permission);
      
      if (granted && user) {
        const subscribed = await PushNotificationService.subscribeUser(user.id);
        setIsSubscribed(subscribed);
        
        if (subscribed) {
          toast.success('Notifiche push attivate!', {
            description: 'Riceverai notifiche per i nuovi messaggi'
          });
        }
        
        return subscribed;
      }
      
      return granted;
    } catch (error) {
      console.error('❌ Errore richiesta permesso push:', error);
      toast.error('Errore attivazione notifiche push');
      return false;
    }
  };

  const sendTestNotification = async () => {
    await PushNotificationService.sendLocalNotification({
      title: 'Dr.Plant - Test',
      body: 'Le notifiche push funzionano correttamente!',
      tag: 'test-notification'
    });
  };

  return {
    isSupported,
    isSubscribed,
    permission,
    requestPermission,
    sendTestNotification
  };
};
