import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client'; 
import { RealTimeChatWrapper } from '../RealTimeChatWrapper';
import ChatMessage from '../ChatMessage';
import MessageInput from '../MessageInput';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, Users, Clock, Trash2, User } from 'lucide-react';
import { MARCO_NIGRO_ID } from '@/components/phytopathologist';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

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
  const [deletingConversation, setDeletingConversation] = useState<string | null>(null);

  // Load conversations list
  const loadConversations = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Use safer query to get conversations
      const { data: conversationList, error } = await supabase
        .from('conversations')
        .select(`
          *,
          profiles!conversations_user_id_fkey(id, first_name, last_name, avatar_url)
        `)
        .eq('expert_id', MARCO_NIGRO_ID)
        .order('last_message_at', { ascending: false });

      if (error) {
        console.error('❌ Error loading conversations:', error);
        return;
      }

      if (!conversationList || conversationList.length === 0) {
        console.log('🟡 Nessuna conversazione trovata per questo esperto.');
        setConversations([]);
        return;
      }

      // Process conversations with enhanced last message handling
      const conversationsWithLastMessage = await Promise.all(conversationList.map(async (conv: any) => {
        let lastMessageText = conv.last_message_text;
        let lastMessageAt = conv.last_message_at;
        let unread_count = 0; // TODO: Implement proper unread count

        // Fallback: if no last message, get the latest from messages table
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

        return {
          ...conv,
          last_message_text: lastMessageText,
          last_message_at: lastMessageAt,
          unread_count,
          user_profile: conv.profiles || { 
            id: conv.user_id, 
            first_name: 'Utente', 
            last_name: 'Sconosciuto' 
          }
        };
      }));
      
      setConversations(conversationsWithLastMessage);
    } catch (error) {
      console.error('❌ Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Funzione per eliminare conversazione
  const handleDeleteConversation = async (conversationId: string) => {
    try {
      setDeletingConversation(conversationId);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Sessione scaduta');
        return;
      }

      const response = await supabase.functions.invoke('delete-conversation', {
        body: { conversationId },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Errore durante l\'eliminazione');
      }

      // Se la conversazione eliminata era quella selezionata, deseleziona
      if (selectedConversationId === conversationId) {
        setSelectedConversationId(null);
      }

      // Ricarica la lista delle conversazioni
      await loadConversations();
      toast.success('Conversazione eliminata con successo');
    } catch (error: any) {
      console.error('Error deleting conversation:', error);
      toast.error(error.message || 'Errore durante l\'eliminazione della conversazione');
    } finally {
      setDeletingConversation(null);
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

  // Safe conversation lookup with fallback
  const selectedConversation = conversations.find(c => c.id === selectedConversationId);

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
                className={`p-4 border-b border-gray-100 hover:bg-white transition-colors ${
                  selectedConversationId === conv.id ? 'bg-white border-l-4 border-l-drplant-green' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div 
                    className="flex-1 cursor-pointer flex items-start gap-3"
                    onClick={() => setSelectedConversationId(conv.id)}
                  >
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarImage 
                        src={conv.user_profile?.avatar_url} 
                        alt={`${conv.user_profile?.first_name} ${conv.user_profile?.last_name}`}
                      />
                      <AvatarFallback className="bg-drplant-green/10 text-drplant-green">
                        {conv.user_profile?.first_name?.charAt(0)}{conv.user_profile?.last_name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900 truncate">
                          {conv.user_profile?.first_name} {conv.user_profile?.last_name}
                        </h3>
                        {conv.unread_count > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {conv.unread_count}
                          </Badge>
                        )}
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
                  
                  <div className="ml-2 flex-shrink-0">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                          disabled={deletingConversation === conv.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Elimina Conversazione</AlertDialogTitle>
                          <AlertDialogDescription>
                            Sei sicuro di voler eliminare questa conversazione con {conv.user_profile?.first_name} {conv.user_profile?.last_name}? 
                            Questa azione eliminerà anche tutti i messaggi associati e non può essere annullata.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annulla</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteConversation(conv.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Elimina
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversationId && selectedConversation ? (
          <RealTimeChatWrapper
            conversationId={selectedConversationId}
            userId={userProfile.id}
          >
            {({ messages, isConnected, sendMessage }) => (
              <>
                {/* Chat Header with User Avatar */}
                <div className="p-4 border-b border-gray-200 bg-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage 
                          src={selectedConversation.user_profile?.avatar_url} 
                          alt={`${selectedConversation.user_profile?.first_name} ${selectedConversation.user_profile?.last_name}`}
                        />
                        <AvatarFallback className="bg-drplant-green/10 text-drplant-green text-sm">
                          {selectedConversation.user_profile?.first_name?.charAt(0)}{selectedConversation.user_profile?.last_name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          Chat con {selectedConversation.user_profile?.first_name} {selectedConversation.user_profile?.last_name}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <MessageCircle className="h-4 w-4" />
                          <span>Conversazione Attiva</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className="text-sm text-gray-600">
                          {isConnected ? 'Connesso' : 'Disconnesso'}
                        </span>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-500 hover:text-red-700 border-red-200 hover:border-red-300"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Elimina Chat
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Elimina Conversazione</AlertDialogTitle>
                            <AlertDialogDescription>
                              Sei sicuro di voler eliminare questa conversazione con {selectedConversation.user_profile?.first_name} {selectedConversation.user_profile?.last_name}?
                              Tutti i messaggi verranno eliminati permanentemente.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annulla</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteConversation(selectedConversationId)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Elimina
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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
                      userAvatar={selectedConversation.user_profile?.avatar_url}
                      userName={`${selectedConversation.user_profile?.first_name} ${selectedConversation.user_profile?.last_name}`}
                    />
                  ))}
                </div>

                {/* Message Input */}
                <MessageInput
                  conversationId={selectedConversationId}
                  senderId={userProfile.id}
                  recipientId={selectedConversation.user_profile?.id || ''}
                  onSendMessage={async (text: string) => {
                    const recipientId = selectedConversation.user_profile?.id;
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
                  {selectedConversationId && !selectedConversation ? 
                    'Conversazione Non Trovata' : 
                    'Seleziona una Conversazione'
                  }
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-gray-600">
                  {selectedConversationId && !selectedConversation ? (
                    <span className="text-red-600">
                      🟡 Nessuna conversazione trovata per questo utente.
                    </span>
                  ) : (
                    'Scegli una conversazione dalla lista per iniziare a chattare con i tuoi pazienti.'
                  )}
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
