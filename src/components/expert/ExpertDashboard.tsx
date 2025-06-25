
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, MessageCircle, Users, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ConversationDetail } from './ConversationDetail';

interface Conversation {
  id: string;
  user_id: string;
  title: string;
  status: string;
  last_message_text: string;
  last_message_at: string;
  created_at: string;
  user_profile?: {
    first_name?: string;
    last_name?: string;
    email?: string;
  };
  unread_count: number;
}

const ExpertDashboard = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [selectedUserProfile, setSelectedUserProfile] = useState<any>(null);

  useEffect(() => {
    loadConversations();
    
    // Setup realtime subscription for new conversations
    const channel = supabase.channel('expert-dashboard')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations'
        },
        () => {
          console.log('Aggiornamento conversazioni');
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadConversations = async () => {
    try {
      console.log('Caricamento conversazioni...');
      
      // Carica conversazioni con profili utente
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select(`
          *,
          profiles:user_id (
            first_name,
            last_name,
            email
          )
        `)
        .order('last_message_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Errore caricamento conversazioni:', error);
        toast.error('Errore nel caricamento delle conversazioni');
        return;
      }

      console.log('Conversazioni caricate:', conversations);

      // Conta messaggi non letti per ogni conversazione
      const conversationsWithUnread = await Promise.all(
        (conversations || []).map(async (conv) => {
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('read', false)
            .neq('sender_id', (await supabase.auth.getUser()).data.user?.id);

          return {
            ...conv,
            user_profile: conv.profiles,
            unread_count: count || 0
          };
        })
      );

      setConversations(conversationsWithUnread);
    } catch (error) {
      console.error('Errore:', error);
      toast.error('Errore nel caricamento delle conversazioni');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('it-IT', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else {
      return date.toLocaleDateString('it-IT', { 
        day: '2-digit', 
        month: '2-digit' 
      });
    }
  };

  const openConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation.id);
    setSelectedUserProfile(conversation.user_profile);
  };

  if (selectedConversation) {
    return (
      <ConversationDetail
        conversationId={selectedConversation}
        userProfile={selectedUserProfile}
        onBack={() => {
          setSelectedConversation(null);
          setSelectedUserProfile(null);
          loadConversations(); // Ricarica per aggiornare contatori
        }}
      />
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Esperto</h1>
          <p className="text-gray-600">Gestisci le conversazioni con gli utenti</p>
        </div>
        <Button onClick={loadConversations} disabled={loading} size="sm">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Aggiorna
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <MessageCircle className="h-8 w-8 text-drplant-blue" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Conversazioni Attive</p>
                <p className="text-2xl font-bold text-gray-900">
                  {conversations.filter(c => c.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-drplant-green" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Utenti Totali</p>
                <p className="text-2xl font-bold text-gray-900">{conversations.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Messaggi Non Letti</p>
                <p className="text-2xl font-bold text-gray-900">
                  {conversations.reduce((sum, c) => sum + c.unread_count, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conversations List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Conversazioni ({conversations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-drplant-green mx-auto mb-4"></div>
              <p>Caricamento conversazioni...</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nessuna conversazione disponibile</p>
            </div>
          ) : (
            <div className="space-y-2">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => openConversation(conversation)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium">
                        {conversation.user_profile?.first_name} {conversation.user_profile?.last_name}
                      </h3>
                      {conversation.unread_count > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {conversation.unread_count} nuovo{conversation.unread_count > 1 ? 'i' : ''}
                        </Badge>
                      )}
                      <Badge 
                        variant={conversation.status === 'active' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {conversation.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {conversation.user_profile?.email}
                    </p>
                    {conversation.last_message_text && (
                      <p className="text-sm text-gray-500 mt-1 truncate">
                        {conversation.last_message_text}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">
                      {conversation.last_message_at 
                        ? formatTime(conversation.last_message_at)
                        : formatTime(conversation.created_at)
                      }
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ExpertDashboard;
