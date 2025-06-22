import { useEffect, useState, useCallback } from 'react';
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
import { ConversationService } from '@/services/chat/conversationService';

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
  user_profile?: {
    first_name: string;
    last_name: string;
    email: string;
    is_online?: boolean;
    last_seen_at?: string;
  } | null;
}

const ExpertDashboard = () => {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingConsultation, setDeletingConsultation] = useState<string | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<ConversationSummary | null>(null);

  const loadExpertData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    
    try {
      console.log('🔄 Loading expert dashboard data...');
      
      // Load conversations with user presence information
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
        .order('updated_at', { ascending: false })
        .limit(50);

      if (conversationsError) {
        console.error('❌ Error loading conversations:', conversationsError);
        toast.error('Errore nel caricamento delle conversazioni');
      } else {
        console.log('✅ Conversations loaded:', conversationsData?.length || 0);
        
        // Get user profiles with online status
        const conversationsWithProfiles = await Promise.all(
          (conversationsData || []).slice(0, 20).map(async (conversation) => {
            try {
              const { data: profile } = await supabase
                .from('profiles')
                .select('first_name, last_name, email, is_online, last_seen_at')
                .eq('id', conversation.user_id)
                .single();
              
              return {
                id: conversation.id,
                user_id: conversation.user_id,
                last_message_text: conversation.last_message_text || 'Nessun messaggio ancora',
                last_message_timestamp: conversation.last_message_at,
                status: conversation.status || 'active',
                user_profile: profile
              };
            } catch (error) {
              console.error('Error loading profile for conversation:', conversation.id, error);
              return {
                id: conversation.id,
                user_id: conversation.user_id,
                last_message_text: conversation.last_message_text || 'Nessun messaggio ancora',
                last_message_timestamp: conversation.last_message_at,
                status: conversation.status || 'active',
                user_profile: null
              };
            }
          })
        );
        
        setConversations(conversationsWithProfiles);
      }

      // Load consultations
      const { data: consultationsData, error: consultationsError } = await supabase
        .from('expert_consultations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (consultationsError) {
        console.error('❌ Error loading consultations:', consultationsError);
        toast.error('Errore nel caricamento delle consultazioni');
      } else {
        console.log('✅ Consultations loaded:', consultationsData?.length || 0);
        
        const consultationsWithProfiles = await Promise.all(
          (consultationsData || []).map(async (consultation) => {
            try {
              const { data: profile } = await supabase
                .from('profiles')
                .select('first_name, last_name, email')
                .eq('id', consultation.user_id)
                .single();
              
              return {
                ...consultation,
                user_profile: profile
              };
            } catch (error) {
              console.error('Error loading profile for consultation:', consultation.id, error);
              return {
                ...consultation,
                user_profile: null
              };
            }
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
  }, []); // Empty dependency array since function doesn't depend on props or state

  useEffect(() => {
    loadExpertData();
    
    // Setup simplified real-time subscriptions
    const conversationsChannel = supabase
      .channel('expert-conversations-simple')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'conversations', filter: `expert_id=eq.${MARCO_NIGRO_ID}` },
        (payload) => {
          console.log('🔄 Conversation change detected:', payload);
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            loadExpertData();
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Conversations subscription status:', status);
      });

    const consultationsChannel = supabase
      .channel('expert-consultations-simple')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'expert_consultations' },
        (payload) => {
          console.log('🔄 Consultation change detected:', payload);
          loadExpertData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(conversationsChannel);
      supabase.removeChannel(consultationsChannel);
    };
  }, [loadExpertData]); // Only depend on the memoized loadExpertData function

  const updateConsultationStatus = useCallback(async (consultationId: string, newStatus: string) => {
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
  }, [loadExpertData]);

  const handleDeleteConversation = useCallback(async (conversationId: string) => {
    try {
      setDeletingConsultation(conversationId);
      
      console.log('🗑️ Dashboard: Eliminazione conversazione', conversationId);
      
      // Se è la conversazione selezionata, deseleziona immediatamente
      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(null);
      }
      
      // Usa il ConversationService per eliminare
      const success = await ConversationService.deleteConversation(conversationId);
      
      if (success) {
        console.log('✅ Dashboard: Conversazione eliminata con successo');
        toast.success('Conversazione eliminata con successo');
        
        // Rimuovi immediatamente dalla UI per feedback veloce
        setConversations(prevConversations => 
          prevConversations.filter(conv => conv.id !== conversationId)
        );
        
        // Forza un refresh dopo 1 secondo per essere sicuri
        setTimeout(() => {
          loadExpertData();
        }, 1000);
        
      } else {
        console.error('❌ Dashboard: Fallimento eliminazione');
        toast.error('Errore durante l\'eliminazione della conversazione');
      }
      
    } catch (error: any) {
      console.error('❌ Dashboard: Errore eliminazione conversazione', error);
      toast.error(error.message || 'Errore durante l\'eliminazione della conversazione');
    } finally {
      setDeletingConsultation(null);
    }
  }, [selectedConversation?.id, loadExpertData]);

  const handleDeleteConsultation = useCallback(async (consultationId: string) => {
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

      await loadExpertData();
      toast.success('Consultazione eliminata con successo');
    } catch (error: any) {
      console.error('Error deleting consultation:', error);
      toast.error(error.message || 'Errore durante l\'eliminazione della consultazione');
    } finally {
      setDeletingConsultation(null);
    }
  }, [loadExpertData]);

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

  const handleRefresh = useCallback(() => {
    loadExpertData(true);
  }, [loadExpertData]);

  // Stabilizza la funzione handleCloseChat con useCallback
  const handleCloseChat = useCallback(() => {
    setSelectedConversation(null);
  }, []);

  const handleOpenChat = useCallback((conversation: ConversationSummary) => {
    setSelectedConversation(conversation);
  }, []);

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
    <div className="space-y-6 px-4 max-w-full overflow-hidden">
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
              <div className="space-y-3 max-w-full overflow-hidden">
                {conversations.map((conversation) => (
                  <ConversationCard
                    key={conversation.id}
                    conversation={conversation}
                    getInitials={getInitials}
                    getUserDisplayName={getUserDisplayName}
                    handleOpenChat={handleOpenChat}
                    onDeleteConversation={handleDeleteConversation}
                    deletingConversation={deletingConsultation}
                  />
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
