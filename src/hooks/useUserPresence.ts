
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useUserPresence = () => {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    let sessionId: string | null = null;
    let heartbeatInterval: NodeJS.Timeout | null = null;

    const initializePresence = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          console.log('👤 No user session found');
          return;
        }

        // Generate a unique session ID
        sessionId = `${session.user.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        console.log('👤 Initializing user presence for:', session.user.id);
        console.log('🔑 Session ID:', sessionId);

        // Create a new session record
        const { error: sessionError } = await supabase
          .from('user_sessions')
          .insert({
            user_id: session.user.id,
            session_id: sessionId,
            is_active: true,
            last_activity_at: new Date().toISOString()
          });

        if (sessionError) {
          console.error('❌ Error creating user session:', sessionError);
          // Don't show error to user, just log it
          return;
        }

        console.log('✅ User session created successfully');

        // Set up heartbeat to keep session alive
        heartbeatInterval = setInterval(async () => {
          if (!sessionId) return;

          try {
            const { error: updateError } = await supabase
              .from('user_sessions')
              .update({
                last_activity_at: new Date().toISOString()
              })
              .eq('session_id', sessionId)
              .eq('user_id', session.user.id);

            if (updateError) {
              console.error('❌ Error updating session heartbeat:', updateError);
            } else {
              console.log('💓 Session heartbeat updated');
            }
          } catch (error) {
            console.error('❌ Heartbeat error:', error);
          }
        }, 60000); // Update every minute

        setIsInitialized(true);

      } catch (error) {
        console.error('❌ Error initializing presence:', error);
      }
    };

    const cleanupPresence = async () => {
      if (!sessionId) {
        console.log('🔄 No session ID to cleanup');
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          console.log('🧹 Cleaning up user presence for session:', sessionId);
          
          // Mark session as inactive with better error handling
          const { error } = await supabase
            .from('user_sessions')
            .update({
              is_active: false,
              last_activity_at: new Date().toISOString()
            })
            .eq('session_id', sessionId)
            .eq('user_id', session.user.id);

          if (error) {
            // Log error but don't throw - this prevents the "Error cleaning up session" message
            console.warn('⚠️ Warning during session cleanup (non-critical):', error.message);
          } else {
            console.log('✅ Session cleaned up successfully');
          }
        } else {
          console.log('🔄 No active session found during cleanup');
        }
      } catch (error) {
        // Log error but don't throw - this prevents the "Error cleaning up session" message
        console.warn('⚠️ Warning during cleanup (non-critical):', error);
      }

      // Always clear the interval regardless of cleanup success
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
        console.log('🔄 Heartbeat interval cleared');
      }
      
      // Reset session ID
      sessionId = null;
    };

    // Initialize presence
    initializePresence();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔐 Auth state changed:', event);
      
      if (event === 'SIGNED_OUT') {
        cleanupPresence();
        setIsInitialized(false);
      } else if (event === 'SIGNED_IN' && session) {
        // Cleanup old session first, then initialize new one
        cleanupPresence().then(() => {
          setTimeout(initializePresence, 1000);
        });
      }
    });

    // Cleanup on page unload with improved error handling
    const handleBeforeUnload = () => {
      try {
        cleanupPresence();
      } catch (error) {
        console.warn('⚠️ Warning during page unload cleanup:', error);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup function
    return () => {
      try {
        cleanupPresence();
        subscription.unsubscribe();
        window.removeEventListener('beforeunload', handleBeforeUnload);
      } catch (error) {
        console.warn('⚠️ Warning during final cleanup:', error);
      }
    };
  }, []);

  return { isInitialized };
};
