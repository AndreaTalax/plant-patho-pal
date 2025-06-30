
import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MessageSquare, 
  Clock, 
  AlertCircle, 
  Loader2, 
  Users, 
  TrendingUp,
  Activity,
  Calendar,
  Trash2,
  Eye,
  MoreHorizontal,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MARCO_NIGRO_ID } from '@/components/phytopathologist';
import ExpertChatDetailView from './ExpertChatDetailView';
import ConsultationCard from './ConsultationCard';

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
  created_at: string;
  user_profile?: {
    first_name: string;
    last_name: string;
    email: string;
    is_online?: boolean;
    phone?: string;
    address?: string;
  } | null;
}

const ProfessionalExpertDashboard = () => {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<ConversationSummary | null>(null);
  const [activeTab, setActiveTab] = useState('conversations');
  const [deletingConversation, setDeletingConversation] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalConversations: 0,
    pendingConsultations: 0,
    todayMessages: 0,
    activeUsers: 0
  });

  const loadExpertData = useCallback(async () => {
    try {
      console.log('📊 Loading professional dashboard data...');
      setLoading(true);
      
      // Load conversations with enhanced data
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
        const conversationsWithProfiles = await Promise.all(
          (conversationsData || []).map(async (conversation) => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('first_name, last_name, email, is_online, phone, address')
              .eq('id', conversation.user_id)
              .single();
            
            return {
              id: conversation.id,
              user_id: conversation.user_id,
              last_message_text: conversation.last_message_text || 'Nessun messaggio',
              last_message_timestamp: conversation.last_message_at,
              status: conversation.status || 'active',
              created_at: conversation.created_at,
              user_profile: profile
            };
          })
        );
        
        setConversations(conversationsWithProfiles);
        
        // Calculate stats
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        
        const { count: todayMessagesCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact' })
          .gte('sent_at', todayStart.toISOString());
        
        setStats({
          totalConversations: conversationsWithProfiles.length,
          pendingConsultations: 0, // Will be updated with consultations
          todayMessages: todayMessagesCount || 0,
          activeUsers: conversationsWithProfiles.filter(c => c.user_profile?.is_online).length
        });
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
        
        // Update pending consultations count
        setStats(prev => ({
          ...prev,
          pendingConsultations: consultationsWithProfiles.filter(c => c.status === 'pending').length
        }));
      }

    } catch (error) {
      console.error('❌ Error in loadExpertData:', error);
      toast.error('Errore nel caricamento dei dati');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExpertData();
    
    const conversationsChannel = supabase
      .channel('professional-dashboard-conversations')
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
      .subscribe();

    const consultationsChannel = supabase
      .channel('professional-dashboard-consultations')
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
  }, [loadExpertData]);

  const handleForceDeleteConversation = useCallback(async (conversationId: string) => {
    try {
      setDeletingConversation(conversationId);
      console.log('💪 Force deleting conversation:', conversationId);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Sessione scaduta');
        return;
      }

      // Try force delete first
      const { data, error } = await supabase.functions.invoke('force-delete-conversation', {
        body: { conversationId },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error || !data?.success) {
        console.log('⚠️ Force delete failed, trying normal delete...');
        
        // Fallback to normal delete
        const response = await supabase.functions.invoke('delete-conversation', {
          body: { conversationId },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (response.error) {
          throw new Error(response.error.message || 'Errore durante l\'eliminazione');
        }
      }
      
      console.log('✅ Conversation deleted successfully');
      
      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(null);
      }
      
      await loadExpertData();
      toast.success('Conversazione eliminata con successo');
      
    } catch (error: any) {
      console.error('❌ Error deleting conversation:', error);
      toast.error(error.message || 'Errore durante l\'eliminazione della conversazione');
    } finally {
      setDeletingConversation(null);
    }
  }, [selectedConversation?.id, loadExpertData]);

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return 'U';
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const getUserDisplayName = (userProfile?: ConversationSummary['user_profile']) => {
    if (!userProfile) return 'Utente sconosciuto';
    if (userProfile.first_name || userProfile.last_name) {
      return `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim();
    }
    return userProfile.email || 'Utente sconosciuto';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-drplant-green" />
          <span className="text-gray-600">Caricamento dashboard professionale...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Professionale</h1>
              <p className="text-gray-600">Gestione conversazioni e consultazioni - Marco Nigro</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-drplant-green/10 rounded-full flex items-center justify-center">
                <Activity className="h-6 w-6 text-drplant-green" />
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Ultimo aggiornamento</p>
                <p className="font-medium">{new Date().toLocaleTimeString('it-IT')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 mb-1">Conversazioni Totali</p>
                  <p className="text-3xl font-bold text-blue-900">{stats.totalConversations}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-600 mb-1">Consultazioni in Attesa</p>
                  <p className="text-3xl font-bold text-amber-900">{stats.pendingConsultations}</p>
                </div>
                <Clock className="h-8 w-8 text-amber-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 mb-1">Messaggi Oggi</p>
                  <p className="text-3xl font-bold text-green-900">{stats.todayMessages}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600 mb-1">Utenti Attivi</p>
                  <p className="text-3xl font-bold text-purple-900">{stats.activeUsers}</p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b border-gray-200 bg-gray-50">
              <TabsList className="grid w-full grid-cols-2 bg-transparent h-16">
                <TabsTrigger 
                  value="conversations" 
                  className="flex items-center gap-3 h-12 text-base data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  <MessageSquare className="h-5 w-5" />
                  Conversazioni ({conversations.length})
                </TabsTrigger>
                <TabsTrigger 
                  value="consultations" 
                  className="flex items-center gap-3 h-12 text-base data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  <Clock className="h-5 w-5" />
                  Consultazioni ({consultations.length})
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="conversations" className="p-6">
              {selectedConversation ? (
                <ExpertChatDetailView
                  conversation={selectedConversation}
                  onBack={() => setSelectedConversation(null)}
                />
              ) : (
                <div className="space-y-4">
                  {conversations.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Nessuna conversazione</h3>
                      <p className="text-gray-500">Le nuove conversazioni appariranno qui</p>
                    </div>
                  ) : (
                    conversations.map((conversation) => (
                      <Card 
                        key={conversation.id} 
                        className="hover:shadow-md transition-all duration-200 border-l-4 border-l-drplant-green/30 hover:border-l-drplant-green"
                      >
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 flex-1">
                              <div className="relative">
                                <Avatar className="h-12 w-12">
                                  <AvatarFallback className="bg-drplant-green/10 text-drplant-green font-semibold">
                                    {getInitials(conversation.user_profile?.first_name, conversation.user_profile?.last_name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                                  conversation.user_profile?.is_online ? 'bg-green-500' : 'bg-gray-400'
                                }`} />
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="font-semibold text-gray-900 text-lg">
                                    {getUserDisplayName(conversation.user_profile)}
                                  </h3>
                                  <Badge variant={conversation.user_profile?.is_online ? "default" : "secondary"}>
                                    {conversation.user_profile?.is_online ? 'Online' : 'Offline'}
                                  </Badge>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                                  <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4" />
                                    <span className="truncate">{conversation.user_profile?.email || 'N/A'}</span>
                                  </div>
                                  {conversation.user_profile?.phone && (
                                    <div className="flex items-center gap-2">
                                      <Phone className="h-4 w-4" />
                                      <span>{conversation.user_profile.phone}</span>
                                    </div>
                                  )}
                                  {conversation.user_profile?.address && (
                                    <div className="flex items-center gap-2">
                                      <MapPin className="h-4 w-4" />
                                      <span className="truncate">{conversation.user_profile.address}</span>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                  <p className="text-sm text-gray-700 mb-2">
                                    <strong>Ultimo messaggio:</strong> {conversation.last_message_text}
                                  </p>
                                  <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <Calendar className="h-3 w-3" />
                                    Creato: {formatDate(conversation.created_at)}
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 ml-4">
                              <Button
                                onClick={() => setSelectedConversation(conversation)}
                                className="bg-drplant-green hover:bg-drplant-green/90"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Visualizza
                              </Button>
                              
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="outline" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-white">
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <DropdownMenuItem 
                                        className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                        onSelect={(e) => e.preventDefault()}
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Elimina conversazione
                                      </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="bg-white">
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Elimina conversazione</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Sei sicuro di voler eliminare questa conversazione con {getUserDisplayName(conversation.user_profile)}? 
                                          Questa azione non può essere annullata e verranno eliminati tutti i messaggi.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Annulla</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleForceDeleteConversation(conversation.id)}
                                          className="bg-red-600 hover:bg-red-700"
                                          disabled={deletingConversation === conversation.id}
                                        >
                                          {deletingConversation === conversation.id ? (
                                            <>
                                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                              Eliminando...
                                            </>
                                          ) : (
                                            <>
                                              <Trash2 className="h-4 w-4 mr-2" />
                                              Elimina definitivamente
                                            </>
                                          )}
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="consultations" className="p-6">
              <div className="space-y-4">
                {consultations.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Nessuna consultazione</h3>
                    <p className="text-gray-500">Le nuove consultazioni appariranno qui</p>
                  </div>
                ) : (
                  consultations.map((consultation) => (
                    <ConsultationCard
                      key={consultation.id}
                      consultation={consultation}
                      getInitials={getInitials}
                      getUserDisplayName={(profile) => getUserDisplayName(profile)}
                      getStatusBadge={(status) => (
                        <Badge variant={status === 'pending' ? 'destructive' : status === 'completed' ? 'default' : 'secondary'}>
                          {status === 'pending' ? 'In attesa' : status === 'completed' ? 'Completato' : status}
                        </Badge>
                      )}
                      updateConsultationStatus={() => {}}
                      deletingConsultation={null}
                      handleDeleteConsultation={() => {}}
                    />
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalExpertDashboard;
