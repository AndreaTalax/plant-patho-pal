import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MARCO_NIGRO_ID } from '@/components/phytopathologist';
import ExpertChatDetailView from './ExpertChatDetailView';
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
  user_profile?: {
    first_name: string;
    last_name: string;
    email: string;
    is_online?: boolean;
  } | null;
}

const OptimizedExpertDashboard = () => {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<ConversationSummary | null>(null);
  const [activeTab, setActiveTab] = useState('conversations');
  const [deletingConversation, setDeletingConversation] = useState<string | null>(null);

  // Load data more efficiently with better error handling
  const loadExpertData = async () => {
    try {
      console.log('🔄 Loading expert dashboard data...');
      
      // Load conversations directly from database with proper error handling
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
        
        // Get user profiles for conversations
        const conversationsWithProfiles = await Promise.all(
          (conversationsData || []).map(async (conversation) => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('first_name, last_name, email, is_online')
              .eq('id', conversation.user_id)
              .single();
            
            return {
              id: conversation.id,
              user_id: conversation.user_id,
              last_message_text: conversation.last_message_text || 'Nessun messaggio',
              last_message_timestamp: conversation.last_message_at,
              status: conversation.status || 'active',
              user_profile: profile
            };
          })
        );
        
        setConversations(conversationsWithProfiles);
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
    }
  };

  useEffect(() => {
    loadExpertData();
    
    // Setup real-time subscriptions with better error handling
    const conversationsChannel = supabase
      .channel('expert-conversations-optimized')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'conversations' },
        (payload) => {
          console.log('🔄 Conversation change detected:', payload);
          // Always reload data for any conversation change
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
        console.log('📡 Real-time subscription status:', status);
      });

    const consultationsChannel = supabase
      .channel('expert-consultations-optimized')
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
  }, [selectedConversation?.id]);

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />In attesa</span>;
      case 'in_progress':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"><AlertCircle className="h-3 w-3 mr-1" />In corso</span>;
      case 'completed':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">Completato</span>;
      default:
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  const handleOpenChat = (conversation: ConversationSummary) => {
    setSelectedConversation(conversation);
  };

  const handleCloseChat = () => {
    setSelectedConversation(null);
  };

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      setDeletingConversation(conversationId);
      console.log('🗑️ Starting conversation deletion for ID:', conversationId);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Sessione scaduta');
        return;
      }

      // Make the API call to delete the conversation
      const response = await supabase.functions.invoke('delete-conversation', {
        body: { conversationId },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      console.log('🔄 Delete conversation response:', response);

      if (response.error) {
        console.error('❌ Delete conversation failed:', response.error);
        throw new Error(response.error.message || 'Errore durante l\'eliminazione');
      }
      
      console.log('✅ Conversation deleted successfully');
      
      // If the deleted conversation was selected, deselect it
      if (selectedConversation?.id === conversationId) {
        console.log('🔄 Deselecting deleted conversation');
        setSelectedConversation(null);
      }
      
      // Force immediate reload of the data to ensure UI is updated
      console.log('🔄 Force reloading data after deletion');
      await loadExpertData();
      
      toast.success('Conversazione eliminata con successo');
      
    } catch (error: any) {
      console.error('❌ Error deleting conversation:', error);
      toast.error(error.message || 'Errore durante l\'eliminazione della conversazione');
    } finally {
      setDeletingConversation(null);
    }
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
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Esperto Ottimizzata</h1>
        <div className="flex gap-4">
          <Card className="px-4 py-2">
            <div className="text-sm text-gray-500">Conversazioni Attive</div>
            <div className="text-2xl font-bold text-drplant-green">
              {conversations.length}
            </div>
          </Card>
          <Card className="px-4 py-2">
            <div className="text-sm text-gray-500">Consultazioni Pending</div>
            <div className="text-2xl font-bold text-blue-600">
              {consultations.filter(c => c.status === 'pending').length}
            </div>
          </Card>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
                  <p>Nessuna conversazione disponibile</p>
                  <p className="text-sm mt-2">Le nuove conversazioni appariranno qui</p>
                </CardContent>
              </Card>
            ) : (
              conversations.map((conversation) => (
                <ConversationCard
                  key={conversation.id}
                  conversation={conversation}
                  getInitials={getInitials}
                  getUserDisplayName={getUserDisplayName}
                  handleOpenChat={handleOpenChat}
                  onDeleteConversation={handleDeleteConversation}
                  deletingConversation={deletingConversation}
                />
              ))
            )
          )}
        </TabsContent>

        <TabsContent value="consultations" className="space-y-4">
          {consultations.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Nessuna consultazione disponibile</p>
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
                updateConsultationStatus={() => {}}
                deletingConsultation={null}
                handleDeleteConsultation={() => {}}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OptimizedExpertDashboard;
