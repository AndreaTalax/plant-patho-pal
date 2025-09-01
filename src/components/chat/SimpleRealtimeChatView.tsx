
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import ChatHeader from './user/ChatHeader';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface SimpleRealtimeChatViewProps {
  userId: string;
  conversationId: string;
  onBackToList: () => void;
}

export const SimpleRealtimeChatView: React.FC<SimpleRealtimeChatViewProps> = ({
  userId,
  conversationId,
  onBackToList
}) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('sent_at', { ascending: true });

        if (error) {
          console.error('Error loading messages:', error);
        } else {
          setMessages(data || []);
        }
      } catch (error) {
        console.error('Error in loadMessages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          console.log('Real-time message update:', payload);
          if (payload.eventType === 'INSERT') {
            setMessages(prev => [...prev, payload.new]);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [conversationId]);

  const handleSendMessage = async (content: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: userId,
          recipient_id: 'marco_nigro_id',
          content,
          sent_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error sending message:', error);
      }
    } catch (error) {
      console.error('Error in handleSendMessage:', error);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 p-4 border-b bg-white">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBackToList}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <h2 className="font-semibold">Chat con Marco Nigro</h2>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            Test Mode
          </Badge>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-drplant-green"></div>
          </div>
        ) : (
          <MessageList 
            messages={messages}
            currentUserId={userId}
            isLoading={false}
          />
        )}
      </div>

      <MessageInput
        conversationId={conversationId}
        senderId={userId}
        recipientId="marco_nigro_id"
        onSendMessage={handleSendMessage}
      />
    </div>
  );
};
