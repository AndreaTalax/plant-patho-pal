
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
        
        if (isOnline && expertPresence[0] && expertPresence[0].online_at) {
          setExpertLastSeen(expertPresence[0].online_at);
        }
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        if (key === MARCO_NIGRO_ID) {
          console.log('👨‍⚕️ Expert joined:', newPresences);
          setIsExpertOnline(true);
          if (newPresences[0] && newPresences[0].online_at) {
            setExpertLastSeen(newPresences[0].online_at);
          }
        }
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        if (key === MARCO_NIGRO_ID) {
          console.log('👨‍⚕️ Expert left:', leftPresences);
          setIsExpertOnline(false);
          if (leftPresences[0] && leftPresences[0].online_at) {
            setExpertLastSeen(leftPresences[0].online_at);
          }
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
