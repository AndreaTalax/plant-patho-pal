import { useEffect, useState } from 'react';
import { FirebasePushService } from '@/services/firebasePushService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

export interface NotificationPayload {
  notification?: {
    title: string;
    body: string;
    icon?: string;
  };
  data?: {
    type: string;
    conversationId?: string;
    messageId?: string;
    url?: string;
    [key: string]: any;
  };
}

export function useFirebaseNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const { user } = useAuth();

  // Initialize Firebase messaging
  useEffect(() => {
    const initializeFirebase = async () => {
      try {
        const initialized = await FirebasePushService.initialize();
        setIsSupported(initialized);
        setIsInitialized(true);
        
        if (initialized) {
          console.log('🔔 Firebase notifications initialized');
        }
      } catch (error) {
        console.error('❌ Error initializing Firebase notifications:', error);
        setIsInitialized(true);
      }
    };

    initializeFirebase();
  }, []);

  // Request permission and get token when user is available
  useEffect(() => {
    const setupNotifications = async () => {
      if (!isSupported || !user || !isInitialized) return;

      try {
        // Check current permission status
        const permission = Notification.permission;
        setIsPermissionGranted(permission === 'granted');

        if (permission === 'granted') {
          // Get FCM token
          const token = await FirebasePushService.getNotificationPermission();
          
          if (token) {
            setFcmToken(token);
            
            // Save token to database
            const saved = await FirebasePushService.saveTokenToDatabase(user.id, token);
            
            if (saved) {
              console.log('✅ FCM token saved to database');
              toast.success('Notifiche push attivate');
            }
          }
        }
      } catch (error) {
        console.error('❌ Error setting up notifications:', error);
      }
    };

    setupNotifications();
  }, [isSupported, user, isInitialized]);

  // Set up foreground message listener
  useEffect(() => {
    if (!isSupported) return;

    FirebasePushService.onForegroundMessage((payload: NotificationPayload) => {
      console.log('📱 Foreground notification received:', payload);
      
      // Show toast notification when app is in foreground
      const title = payload.notification?.title || 'Nuova notifica';
      const body = payload.notification?.body || 'Hai ricevuto una notifica';
      
      toast(title, {
        description: body,
        action: payload.data?.url ? {
          label: 'Visualizza',
          onClick: () => {
            if (payload.data?.url) {
              window.location.href = payload.data.url;
            }
          }
        } : undefined,
        duration: 5000
      });

      // Handle specific notification types
      if (payload.data?.type === 'chat_message') {
        handleChatNotification(payload.data);
      }
    });
  }, [isSupported]);

  // Listen for notification clicks from service worker
  useEffect(() => {
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data?.type === 'NOTIFICATION_CLICKED') {
        console.log('🔔 Notification clicked:', event.data);
        
        // Handle notification click
        const data = event.data.data;
        if (data?.type === 'chat_message' && data?.conversationId) {
          // Navigate to chat conversation
          window.location.href = `/?conversation=${data.conversationId}`;
        }
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
      
      return () => {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      };
    }
  }, []);

  const handleChatNotification = (data: any) => {
    console.log('💬 Handling chat notification:', data);
    
    // You can add custom logic here, such as:
    // - Update chat UI
    // - Play notification sound
    // - Update badge count
    
    // Example: Update unread count in localStorage
    if (data.conversationId) {
      const unreadKey = `unread_${data.conversationId}`;
      const currentUnread = parseInt(localStorage.getItem(unreadKey) || '0');
      localStorage.setItem(unreadKey, (currentUnread + 1).toString());
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    try {
      if (!isSupported || !user) {
        toast.error('Notifiche non supportate');
        return false;
      }

      const token = await FirebasePushService.getNotificationPermission();
      
      if (token) {
        setFcmToken(token);
        setIsPermissionGranted(true);
        
        // Save token to database
        const saved = await FirebasePushService.saveTokenToDatabase(user.id, token);
        
        if (saved) {
          toast.success('Notifiche push attivate con successo');
          return true;
        } else {
          toast.error('Errore nel salvare il token di notifica');
          return false;
        }
      } else {
        toast.error('Permesso notifiche negato');
        return false;
      }
    } catch (error) {
      console.error('❌ Error requesting notification permission:', error);
      toast.error('Errore nell\'attivare le notifiche');
      return false;
    }
  };

  const sendTestNotification = async () => {
    try {
      if (!fcmToken || !user) {
        toast.error('Token FCM non disponibile');
        return;
      }

      // Send test notification via edge function
      const response = await fetch(`${window.location.origin}/.netlify/functions/invoke-supabase-function`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          functionName: 'send-firebase-notification',
          payload: {
            recipientUserId: user.id,
            title: '🧪 Notifica di Test',
            body: 'Questa è una notifica di test per verificare il funzionamento',
            data: {
              type: 'test',
              url: '/'
            }
          }
        })
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('Notifica di test inviata');
      } else {
        toast.error('Errore nell\'invio della notifica di test');
      }
    } catch (error) {
      console.error('❌ Error sending test notification:', error);
      toast.error('Errore nell\'invio della notifica di test');
    }
  };

  return {
    isSupported,
    isPermissionGranted,
    isInitialized,
    fcmToken,
    requestPermission,
    sendTestNotification
  };
}