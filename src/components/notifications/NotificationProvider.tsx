
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

interface NotificationContextType {
  // Add notification context properties as needed
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Safely check if we're inside AuthProvider before using useAuth
  let auth = null;
  
  try {
    auth = useAuth();
  } catch (error) {
    // If useAuth fails (outside AuthProvider), we'll handle it gracefully
    console.log('🔄 NotificationProvider initializing without auth context');
  }

  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Only initialize notifications if we have auth context
    if (auth?.user) {
      console.log('🔔 Initializing notifications for user:', auth.user.email);
      // Initialize notification logic here when needed
    }
    setIsInitialized(true);
  }, [auth?.user]);

  const value: NotificationContextType = {
    // Notification context values
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
