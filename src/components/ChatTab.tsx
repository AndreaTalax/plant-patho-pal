
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePlantInfo } from '@/context/PlantInfoContext';
import ExpertChatView from './chat/ExpertChatView';
import UserChatView from './chat/UserChatView';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { EXPERT } from '@/components/chat/types';

/**
 * Provides chat interface with refresh handling and user-specific views
 * @example
 * chatTab()
 * Renders chat based on user profile or displays a login prompt
 * @returns {JSX.Element} Renders expert or user view of the chat interface depending on account type.
 * @description
 *   - Uses two Supabase channels to listen for changes in messages and conversations.
 *   - Forces chat refresh upon tab switches or chat issues.
 *   - Resets synced state when plant information is incomplete.
 *   - Renders login prompt if no user is logged in.
 */
const ChatTab = () => {
  const { userProfile, isMasterAccount } = useAuth();
  const { plantInfo } = usePlantInfo();
  const [refreshKey, setRefreshKey] = useState(Date.now());
  const [synced, setSynced] = useState(false);
  
  // Force refresh when switching tabs or on chat issues
  useEffect(() => {
    const handleRefreshChat = () => {
      console.log("Forcing chat refresh...");
      setRefreshKey(Date.now());
    };
    
    const handleTabSwitch = (event: any) => {
      if (event.detail === 'chat') {
        console.log("Switching to chat tab, refreshing...");
        setRefreshKey(Date.now());
      }
    };
    
    window.addEventListener('refreshChat', handleRefreshChat);
    window.addEventListener('switchTab', handleTabSwitch);
    
    // Set up subscription for chat changes
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        (payload) => {
          // Refresh the chat when messages change
          console.log('Message change detected:', payload.eventType);
          setRefreshKey(Date.now());
        }
      )
      .subscribe();
      
    // Also subscribe to conversation changes
    const conversationsChannel = supabase
      .channel('conversations-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations' },
        (payload) => {
          console.log('Conversation change detected:', payload.eventType);
          setRefreshKey(Date.now());
        }
      )
      .subscribe();
      
    return () => {
      window.removeEventListener('refreshChat', handleRefreshChat);
      window.removeEventListener('switchTab', handleTabSwitch);
      supabase.removeChannel(channel);
      supabase.removeChannel(conversationsChannel);
    };
  }, []);
  
  // Reset synced state when plant info changes
  useEffect(() => {
    if (plantInfo && !plantInfo.infoComplete) {
      setSynced(false);
    }
  }, [plantInfo]);
  
  // Early return if no user is logged in
  if (!userProfile || !userProfile.id) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-gray-500">Accedi per utilizzare la chat</p>
      </div>
    );
  }
  
  // Render expert view for master account, user view for regular users
  return (
    <div className="flex flex-col min-h-full pt-3 pb-24">
      {isMasterAccount ? (
        <ExpertChatView key={`expert-${refreshKey}-${userProfile.id}`} userId={userProfile.id} />
      ) : (
        <UserChatView key={`user-${refreshKey}-${userProfile.id}`} userId={userProfile.id} />
      )}
    </div>
  );
};

export default ChatTab;
