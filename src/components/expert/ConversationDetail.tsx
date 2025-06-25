
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Send, User, Bot } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  recipient_id: string;
  sent_at: string;
  image_url?: string;
}

interface ConversationDetailProps {
  conversationId: string;
  onBack: () => void;
  userProfile?: {
    first_name?: string;
    last_name?: string;
    email?: string;
  };
}

export const ConversationDetail: React.FC<ConversationDetailProps> = ({
  conversationId,
  onBack,
  userProfile
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadMessages();
    getCurrentUser();
    
    // Setup realtime subscription
    const channel = supabase.channel(`conversation_${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          console.log('Nuovo messaggio ricevuto:', payload.new);
          setMessages(prev => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
  };

  const loadMessages = async () => {
    try {
      console.log('Caricamento messaggi per conversazione:', conversationId);
      
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('sent_at', { ascending: true });

      if (error) {
        console.error('Errore caricamento messaggi:', error);
        toast.error('Errore nel caricamento dei messaggi');
        return;
      }

      console.log('Messaggi caricati:', messages);
      setMessages(messages || []);
    } catch (error) {
      console.error('Errore:', error);
      toast.error('Errore nel caricamento della conversazione');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUserId) return;

    setSending(true);
    try {
      const { error } = await supabase.functions.invoke('send-message', {
        body: {
          conversationId,
          recipientId: messages[0]?.sender_id === currentUserId ? messages[0]?.recipient_id : messages[0]?.sender_id,
          text: newMessage.trim()
        }
      });

      if (error) {
        console.error('Errore invio messaggio:', error);
        toast.error('Errore nell\'invio del messaggio');
        return;
      }

      setNewMessage('');
      toast.success('Messaggio inviato');
    } catch (error) {
      console.error('Errore:', error);
      toast.error('Errore nell\'invio del messaggio');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isExpertMessage = (message: Message) => {
    // Considera messaggio dell'esperto se il sender è l'utente corrente (Marco)
    return message.sender_id === currentUserId;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-drplant-green mx-auto mb-4"></div>
          <p>Caricamento conversazione...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b bg-white">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h3 className="font-semibold">
            Chat con {userProfile?.first_name} {userProfile?.last_name}
          </h3>
          <p className="text-sm text-gray-500">{userProfile?.email}</p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p>Nessun messaggio in questa conversazione</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${isExpertMessage(message) ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    isExpertMessage(message)
                      ? 'bg-drplant-blue text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {isExpertMessage(message) ? (
                      <Bot className="h-4 w-4" />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                    <span className="text-xs opacity-75">
                      {isExpertMessage(message) ? 'Marco (Esperto)' : 'Utente'}
                    </span>
                  </div>
                  <p className="text-sm">{message.content}</p>
                  {message.image_url && (
                    <img 
                      src={message.image_url} 
                      alt="Allegato" 
                      className="mt-2 max-w-full h-auto rounded"
                    />
                  )}
                  <p className="text-xs opacity-75 mt-1">
                    {formatTime(message.sent_at)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="p-4 border-t bg-white">
        <div className="flex gap-2">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Scrivi una risposta..."
            className="flex-1 min-h-[60px] resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          <Button 
            onClick={sendMessage} 
            disabled={!newMessage.trim() || sending}
            className="self-end"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
