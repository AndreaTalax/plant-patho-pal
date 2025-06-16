import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Clock, CheckCircle, AlertCircle, User, Calendar, Trash2, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';
import { MARCO_NIGRO_ID } from '@/components/phytopathologist';
import ExpertChatDetailView from './ExpertChatDetailView';
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
import ConsultationCard from './ConsultationCard';
import ConversationCard from './ConversationCard';

interface Consultation {
  id: string;
  user_id: string;
  plant_info: any;
  symptoms: string;
  image_url: string;
  status: string;
  created_at: string;
  user_profile?: {
    first_name: string;
    last_name: string;
    email: string;
  } | null;
}

interface ConversationSummary {
  id: string;
  user_id: string;
  last_message_text?: string;
  last_message_timestamp?: string;
  status: string;
  message_count?: number;
  user_profile?: {
    first_name: string;
    last_name: string;
    email: string;
  } | null;
}

const ExpertDashboard = () => {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingConsultation, setDeletingConsultation] = useState<string | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<ConversationSummary | null>(null);

  const loadExpertData = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    
    try {
      console.log('🔄 Loading expert dashboard data...');
      
      // Load conversations with messages count for better visibility
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('conversations')
        .select(`
          id,
          user_id,
          last_message_text,
          last_message_at,
          status,
          created_at,
          updated_at
        `)
        .eq('expert_id', MARCO_NIGRO_ID)
        .order('updated_at', { ascending: false });

      if (conversationsError) {
        console.error('❌ Error loading conversations:', conversationsError);
        toast.error('Errore nel caricamento delle conversazioni');
      } else {
        console.log('✅ Conversations loaded:', conversationsData?.length || 0);
        
        // Get user profiles and message counts
        const conversationsWithDetails = await Promise.all(
          (conversationsData || []).map(async (conversation) => {
            // Get user profile
            const { data: profile } = await supabase
              .from('profiles')
              .select('first_name, last_name, email')
              .eq('id', conversation.user_id)
              .single();
            
            // Get message count for this conversation
            const { count: messageCount } = await supabase
              .from('messages')
              .select('*', { count: 'exact' })
              .eq('conversation_id', conversation.id);
            
            return {
              id: conversation.id,
              user_id: conversation.user_id,
              last_message_text: conversation.last_message_text || 'Nessun messaggio ancora',
              last_message_timestamp: conversation.last_message_at,
              status: conversation.status || 'active',
              user_profile: profile,
              message_count: messageCount || 0
            };
          })
        );
        
        setConversations(conversationsWithDetails);
      }

      // Load consultations
      const { data: consultationsData, error: consultationsError } = await supabase
        .from('expert_consultations')
        .select('*')
        .order('created_at', { ascending: false });

      if (consultationsError) {
        console.error('❌ Error loading consultations:', consultationsError);
        toast.error('Errore nel caricamento delle consultazioni');
      } else {
        console.log('✅ Consultations loaded:', consultationsData?.length || 0);
        
        const consultationsWithProfiles = await Promise.all(
          (consultationsData || []).map(async (consultation) => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('first_name, last_name, email')
              .eq('id', consultation.user_id)
              .single();
            
            return {
              ...consultation,
              user_profile: profile
            };
          })
        );
        
        setConsultations(consultationsWithProfiles);
      }

    } catch (error) {
      console.error('❌ Error in loadExpertData:', error);
      toast.error('Errore nel caricamento dei dati');
    } finally {
      setLoading(false);
      if (showRefreshing) setRefreshing(false);
    }
  };

  useEffect(() => {
    loadExpertData();
    
    // Setup real-time subscriptions with better error handling
    const conversationsChannel = supabase
      .channel('expert-conversations-main')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'conversations' },
        (payload) => {
          console.log('🔄 Conversation change detected:', payload);
          loadExpertData();
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        (payload) => {
          console.log('📨 Message change detected:', payload);
          loadExpertData();
        }
      )
      .subscribe((status) => {
        console.log('📡 Conversations subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Real-time conversations connected');
        }
      });

    const consultationsChannel = supabase
      .channel('expert-consultations-main')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'expert_consultations' },
        (payload) => {
          console.log('🔄 Consultation change detected:', payload);
          loadExpertData();
        }
      )
      .subscribe((status) => {
        console.log('📡 Consultations subscription status:', status);
      });

    return () => {
      supabase.removeChannel(conversationsChannel);
      supabase.removeChannel(consultationsChannel);
    };
  }, []);

  const updateConsultationStatus = async (consultationId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('expert_consultations')
        .update({ status: newStatus })
        .eq('id', consultationId);

      if (error) {
        console.error('Error updating consultation status:', error);
        toast.error('Errore nell\'aggiornamento dello stato');
      } else {
        toast.success('Stato aggiornato con successo');
        loadExpertData();
      }
    } catch (error) {
      console.error('Error updating consultation status:', error);
      toast.error('Errore nell\'aggiornamento dello stato');
    }
  };

  // Funzione per eliminare consultazione
  const handleDeleteConsultation = async (consultationId: string) => {
    try {
      setDeletingConsultation(consultationId);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Sessione scaduta');
        return;
      }

      const response = await supabase.functions.invoke('delete-consultation', {
        body: { consultationId },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Errore durante l\'eliminazione');
      }

      // Ricarica i dati
      await loadExpertData();
      toast.success('Consultazione eliminata con successo');
    } catch (error: any) {
      console.error('Error deleting consultation:', error);
      toast.error(error.message || 'Errore durante l\'eliminazione della consultazione');
    } finally {
      setDeletingConsultation(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600"><Clock className="h-3 w-3 mr-1" />In attesa</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="text-blue-600"><AlertCircle className="h-3 w-3 mr-1" />In corso</Badge>;
      case 'completed':
        return <Badge variant="outline" className="text-green-600"><CheckCircle className="h-3 w-3 mr-1" />Completato</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return 'U';
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const getUserDisplayName = (userProfile?: { first_name: string; last_name: string; email: string; } | null) => {
    if (!userProfile) return 'Utente sconosciuto';
    if (userProfile.first_name || userProfile.last_name) {
      return `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim();
    }
    return userProfile.email || 'Utente sconosciuto';
  };

  const handleRefresh = () => {
    loadExpertData(true);
  };

  const handleOpenChat = (conversation: ConversationSummary) => {
    setSelectedConversation(conversation);
  };

  const handleCloseChat = () => {
    setSelectedConversation(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-drplant-green" />
          <span className="text-gray-600">Caricamento dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Esperto</h1>
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Aggiornamento...' : 'Aggiorna'}
          </Button>
          <Card className="px-4 py-2">
            <div className="text-sm text-gray-500">Conversazioni Attive</div>
            <div className="text-2xl font-bold text-drplant-green">
              {conversations.length}
            </div>
          </Card>
          <Card className="px-4 py-2">
            <div className="text-sm text-gray-500">Consultazioni</div>
            <div className="text-2xl font-bold text-blue-600">
              {consultations.filter(c => c.status !== 'completed').length}
            </div>
          </Card>
        </div>
      </div>

      <Tabs defaultValue="conversations" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="conversations" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Conversazioni ({conversations.length})
          </TabsTrigger>
          <TabsTrigger value="consultations" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Consultazioni ({consultations.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="conversations" className="space-y-4">
          {selectedConversation ? (
            <ExpertChatDetailView
              conversation={selectedConversation}
              onBack={handleCloseChat}
            />
          ) : (
            conversations.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-gray-500">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">Nessuna conversazione disponibile</p>
                  <p className="text-sm mt-2">Le nuove conversazioni appariranno qui automaticamente</p>
                  <Button 
                    variant="outline" 
                    onClick={handleRefresh}
                    className="mt-4"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Controlla aggiornamenti
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {conversations.map((conversation) => (
                  <Card key={conversation.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>
                              {getInitials(conversation.user_profile?.first_name, conversation.user_profile?.last_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-medium">
                              {getUserDisplayName(conversation.user_profile)}
                            </h3>
                            <p className="text-sm text-gray-600 max-w-md truncate">
                              {conversation.last_message_text}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-500">
                                {conversation.message_count || 0} messaggi
                              </span>
                              {conversation.last_message_timestamp && (
                                <span className="text-xs text-gray-500">
                                  • {formatDistanceToNow(new Date(conversation.last_message_timestamp), { 
                                    addSuffix: true, 
                                    locale: it 
                                  })}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button 
                          variant="outline"
                          onClick={() => handleOpenChat(conversation)}
                        >
                          Apri Chat
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )
          )}
        </TabsContent>

        <TabsContent value="consultations" className="space-y-4">
          {consultations.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">Nessuna consultazione disponibile</p>
                <p className="text-sm mt-2">Le nuove consultazioni appariranno qui</p>
              </CardContent>
            </Card>
          ) : (
            consultations.map((consultation) => (
              <ConsultationCard
                key={consultation.id}
                consultation={consultation}
                getInitials={getInitials}
                getUserDisplayName={getUserDisplayName}
                getStatusBadge={getStatusBadge}
                updateConsultationStatus={updateConsultationStatus}
                deletingConsultation={deletingConsultation}
                handleDeleteConsultation={handleDeleteConsultation}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExpertDashboard;
