
import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { 
  MessageSquare, 
  Clock, 
  AlertCircle, 
  Loader2, 
  Users, 
  TrendingUp,
  Activity,
  CalendarIcon,
  Trash2,
  Eye,
  MoreHorizontal,
  Phone,
  Mail,
  MapPin,
  ArrowLeft,
  Filter,
  X,
  ArrowUpDown
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
  const [finishedConversations, setFinishedConversations] = useState<ConversationSummary[]>([]);
  
  // Date filter states
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [dateFilterOpen, setDateFilterOpen] = useState(false);
  const [filteredConversations, setFilteredConversations] = useState<ConversationSummary[]>([]);
  const [filteredFinishedConversations, setFilteredFinishedConversations] = useState<ConversationSummary[]>([]);
  
  // Sort order state
  const [sortOrder, setSortOrder] = useState<'recent' | 'oldest'>('recent');
  
  const [stats, setStats] = useState({
    totalConversations: 0,
    finishedConversations: 0,
    pendingConsultations: 0,
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

      // Load finished conversations
      const { data: finishedConversationsData, error: finishedError } = await supabase
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
              user_profile: profile
            };
          })
        );
        
        setConversations(conversationsWithProfiles);
        setFilteredConversations(conversationsWithProfiles); // Initialize filtered data

        // Process finished conversations
        const finishedConversationsWithProfiles = await Promise.all(
          (finishedConversationsData || []).map(async (conversation) => {
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
              user_profile: profile
            };
          })
        );
        
        setFinishedConversations(finishedConversationsWithProfiles);
        setFilteredFinishedConversations(finishedConversationsWithProfiles); // Initialize filtered data
        
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
          finishedConversations: finishedConversationsWithProfiles.length,
          pendingConsultations: 0, // Will be updated with consultations
          todayMessages: todayMessagesCount || 0,
          activeUsers: uniqueActiveUsers
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

  // Sort conversations by date
  const sortConversations = useCallback((convs: ConversationSummary[], order: 'recent' | 'oldest') => {
    return [...convs].sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return order === 'recent' ? dateB - dateA : dateA - dateB;
    });
  }, []);

  // Filter and sort conversations by date
  const filterConversationsByDate = useCallback((date: Date | undefined) => {
    let activeConvs = conversations;
    let finishedConvs = finishedConversations;

    if (date) {
      const filterByDate = (convs: ConversationSummary[]) => {
        return convs.filter(conv => {
          const convDate = new Date(conv.created_at);
          return convDate.toDateString() === date.toDateString();
        });
      };

      activeConvs = filterByDate(conversations);
      finishedConvs = filterByDate(finishedConversations);
    }

    // Apply sorting
    setFilteredConversations(sortConversations(activeConvs, sortOrder));
    setFilteredFinishedConversations(sortConversations(finishedConvs, sortOrder));
  }, [conversations, finishedConversations, sortOrder, sortConversations]);

  // Apply date filter when selectedDate, conversations, or sortOrder change
  useEffect(() => {
    filterConversationsByDate(selectedDate);
  }, [selectedDate, filterConversationsByDate]);

  // Toggle sort order
  const toggleSortOrder = () => {
    const newOrder = sortOrder === 'recent' ? 'oldest' : 'recent';
    setSortOrder(newOrder);
  };

  // Clear date filter
  const clearDateFilter = () => {
    setSelectedDate(undefined);
    setDateFilterOpen(false);
  };

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dateFilterOpen) {
        const target = event.target as Element;
        if (!target.closest('[data-radix-popper-content-wrapper]') && 
            !target.closest('button[data-state]')) {
          setDateFilterOpen(false);
        }
      }
    };

    if (dateFilterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [dateFilterOpen]);

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
      
      // Usa force-delete-conversation endpoint per eliminazione forzata
      const { data, error } = await supabase.functions.invoke('force-delete-conversation', {
        body: { conversationId }
      });

      if (error) {
        throw new Error(error.message || 'Errore durante l\'eliminazione della conversazione');
      }

      const success = data?.success;
      
      if (!success) {
        throw new Error('Errore durante l\'eliminazione della conversazione');
      }
      
      console.log('✅ Conversation deleted successfully');
      
      // Aggiorna immediatamente l'UI rimuovendo la conversazione dalle liste
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      setFilteredConversations(prev => prev.filter(conv => conv.id !== conversationId));
      setFinishedConversations(prev => prev.filter(conv => conv.id !== conversationId));
      setFilteredFinishedConversations(prev => prev.filter(conv => conv.id !== conversationId));
      
      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(null);
      }
      
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
            <div className="flex items-center gap-4">
              {/* Back Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={goBackToMain}
                className="flex items-center gap-2 text-drplant-blue hover:text-drplant-blue-dark"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Torna alla Dashboard</span>
                <span className="sm:hidden">Indietro</span>
              </Button>
              
              <div className="text-center md:text-left">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Dashboard Professionale</h1>
                <p className="text-gray-600">Gestione conversazioni e consultazioni - Marco Nigro</p>
              </div>
            </div>
            <div className="flex items-center justify-center md:justify-end gap-3">
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
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-6">
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

          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardContent className="p-3 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium text-red-600 mb-1">Conversazioni Finite</p>
                  <p className="text-xl md:text-3xl font-bold text-red-900">{stats.finishedConversations}</p>
                </div>
                <AlertCircle className="h-6 md:h-8 w-6 md:w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
            <CardContent className="p-3 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium text-amber-600 mb-1">Consultazioni in Attesa</p>
                  <p className="text-xl md:text-3xl font-bold text-amber-900">{stats.pendingConsultations}</p>
                </div>
                <Clock className="h-6 md:h-8 w-6 md:w-8 text-amber-600" />
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

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
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
                <Popover modal={true}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[240px] justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP", { locale: it }) : <span>Seleziona una data</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start" sideOffset={5}>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        setSelectedDate(date);
                      }}
                      initialFocus
                      className="p-3"
                    />
                  </PopoverContent>
                </Popover>
                
                {selectedDate && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearDateFilter}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
                
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
            
            {selectedDate && (
              <div className="mt-3 text-sm text-gray-600">
                Mostrando conversazioni del: <span className="font-medium">{format(selectedDate, "PPP", { locale: it })}</span>
              </div>
            )}
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b border-gray-200 bg-gray-50">
              <TabsList className="grid w-full grid-cols-3 bg-transparent h-12 md:h-16">
                <TabsTrigger 
                  value="conversations" 
                  className="flex items-center gap-1 md:gap-3 h-10 md:h-12 text-sm md:text-base data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  <MessageSquare className="h-4 w-4 md:h-5 md:w-5" />
                  <span className="hidden sm:inline">Conversazioni Attive</span>
                  <span className="sm:hidden">Attive</span>
                  <span className="text-xs">({filteredConversations.length})</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="finished" 
                  className="flex items-center gap-1 md:gap-3 h-10 md:h-12 text-sm md:text-base data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  <AlertCircle className="h-4 w-4 md:h-5 md:w-5" />
                  <span className="hidden sm:inline">Conversazioni Finite</span>
                  <span className="sm:hidden">Finite</span>
                  <span className="text-xs">({filteredFinishedConversations.length})</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="consultations" 
                  className="flex items-center gap-1 md:gap-3 h-10 md:h-12 text-sm md:text-base data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  <Clock className="h-4 w-4 md:h-5 md:w-5" />
                  <span className="hidden sm:inline">Consultazioni</span>
                  <span className="sm:hidden">Cons.</span>
                  <span className="text-xs">({consultations.length})</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="conversations" className="p-3 md:p-6">
              {selectedConversation ? (
                <ExpertChatDetailView
                  conversation={selectedConversation}
                  onBack={() => setSelectedConversation(null)}
                />
              ) : (
                <div className="space-y-4">
                  {filteredConversations.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Nessuna conversazione attiva</h3>
                      <p className="text-gray-500">Le nuove conversazioni attive appariranno qui</p>
                    </div>
                  ) : (
                    filteredConversations.map((conversation) => (
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
                                    <Calendar className="h-3 w-3 flex-shrink-0" />
                                    <span className="truncate">Creato: {formatDate(conversation.created_at)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-center lg:justify-end gap-2">
                              <Button
                                onClick={() => setSelectedConversation(conversation)}
                                className="bg-drplant-green hover:bg-drplant-green/90"
                                size="sm"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                <span className="hidden sm:inline">Visualizza</span>
                              </Button>
                              <Button
                                onClick={() => handleForceDeleteConversation(conversation.id)}
                                variant="destructive"
                                size="sm"
                                disabled={deletingConversation === conversation.id}
                              >
                                {deletingConversation === conversation.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                                <span className="hidden sm:inline ml-2">Elimina</span>
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

            <TabsContent value="finished" className="p-3 md:p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Conversazioni Finite</h3>
                    <p className="text-sm text-gray-600">Gestisci le conversazioni completate che possono essere eliminate</p>
                  </div>
                  {filteredFinishedConversations.length > 0 && (
                    <div className="text-sm text-gray-500">
                      {filteredFinishedConversations.length} conversazioni finite
                    </div>
                  )}
                </div>

                {filteredFinishedConversations.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Nessuna conversazione finita</h3>
                    <p className="text-gray-500">Le conversazioni completate appariranno qui</p>
                  </div>
                ) : (
                  filteredFinishedConversations.map((conversation) => (
                    <Card 
                      key={conversation.id} 
                      className="hover:shadow-md transition-all duration-200 border-l-4 border-l-red-300 hover:border-l-red-500"
                    >
                      <CardContent className="p-4 md:p-6">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                            <div className="relative">
                              <Avatar className="h-10 md:h-12 w-10 md:w-12">
                                <AvatarFallback className="bg-red-50 text-red-700 font-semibold text-sm">
                                  {getInitials(conversation.user_profile?.first_name, conversation.user_profile?.last_name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="absolute -bottom-1 -right-1 w-3 md:w-4 h-3 md:h-4 rounded-full border-2 border-white bg-red-500" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                                <h3 className="font-semibold text-gray-900 text-base md:text-lg truncate">
                                  {getUserDisplayName(conversation.user_profile)}
                                </h3>
                                <Badge variant="destructive" className="text-xs w-fit">
                                  Finita
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
                              
                              <div className="mt-3 p-3 bg-red-50 rounded-lg">
                                <p className="text-xs md:text-sm text-gray-700 mb-2">
                                  <strong>Ultimo messaggio:</strong> 
                                  <span className="break-words block mt-1">
                                    {conversation.last_message_text && conversation.last_message_text.length > 100 
                                      ? `${conversation.last_message_text.substring(0, 100)}...` 
                                      : conversation.last_message_text}
                                  </span>
                                </p>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <Calendar className="h-3 w-3 flex-shrink-0" />
                                  <span className="truncate">Creato: {formatDate(conversation.created_at)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-center lg:justify-end gap-2">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="bg-red-600 hover:bg-red-700 w-full lg:w-auto"
                                  disabled={deletingConversation === conversation.id}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  <span className="hidden sm:inline">Elimina Definitivamente</span>
                                  <span className="sm:hidden">Elimina</span>
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-white">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Elimina conversazione finita</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Sei sicuro di voler eliminare definitivamente questa conversazione finita con {getUserDisplayName(conversation.user_profile)}? 
                                    Questa azione non può essere annullata e verranno eliminati tutti i messaggi e i dati associati.
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
                                        Elimina Definitivamente
                                      </>
                                    )}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
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
