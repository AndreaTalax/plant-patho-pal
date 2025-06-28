
import { useState, useEffect } from 'react';
import { PushNotificationService } from '@/services/notifications/pushNotificationService';
import { useAuth } from '@/context/AuthContext';

export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { userProfile } = useAuth();

  useEffect(() => {
    // Verifica il supporto per le notifiche push
    const checkSupport = () => {
      const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
      setIsSupported(supported);
      
      if (supported) {
        setPermission(Notification.permission);
      }
    };

    checkSupport();
    
    // Inizializza il service worker
    if (isSupported) {
      PushNotificationService.initialize();
    }
  }, [isSupported]);

  const requestPermission = async () => {
    setIsLoading(true);
    try {
      const granted = await PushNotificationService.requestPermission(userProfile?.email);
      
      if (granted) {
        setPermission('granted');
        console.log('✅ Permesso notifiche concesso');
      } else {
        setPermission('denied');
        console.log('❌ Permesso notifiche negato');
      }
      
      return granted;
    } catch (error) {
      console.error('❌ Errore richiesta permesso:', error);
      setPermission('denied');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const subscribe = async () => {
    if (!userProfile?.id) {
      console.error('❌ Nessun utente autenticato');
      return false;
    }

    setIsLoading(true);
    try {
      const success = await PushNotificationService.subscribeUser(userProfile.id, userProfile.email);
      setIsSubscribed(success);
      
      if (success) {
        console.log('✅ Sottoscrizione push completata');
      } else {
        console.log('❌ Sottoscrizione push fallita');
      }
      
      return success;
    } catch (error) {
      console.error('❌ Errore sottoscrizione:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const sendTestNotification = async () => {
    const success = await PushNotificationService.sendLocalNotification({
      title: 'Test Dr.Plant',
      body: 'Le notifiche push sono attive!',
      icon: '/lovable-uploads/72d5a60c-404a-4167-9430-511af91c523b.png'
    });

    return success;
  };

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    requestPermission,
    subscribe,
    sendTestNotification
  };
};
