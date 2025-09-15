import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useToast } from '@/hooks/use-toast';

export function PushNotificationManager() {
  const { userProfile } = useAuth();
  const { isSupported, permission, requestPermission, subscribe } = usePushNotifications();
  const { toast } = useToast();

  useEffect(() => {
    if (!userProfile || !isSupported) return;

    const setupPushNotifications = async () => {
      try {
        // Automatically request permission and subscribe for authenticated users
        if (permission === 'default') {
          console.log('🔔 Requesting push notification permission');
          const granted = await requestPermission();
          
          if (granted) {
            console.log('✅ Push notification permission granted');
            await subscribe();
            
            toast({
              title: "🔔 Notifiche attivate",
              description: "Riceverai notifiche per i nuovi messaggi di chat",
              duration: 3000,
            });
          } else {
            console.log('❌ Push notification permission denied');
          }
        } else if (permission === 'granted') {
          // If permission already granted, ensure subscription
          await subscribe();
        }
      } catch (error) {
        console.error('❌ Error setting up push notifications:', error);
      }
    };

    setupPushNotifications();
  }, [userProfile, isSupported, permission, requestPermission, subscribe, toast]);

  // Listen for messages from service worker
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'NOTIFICATION_CLICKED') {
        console.log('🔔 Notification clicked, navigating to chat:', event.data.data);
        
        // Navigate to chat if conversation data is available
        if (event.data.data?.conversationId) {
          window.location.href = `/?conversation=${event.data.data.conversationId}`;
        }
      }
    };

    navigator.serviceWorker?.addEventListener('message', handleMessage);
    
    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleMessage);
    };
  }, []);

  return null; // This is a background manager component
}