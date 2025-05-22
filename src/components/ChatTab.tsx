
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import ExpertChatView from './chat/ExpertChatView';
import UserChatView from './chat/UserChatView';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const ChatTab = () => {
  const { userProfile, isMasterAccount } = useAuth();
  const [refreshKey, setRefreshKey] = useState(Date.now());
  
  // Force refresh when switching tabs or on chat issues
  useEffect(() => {
    const handleRefreshChat = () => {
      setRefreshKey(Date.now());
    };
    
    window.addEventListener('refreshChat', handleRefreshChat);
    
    // Set up subscription for chat changes
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        () => {
          // Refresh the chat when messages change
          setRefreshKey(Date.now());
        }
      )
      .subscribe();
      
    return () => {
      window.removeEventListener('refreshChat', handleRefreshChat);
      supabase.removeChannel(channel);
    };
  }, []);
  
  // Early return if no user is logged in
  if (!userProfile) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-gray-500">Please log in to access the chat</p>
      </div>
    );
  }
  
  // Render expert view for master account, user view for regular users
  return (
    <div className="flex flex-col min-h-full pt-3 pb-24">
      {isMasterAccount ? (
        <ExpertChatView key={`expert-${refreshKey}-${userProfile.email}`} userId={userProfile.email} />
      ) : (
        <UserChatView key={`user-${refreshKey}-${userProfile.email}`} userId={userProfile.email} />
      )}
    </div>
  );
};

export default ChatTab;
