
import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { 
  MessageSquare, 
  Clock, 
  AlertCircle, 
  Loader2, 
  Users, 
  TrendingUp,
  Activity,
  RefreshCw,
  Archive,
  Phone,
  Mail,
  MapPin,
  ArrowLeft,
  Filter,
  X,
  ArrowUpDown,
  Search
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
  created_at: string;
  updated_at: string;
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
  const [selectedConversationType, setSelectedConversationType] = useState<'active' | 'archived'>('active');
  const [activeTab, setActiveTab] = useState('conversations');
  const [archivingConversation, setArchivingConversation] = useState<string | null>(null);
  const [archivedConversations, setArchivedConversations] = useState<ConversationSummary[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  
  // Sort order state
  const [sortOrder, setSortOrder] = useState<'recent' | 'oldest'>('recent');
  
  const [stats, setStats] = useState({
    totalConversations: 0,
    archivedConversations: 0,
    todayMessages: 0,
    activeUsers: 0
  });

  const loadExpertData = useCallback(async () => {
    try {
      console.log('📊 Loading professional dashboard data...');
      setLoading(true);
      
      // Load active conversations
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
        .eq('status', 'active')
        .order('updated_at', { ascending: false });

      // Load archived conversations
      const { data: archivedConversationsData, error: archivedError } = await supabase
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
        .eq('status', 'finished')
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
              updated_at: conversation.updated_at,
              user_profile: profile
            };
          })
        );
        
        setConversations(conversationsWithProfiles);

        // Process archived conversations
        const archivedConversationsWithProfiles = await Promise.all(
          (archivedConversationsData || []).map(async (conversation) => {
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
              status: conversation.status || 'finished',
              created_at: conversation.created_at,
              updated_at: conversation.updated_at,
              user_profile: profile
            };
          })
        );
        
        setArchivedConversations(archivedConversationsWithProfiles);
        
        // Calculate stats
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        
        const { count: todayMessagesCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact' })
          .gte('sent_at', todayStart.toISOString());
        
        // Conta utenti unici attivi (basato su user_id unici, non su numero di conversazioni)
        const uniqueActiveUsers = new Set(
          conversationsWithProfiles
            .filter(c => c.user_profile?.is_online)
            .map(c => c.user_id)
        ).size;

        setStats({
          totalConversations: conversationsWithProfiles.length,
          archivedConversations: archivedConversationsWithProfiles.length,
          todayMessages: todayMessagesCount || 0,
          activeUsers: uniqueActiveUsers
        });
      }


    } catch (error) {
      console.error('❌ Error in loadExpertData:', error);
      toast.error('Errore nel caricamento dei dati');
    } finally {
      setLoading(false);
    }
  }, []);

  // Sort conversations by date
  const sortConversations = useCallback((convs: ConversationSummary[], order: 'recent' | 'oldest') => {
    return [...convs].sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return order === 'recent' ? dateB - dateA : dateA - dateB;
    });
  }, []);

  // Toggle sort order
  const toggleSortOrder = () => {
    const newOrder = sortOrder === 'recent' ? 'oldest' : 'recent';
    setSortOrder(newOrder);
  };


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

  const handleArchiveConversation = useCallback(async (conversationId: string) => {
    try {
      setArchivingConversation(conversationId);
      console.log('📁 Archiving conversation:', conversationId);
      
      // Update conversation status to finished (archived)
      const { error } = await supabase
        .from('conversations')
        .update({ status: 'finished' })
        .eq('id', conversationId);

      if (error) {
        throw new Error(error.message || 'Errore durante l\'archiviazione della conversazione');
      }
      
      console.log('✅ Conversation archived successfully');
      
      // Move conversation from active to archived
      const conversationToArchive = conversations.find(conv => conv.id === conversationId);
      if (conversationToArchive) {
        setConversations(prev => prev.filter(conv => conv.id !== conversationId));
        setArchivedConversations(prev => [...prev, { ...conversationToArchive, status: 'finished' }]);
      }
      
      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(null);
      }
      
      toast.success('Conversazione archiviata con successo');
      
    } catch (error: any) {
      console.error('❌ Error archiving conversation:', error);
      toast.error(error.message || 'Errore durante l\'archiviazione della conversazione');
    } finally {
      setArchivingConversation(null);
    }
  }, [conversations, selectedConversation?.id]);

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

  // Filter conversations based on search term
  const filteredActiveConversations = conversations.filter(conv => {
    const displayName = getUserDisplayName(conv.user_profile).toLowerCase();
    return displayName.includes(searchTerm.toLowerCase());
  });

  const filteredArchivedConversations = archivedConversations.filter(conv => {
    const displayName = getUserDisplayName(conv.user_profile).toLowerCase();
    return displayName.includes(searchTerm.toLowerCase());
  });

  // Get priority badge for conversation
  const getPriorityBadge = (conversation: ConversationSummary) => {
    const lastMessageTime = conversation.last_message_timestamp ? new Date(conversation.last_message_timestamp) : null;
    const now = new Date();
    const hoursDiff = lastMessageTime ? Math.abs(now.getTime() - lastMessageTime.getTime()) / (1000 * 60 * 60) : 0;
    
    if (!lastMessageTime) {
      return <Badge variant="secondary" className="text-xs">Nuovo</Badge>;
    }
    
    if (hoursDiff > 24) {
      return <Badge variant="destructive" className="text-xs">Urgente</Badge>;
    } else if (hoursDiff > 12) {
      return <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-700">Attesa risposta</Badge>;
    }
    
    return <Badge variant="default" className="text-xs bg-green-100 text-green-700">Recente</Badge>;
  };

  // Back to main dashboard
  const goBackToMain = () => {
    window.dispatchEvent(new CustomEvent('switchTab', { detail: 'profile' }));
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Dashboard Professionale</h1>
              <p className="text-gray-600">Gestione conversazioni e consultazioni - Marco Nigro</p>
            </div>
            <div className="flex items-center justify-center md:justify-end gap-3">
              <Button
                variant="outline"
                onClick={loadExpertData}
                disabled={loading}
                className="hidden sm:inline-flex"
                aria-label="Aggiorna conversazioni"
                title="Aggiorna conversazioni"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Aggiorno...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Aggiorna
                  </>
                )}
              </Button>
              <div className="w-12 h-12 bg-drplant-green/10 rounded-full flex items-center justify-center">
                <Activity className="h-6 w-6 text-drplant-green" />
              </div>
              <div className="text-center md:text-right">
                <p className="text-sm text-gray-500">Ultimo aggiornamento</p>
                <p className="font-medium">{new Date().toLocaleTimeString('it-IT')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-3 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium text-blue-600 mb-1">Conversazioni Attive</p>
                  <p className="text-xl md:text-3xl font-bold text-blue-900">{stats.totalConversations}</p>
                </div>
                <MessageSquare className="h-6 md:h-8 w-6 md:w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-3 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium text-purple-600 mb-1">Archivio</p>
                  <p className="text-xl md:text-3xl font-bold text-purple-900">{stats.archivedConversations}</p>
                </div>
                <Archive className="h-6 md:h-8 w-6 md:w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-3 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium text-green-600 mb-1">Messaggi Oggi</p>
                  <p className="text-xl md:text-3xl font-bold text-green-900">{stats.todayMessages}</p>
                </div>
                <TrendingUp className="h-6 md:h-8 w-6 md:w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-3 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium text-purple-600 mb-1">Utenti Attivi</p>
                  <p className="text-xl md:text-3xl font-bold text-purple-900">{stats.activeUsers}</p>
                </div>
                <Users className="h-6 md:h-8 w-6 md:w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Date Filter Section */}
          <div className="border-b border-gray-200 bg-gray-50 p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filtra per data:</span>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Calendario filtro rimosso su richiesta dell'utente */}
                
                {/* Sort Order Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleSortOrder}
                  className="flex items-center gap-2"
                >
                  <ArrowUpDown className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {sortOrder === 'recent' ? 'Più recenti' : 'Più vecchie'}
                  </span>
                  <span className="sm:hidden">
                    {sortOrder === 'recent' ? 'Recenti' : 'Vecchie'}
                  </span>
                </Button>
              </div>
            </div>
          </div>

          {/* Search bar */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cerca per nome utente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b border-gray-200 bg-gray-50">
              <TabsList className="grid w-full grid-cols-2 bg-transparent h-12 md:h-16">
                <TabsTrigger 
                  value="conversations" 
                  className="flex items-center gap-1 md:gap-3 h-10 md:h-12 text-sm md:text-base data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  <MessageSquare className="h-4 w-4 md:h-5 md:w-5" />
                  <span className="hidden sm:inline">Conversazioni Attive</span>
                  <span className="sm:hidden">Attive</span>
                  <span className="text-xs">({filteredActiveConversations.length})</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="archived" 
                  className="flex items-center gap-1 md:gap-3 h-10 md:h-12 text-sm md:text-base data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  <Archive className="h-4 w-4 md:h-5 md:w-5" />
                  <span className="hidden sm:inline">Archivio</span>
                  <span className="sm:hidden">Archivio</span>
                  <span className="text-xs">({filteredArchivedConversations.length})</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="conversations" className="p-3 md:p-6">
              {selectedConversation && selectedConversationType === 'active' ? (
                <ExpertChatDetailView
                  conversation={selectedConversation}
                  onBack={() => {
                    setSelectedConversation(null);
                    setSelectedConversationType('active');
                  }}
                />
              ) : (
                <div className="space-y-4">
                  {filteredActiveConversations.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {searchTerm ? 'Nessuna conversazione trovata' : 'Nessuna conversazione attiva'}
                      </h3>
                      <p className="text-gray-500">
                        {searchTerm ? 'Prova a modificare i termini di ricerca' : 'Le nuove conversazioni attive appariranno qui'}
                      </p>
                    </div>
                  ) : (
                    filteredActiveConversations.map((conversation) => (
                      <Card 
                        key={conversation.id} 
                        className="hover:shadow-md transition-all duration-200 border-l-4 border-l-drplant-green/30 hover:border-l-drplant-green"
                      >
                        <CardContent className="p-4 md:p-6">
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                              <div className="relative">
                                <Avatar className="h-10 md:h-12 w-10 md:w-12">
                                  <AvatarFallback className="bg-drplant-green/10 text-drplant-green font-semibold text-sm">
                                    {getInitials(conversation.user_profile?.first_name, conversation.user_profile?.last_name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className={`absolute -bottom-1 -right-1 w-3 md:w-4 h-3 md:h-4 rounded-full border-2 border-white ${
                                  conversation.user_profile?.is_online ? 'bg-green-500' : 'bg-gray-400'
                                }`} />
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                                  <h3 className="font-semibold text-gray-900 text-base md:text-lg truncate">
                                    {getUserDisplayName(conversation.user_profile)}
                                  </h3>
                                  <div className="flex gap-2">
                                    <Badge variant={conversation.user_profile?.is_online ? "default" : "secondary"} className="text-xs">
                                      {conversation.user_profile?.is_online ? 'Online' : 'Offline'}
                                    </Badge>
                                    <Badge variant="outline" className="bg-green-50 text-green-700 text-xs">
                                      Attiva
                                    </Badge>
                                    {getPriorityBadge(conversation)}
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4 text-xs md:text-sm text-gray-600">
                                  <div className="flex items-center gap-2">
                                    <Mail className="h-3 md:h-4 w-3 md:w-4 flex-shrink-0" />
                                    <span className="truncate">{conversation.user_profile?.email || 'N/A'}</span>
                                  </div>
                                  {conversation.user_profile?.phone && (
                                    <div className="flex items-center gap-2">
                                      <Phone className="h-3 md:h-4 w-3 md:w-4 flex-shrink-0" />
                                      <span className="truncate">{conversation.user_profile.phone}</span>
                                    </div>
                                  )}
                                  {conversation.user_profile?.address && (
                                    <div className="flex items-center gap-2">
                                      <MapPin className="h-3 md:h-4 w-3 md:w-4 flex-shrink-0" />
                                      <span className="truncate">{conversation.user_profile.address}</span>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                  <p className="text-xs md:text-sm text-gray-700 mb-2">
                                    <strong>Ultimo messaggio:</strong> 
                                    <span className="break-words block mt-1">
                                      {conversation.last_message_text && conversation.last_message_text.length > 100 
                                        ? `${conversation.last_message_text.substring(0, 100)}...` 
                                        : conversation.last_message_text}
                                    </span>
                                  </p>
                                  <div className="flex items-center gap-2 text-xs text-gray-500">
                                     <Clock className="h-3 w-3 flex-shrink-0" />
                                    <span className="truncate">Creato: {formatDate(conversation.created_at)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-center lg:justify-end gap-2">
                              <Button
                                onClick={() => {
                                  setSelectedConversation(conversation);
                                  setSelectedConversationType('active');
                                }}
                                className="bg-drplant-green hover:bg-drplant-green/90"
                                size="sm"
                              >
                                <MessageSquare className="h-4 w-4 mr-2" />
                                <span className="hidden sm:inline">Visualizza</span>
                              </Button>
                              <Button
                                onClick={() => handleArchiveConversation(conversation.id)}
                                variant="outline"
                                size="sm"
                                disabled={archivingConversation === conversation.id}
                                className="border-purple-200 text-purple-700 hover:bg-purple-50"
                              >
                                {archivingConversation === conversation.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Archive className="h-4 w-4" />
                                )}
                                <span className="hidden sm:inline ml-2">Concludi + Archivia</span>
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="archived" className="p-3 md:p-6">
              {selectedConversation && selectedConversationType === 'archived' ? (
                <ExpertChatDetailView
                  conversation={selectedConversation}
                  onBack={() => {
                    setSelectedConversation(null);
                    setSelectedConversationType('active');
                  }}
                />
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Archivio Conversazioni</h3>
                      <p className="text-sm text-gray-600">Conversazioni archiviate e completate</p>
                    </div>
                     {filteredArchivedConversations.length > 0 && (
                       <div className="text-sm text-gray-500">
                         {filteredArchivedConversations.length} conversazioni archiviate
                      </div>
                    )}
                  </div>

                 {filteredArchivedConversations.length === 0 ? (
                   <div className="text-center py-12">
                     <Archive className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                     <h3 className="text-lg font-medium text-gray-900 mb-2">
                       {searchTerm ? 'Nessuna conversazione archiviata trovata' : 'Nessuna conversazione archiviata'}
                     </h3>
                     <p className="text-gray-500">
                       {searchTerm ? 'Prova a modificare i termini di ricerca' : 'Le conversazioni archiviate appariranno qui'}
                     </p>
                   </div>
                 ) : (
                   filteredArchivedConversations.map((conversation) => (
                     <Card 
                       key={conversation.id} 
                       className="hover:shadow-md transition-all duration-200 border-l-4 border-l-purple-300 hover:border-l-purple-500"
                     >
                       <CardContent className="p-4 md:p-6">
                         <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                           <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                             <div className="relative">
                               <Avatar className="h-10 md:h-12 w-10 md:w-12">
                                 <AvatarFallback className="bg-purple-50 text-purple-700 font-semibold text-sm">
                                   {getInitials(conversation.user_profile?.first_name, conversation.user_profile?.last_name)}
                                 </AvatarFallback>
                               </Avatar>
                               <div className="absolute -bottom-1 -right-1 w-3 md:w-4 h-3 md:h-4 rounded-full border-2 border-white bg-purple-500" />
                             </div>
                             
                             <div className="flex-1 min-w-0">
                               <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                                 <h3 className="font-semibold text-gray-900 text-base md:text-lg truncate">
                                   {getUserDisplayName(conversation.user_profile)}
                                 </h3>
                                 <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs w-fit">
                                   Archiviata
                                 </Badge>
                               </div>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4 text-xs md:text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                  <Mail className="h-3 md:h-4 w-3 md:w-4 flex-shrink-0" />
                                  <span className="truncate">{conversation.user_profile?.email || 'N/A'}</span>
                                </div>
                                {conversation.user_profile?.phone && (
                                  <div className="flex items-center gap-2">
                                    <Phone className="h-3 md:h-4 w-3 md:w-4 flex-shrink-0" />
                                    <span className="truncate">{conversation.user_profile.phone}</span>
                                  </div>
                                )}
                                {conversation.user_profile?.address && (
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-3 md:h-4 w-3 md:w-4 flex-shrink-0" />
                                    <span className="truncate">{conversation.user_profile.address}</span>
                                  </div>
                                )}
                              </div>
                              
                              <div className="mt-3 p-3 bg-purple-50 rounded-lg">
                                <p className="text-xs md:text-sm text-gray-700 mb-2">
                                  <strong>Ultimo messaggio:</strong> 
                                  <span className="break-words block mt-1">
                                    {conversation.last_message_text && conversation.last_message_text.length > 100 
                                      ? `${conversation.last_message_text.substring(0, 100)}...` 
                                      : conversation.last_message_text}
                                  </span>
                                </p>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <Clock className="h-3 w-3 flex-shrink-0" />
                                  <span className="truncate">Creato: {formatDate(conversation.created_at)}</span>
                                </div>
                              </div>
                             </div>
                            </div>
                            
                            <div className="flex items-center justify-center lg:justify-end gap-2">
                               <Button
                                 onClick={() => {
                                   console.log('🔍 Opening archived conversation:', conversation.id);
                                   setSelectedConversation(conversation);
                                   setSelectedConversationType('archived');
                                 }}
                                 variant="outline"
                                 size="sm"
                                 className="border-purple-200 text-purple-700 hover:bg-purple-50"
                               >
                                <MessageSquare className="h-4 w-4 mr-2" />
                                <span className="hidden sm:inline">Visualizza</span>
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                  ))
                )}
              </div>
              )}
            </TabsContent>

          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalExpertDashboard;
