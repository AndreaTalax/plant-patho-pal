
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MARCO_NIGRO_ID } from '@/components/phytopathologist';

export const useExpertPresence = () => {
  const [isExpertOnline, setIsExpertOnline] = useState(false);
  const [expertLastSeen, setExpertLastSeen] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔄 Setting up expert presence tracking...');
    
    // Create a presence channel for the expert
    const expertPresenceChannel = supabase.channel(`expert-presence:${MARCO_NIGRO_ID}`, {
      config: {
        presence: {
          key: MARCO_NIGRO_ID,
        },
      },
    });

    // Listen for presence changes
    expertPresenceChannel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = expertPresenceChannel.presenceState();
        const expertPresence = presenceState[MARCO_NIGRO_ID];
        const isOnline = expertPresence && expertPresence.length > 0;
        
        console.log('👨‍⚕️ Expert presence sync:', { isOnline, presenceState });
        setIsExpertOnline(isOnline);
        
        if (isOnline) {
          setExpertLastSeen(new Date().toISOString());
        }
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        if (key === MARCO_NIGRO_ID) {
          console.log('👨‍⚕️ Expert joined:', newPresences);
          setIsExpertOnline(true);
          setExpertLastSeen(new Date().toISOString());
        }
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        if (key === MARCO_NIGRO_ID) {
          console.log('👨‍⚕️ Expert left:', leftPresences);
          setIsExpertOnline(false);
          setExpertLastSeen(new Date().toISOString());
        }
      })
      .subscribe();

    return () => {
      console.log('🔌 Cleaning up expert presence tracking...');
      supabase.removeChannel(expertPresenceChannel);
    };
  }, []);

  return {
    isExpertOnline,
    expertLastSeen
  };
};
