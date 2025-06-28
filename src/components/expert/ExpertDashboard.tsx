
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, MessageCircle, Users, Clock, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ConversationDetail } from './ConversationDetail';
import ConversationCard from './ConversationCard';

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
  const [deletingConversation, setDeletingConversation] = useState<string | null>(null);

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
      
      // First, get conversations
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select('*')
        .order('last_message_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Errore caricamento conversazioni:', error);
        toast.error('Errore nel caricamento delle conversazioni');
        return;
      }

      console.log('Conversazioni caricate:', conversations);

      // Then get user profiles and unread counts for each conversation
      const conversationsWithProfiles = await Promise.all(
        (conversations || []).map(async (conv) => {
          // Get user profile
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('first_name, last_name, email')
            .eq('id', conv.user_id)
            .single();

          if (profileError) {
            console.error('Errore caricamento profilo:', profileError);
          }

          // Count unread messages
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('read', false)
            .neq('sender_id', (await supabase.auth.getUser()).data.user?.id);

          return {
            ...conv,
            user_profile: profile || undefined,
            unread_count: count || 0
          };
        })
      );

      setConversations(conversationsWithProfiles);
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

  const handleDeleteConversation = async (conversationId: string) => {
    setDeletingConversation(conversationId);
    
    try {
      console.log('🗑️ Eliminazione conversazione:', conversationId);
      
      // Prima elimina tutti i messaggi della conversazione
      const { error: messagesError } = await supabase
        .from('messages')
        .delete()
        .eq('conversation_id', conversationId);

      if (messagesError) {
        console.error('Errore eliminazione messaggi:', messagesError);
        throw messagesError;
      }

      // Poi elimina la conversazione
      const { error: conversationError } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId);

      if (conversationError) {
        console.error('Errore eliminazione conversazione:', conversationError);
        throw conversationError;
      }

      console.log('✅ Conversazione eliminata con successo');
      toast.success('Conversazione eliminata con successo');
      
      // Aggiorna la lista delle conversazioni
      loadConversations();
      
    } catch (error: any) {
      console.error('❌ Errore eliminazione conversazione:', error);
      toast.error('Errore nell\'eliminazione della conversazione');
    } finally {
      setDeletingConversation(null);
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.charAt(0)?.toUpperCase() || '';
    const last = lastName?.charAt(0)?.toUpperCase() || '';
    return first + last || 'U';
  };

  const getUserDisplayName = (userProfile?: { first_name: string; last_name: string; email: string } | null) => {
    if (!userProfile) return 'Utente Sconosciuto';
    
    const firstName = userProfile.first_name || '';
    const lastName = userProfile.last_name || '';
    
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    } else if (firstName) {
      return firstName;
    } else if (lastName) {
      return lastName;
    } else {
      return userProfile.email || 'Utente Sconosciuto';
    }
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
            <div className="space-y-3">
              {conversations.map((conversation) => (
                <ConversationCard
                  key={conversation.id}
                  conversation={conversation}
                  getInitials={getInitials}
                  getUserDisplayName={getUserDisplayName}
                  handleOpenChat={openConversation}
                  onDeleteConversation={handleDeleteConversation}
                  deletingConversation={deletingConversation}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ExpertDashboard;
