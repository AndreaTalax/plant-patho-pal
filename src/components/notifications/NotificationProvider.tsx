import React, { useEffect } from 'react';
import { useFirebaseNotifications } from '@/hooks/useFirebaseNotifications';
import { useAuth } from '@/context/AuthContext';

/**
 * Componente wrapper per inizializzare automaticamente le notifiche Firebase
 */
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { isSupported, isPermissionGranted } = useFirebaseNotifications();

  useEffect(() => {
    // Log dello stato delle notifiche quando l'utente è autenticato
    if (user) {
      console.log('🔔 Notification Status:', {
        userId: user.id,
        email: user.email,
        supported: isSupported,
        permissionGranted: isPermissionGranted
      });
    }
  }, [user, isSupported, isPermissionGranted]);

  return <>{children}</>;
}