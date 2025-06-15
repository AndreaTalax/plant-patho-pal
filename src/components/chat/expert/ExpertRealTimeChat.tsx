import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client'; 
import { RealTimeChatWrapper } from '../RealTimeChatWrapper';
import ChatMessage from '../ChatMessage';
import MessageInput from '../MessageInput';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Users, Clock } from 'lucide-react';
import { MARCO_NIGRO_ID } from '@/components/phytopathologist';

interface ConversationListItem {
  id: string;
  title: string;
  last_message_text: string;
  last_message_at: string;
  unread_count: number;
  user_profile: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
}

export const ExpertRealTimeChat: React.FC = () => {
  const { userProfile } = useAuth();
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load conversations list
  const loadConversations = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Recupera tutte le conversazioni dell’esperto
      const response = await fetch('/api/get-conversations', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      const result = await response.json();

      if (response.ok && Array.isArray(result.conversations)) {
        // Miglioramento: carica per ogni conversazione l’ultimo messaggio vero, cat non quello filtrato solo per l’utente
        const conversationsWithLastMessage = await Promise.all(result.conversations.map(async (conv: any) => {
          // Find last relevant message (inclusi autoSent)
          let lastMessageText = conv.last_message_text;
          let lastMessageAt = conv.last_message_at;
          let unread_count = conv.unread_count || 0;

          // Fallback: se non c’è un message brevity, prendi l’ultimo dalla tabella messages, anche se autoSent
          if (!lastMessageText) {
            const { data: messages } = await supabase
              .from('messages')
              .select('content, sent_at, metadata')
              .eq('conversation_id', conv.id)
              .order('sent_at', { ascending: false })
              .limit(1);
            if (messages && messages.length > 0) {
              lastMessageText = messages[0].content || '';
              lastMessageAt = messages[0].sent_at;
              // Se è un messaggio autoSent, aggiungi badge
              const metadata = messages[0].metadata;
              if (
                metadata &&
                typeof metadata === "object" &&
                !Array.isArray(metadata) &&
                (
                  (metadata as any).type === "consultation_data" ||
                  (metadata as any).autoSent === true
                )
              ) {
                lastMessageText = "🟢 Dati inviati automaticamente dal paziente";
              }
            }
          }

          // Retrieve user profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name, avatar_url')
            .eq('id', conv.user_profile?.id || conv.user_id)
            .maybeSingle();

          return {
            ...conv,
            last_message_text: lastMessageText,
            last_message_at: lastMessageAt,
            unread_count,
            user_profile: profile || conv.user_profile
          }
        }));
        setConversations(conversationsWithLastMessage);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  // --- SUBSCRIPTION CANALE REALTIME NOTIFICHE ---
  useEffect(() => {
    // Iscrizione solo se loggato come Marco Nigro
    if (userProfile?.id !== MARCO_NIGRO_ID) return;
    const channel = supabase.channel(`expert-notifications:${MARCO_NIGRO_ID}`);
    channel.on("broadcast", { event: "new_plant_consultation" }, (payload) => {
      // Log notifica e aggiorna conversazioni
      console.log("[Expert] Notifica realtime ricevuta:", payload);
      loadConversations();
    }).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line
  }, [userProfile]);

  useEffect(() => {
    if (userProfile?.id === MARCO_NIGRO_ID) {
      loadConversations();
    }
  }, [userProfile]);

  if (userProfile?.id !== MARCO_NIGRO_ID) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">Accesso negato. Solo Marco Nigro può accedere a questa sezione.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Conversations List */}
      <div className="w-1/3 border-r border-gray-200 bg-gray-50">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-drplant-green" />
            <h2 className="text-lg font-semibold">Conversazioni Clienti</h2>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {conversations.length} conversazioni attive
          </p>
        </div>

        <div className="overflow-y-auto">
          {loading ? (
            <div className="p-4">
              <p className="text-gray-500">Caricamento conversazioni...</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-4">
              <p className="text-gray-500">Nessuna conversazione attiva</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => setSelectedConversationId(conv.id)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-white transition-colors ${
                  selectedConversationId === conv.id ? 'bg-white border-l-4 border-l-drplant-green' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900">
                        {conv.user_profile?.first_name} {conv.user_profile?.last_name}
                      </h3>
                      {conv.unread_count > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {conv.unread_count}
                        </Badge>
                      )}
                      {/* Badge se è messaggio autosent */}
                      {conv.last_message_text?.startsWith("🟢") && (
                        <Badge variant="outline" className="text-xs text-green-700 border-green-400">Dati auto</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 truncate mt-1">
                      {conv.last_message_text || 'Nessun messaggio'}
                    </p>
                    <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      {conv.last_message_at ? new Date(conv.last_message_at).toLocaleString('it-IT') : ''}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversationId ? (
          <RealTimeChatWrapper
            conversationId={selectedConversationId}
            userId={userProfile.id}
          >
            {({ messages, isConnected, sendMessage }) => (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 bg-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-5 w-5 text-drplant-green" />
                      <h3 className="font-medium">Conversazione Attiva</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className="text-sm text-gray-600">
                        {isConnected ? 'Connesso' : 'Disconnesso'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => (
                    <ChatMessage 
                      key={message.id} 
                      message={message} 
                      isExpertView={true}
                    />
                  ))}
                </div>

                {/* Message Input */}
                <MessageInput
                  conversationId={selectedConversationId}
                  senderId={userProfile.id}
                  recipientId={conversations.find(c => c.id === selectedConversationId)?.user_profile?.id || ''}
                  onSendMessage={async (text: string) => {
                    const recipientId = conversations.find(c => c.id === selectedConversationId)?.user_profile?.id;
                    if (recipientId) {
                      await sendMessage(recipientId, text);
                    }
                  }}
                  isMasterAccount={true}
                />
              </>
            )}
          </RealTimeChatWrapper>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <Card className="w-96">
              <CardHeader>
                <CardTitle className="text-center flex items-center justify-center gap-2">
                  <MessageCircle className="h-6 w-6 text-drplant-green" />
                  Seleziona una Conversazione
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-gray-600">
                  Scegli una conversazione dalla lista per iniziare a chattare con i tuoi pazienti.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
