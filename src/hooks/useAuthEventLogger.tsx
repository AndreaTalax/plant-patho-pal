
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useAuthEventLogger = () => {
  useEffect(() => {
    console.log('Setting up auth event logger...');
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const timestamp = new Date().toISOString();
      
      switch (event) {
        case 'SIGNED_IN':
          console.log(`🟢 [${timestamp}] AUTH EVENT: User signed in`, {
            event,
            userId: session?.user?.id,
            email: session?.user?.email,
            emailConfirmed: session?.user?.email_confirmed_at ? 'Yes' : 'No',
            session: !!session
          });
          break;
          
        case 'SIGNED_OUT':
          console.log(`🔴 [${timestamp}] AUTH EVENT: User signed out`, { event });
          break;
          
        case 'USER_UPDATED':
          console.log(`🟡 [${timestamp}] AUTH EVENT: User updated`, {
            event,
            userId: session?.user?.id,
            email: session?.user?.email,
            emailConfirmed: session?.user?.email_confirmed_at ? 'Yes' : 'No'
          });
          break;
          
        case 'PASSWORD_RECOVERY':
          console.log(`🟠 [${timestamp}] AUTH EVENT: Password recovery initiated`, {
            event,
            email: session?.user?.email
          });
          break;
          
        case 'TOKEN_REFRESHED':
          console.log(`🔄 [${timestamp}] AUTH EVENT: Token refreshed`, {
            event,
            userId: session?.user?.id,
            email: session?.user?.email
          });
          break;
          
        default:
          console.log(`ℹ️ [${timestamp}] AUTH EVENT: ${event}`, {
            event,
            userId: session?.user?.id,
            email: session?.user?.email,
            hasSession: !!session
          });
      }
      
      // Log any auth errors that might occur
      if (event === 'SIGNED_IN' && !session) {
        console.error(`❌ [${timestamp}] AUTH ERROR: Sign in event fired but no session available`);
      }
    });

    return () => {
      console.log('Cleaning up auth event logger...');
      subscription.unsubscribe();
    };
  }, []);
};
