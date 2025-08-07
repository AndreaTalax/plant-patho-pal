import React, { useEffect } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAuth } from '@/context/AuthContext';

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { userProfile } = useAuth();
  const { isSupported, permission } = usePushNotifications();

  useEffect(() => {
    if (userProfile && isSupported) {
      console.log('🔔 Notification Status:', {
        userId: userProfile.id,
        email: userProfile.email,
        supported: isSupported,
        permissionGranted: permission === 'granted'
      });
    }
  }, [userProfile, isSupported, permission]);

  return <>{children}</>;
}