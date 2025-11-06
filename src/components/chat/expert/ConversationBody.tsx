
import { useState, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import MessageList from '../MessageList';
import MessageInput from '../MessageInput';
import { Message, Conversation } from '../types';
import { MARCO_NIGRO_ID } from '@/components/phytopathologist';
import { supabase } from '@/integrations/supabase/client';

interface ConversationBodyProps {
  conversation: Conversation & { user_id?: string; expertId?: string };
  isSending: boolean;
  onSendMessage: (text: string) => Promise<void>;
  onOpenProductDialog: () => void;
}

const ConversationBody = ({
  conversation,
  isSending,
  onSendMessage,
  onOpenProductDialog
}: ConversationBodyProps) => {
  const [userProfile, setUserProfile] = useState<{ avatar_url?: string; first_name?: string; last_name?: string; username?: string } | null>(null);

  // Load user profile for avatar
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!conversation.user_id) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('avatar_url, first_name, last_name, username')
          .eq('id', conversation.user_id)
          .single();
        
        if (error) {
          console.error('Error loading user profile:', error);
          return;
        }
        
        setUserProfile(data);
      } catch (error) {
        console.error('Error loading user profile:', error);
      }
    };
    
    loadUserProfile();
  }, [conversation.user_id]);

  // If there are no messages, show empty state
  if (conversation.messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
        <MessageSquare className="h-10 w-10 mb-3 text-gray-300" />
        <p className="text-sm">No messages yet</p>
      </div>
    );
  }

  return (
    <>
      <MessageList 
        messages={conversation.messages}
        isExpertView={true}
        userAvatar={userProfile?.avatar_url}
        userName={userProfile?.first_name && userProfile?.last_name 
          ? `${userProfile.first_name} ${userProfile.last_name}` 
          : userProfile?.username || 'Utente'}
        currentUserId={conversation.expertId || MARCO_NIGRO_ID}
      />
      
      <div className="p-2 border-t bg-white">
        {conversation.blocked ? (
          <div className="p-2 bg-red-50 text-red-600 rounded-md text-center text-sm">
            This user is blocked. Unblock to continue.
          </div>
        ) : (
          <MessageInput
            conversationId={conversation.id}
            senderId={conversation.expertId || MARCO_NIGRO_ID}
            recipientId={conversation.user_id || ''}
            onSendMessage={async (message: string, imageUrl?: string) => {
              await onSendMessage(message);
            }}
            isMasterAccount={true}
            enableAudio={true}
            enableEmoji={true}
          />
        )}
      </div>
    </>
  );
};

export default ConversationBody;
