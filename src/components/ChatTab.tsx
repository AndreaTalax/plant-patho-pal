
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePlantInfo } from '@/context/PlantInfoContext';
import ExpertChatView from './chat/ExpertChatView';
import UserChatView from './chat/UserChatView';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const ChatTab = () => {
  const { userProfile, isMasterAccount } = useAuth();
  const { plantInfo } = usePlantInfo();
  const [refreshKey, setRefreshKey] = useState(Date.now());
  const [synced, setSynced] = useState(false);
  
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
      supabase.removeChannel(channel);
      supabase.removeChannel(conversationsChannel);
    };
  }, []);
  
  // Sync plant information to chat when it changes
  useEffect(() => {
    // Only sync if there's complete plant information and user is logged in
    if (plantInfo.infoComplete && userProfile && userProfile.id && !synced) {
      const syncPlantInfoToChat = async () => {
        try {
          // Find or create a conversation with the expert
          const { data: existingConversation } = await supabase
            .from('conversations')
            .select('id')
            .eq('user_id', userProfile.id)
            .limit(1)
            .single();
            
          let conversationId;
          
          if (existingConversation) {
            conversationId = existingConversation.id;
          } else {
            const { data: newConversation, error: convError } = await supabase
              .from('conversations')
              .insert({
                user_id: userProfile.id,
                expert_id: 'premium-user-id' // Expert ID
              })
              .select()
              .single();
              
            if (convError) {
              console.error("Error creating conversation:", convError);
              return;
            }
            
            conversationId = newConversation.id;
          }
          
          // Prepare message with plant information
          let messageText = "Informazioni sulla pianta:\n";
          messageText += `- Ambiente: ${plantInfo.isIndoor ? 'Interno' : 'Esterno'}\n`;
          messageText += `- Frequenza di irrigazione: ${plantInfo.wateringFrequency || 'Non specificata'} volte/settimana\n`;
          messageText += `- Esposizione alla luce: ${plantInfo.lightExposure || 'Non specificata'}\n`;
          messageText += `- Sintomi: ${plantInfo.symptoms || 'Non specificati'}\n`;
          
          // Send message with plant information
          const { error: msgError } = await supabase
            .from('messages')
            .insert({
              conversation_id: conversationId,
              sender_id: userProfile.id,
              recipient_id: 'premium-user-id', // Expert ID
              text: messageText
            });
            
          if (msgError) {
            console.error("Error sending plant information:", msgError);
            return;
          }
          
          setSynced(true);
          toast("Informazioni sulla pianta inviate all'esperto");
          
          // Refresh chat to show the new message
          setRefreshKey(Date.now());
          
        } catch (error) {
          console.error("Error syncing plant info to chat:", error);
        }
      };
      
      syncPlantInfoToChat();
    }
  }, [plantInfo, userProfile, synced]);
  
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
