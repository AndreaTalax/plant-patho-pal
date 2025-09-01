
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { 
  MessageCircle, 
  User, 
  Calendar, 
  RefreshCw, 
  Search,
  Clock,
  Trash2,
  Archive,
  ChevronRight,
  Filter
} from 'lucide-react';
import { DatabaseConversation } from '@/services/chat/types';

interface ConversationWithProfile extends DatabaseConversation {
  user_profile?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    avatar_url?: string;
  };
  message_count?: number;
}

const ProfessionalExpertDashboard = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadConversations = useCallback(async () => {
    try {
      console.log('🔄 Caricamento conversazioni per esperto...');
      setLoading(true);

      const { data, error } = await supabase.functions.invoke('get-conversations');

      if (error) {
        console.error('❌ Errore nel caricamento conversazioni:', error);
        toast.error('Errore nel caricamento delle conversazioni');
        return;
      }

      if (data?.conversations) {
        console.log('✅ Conversazioni caricate:', data.conversations.length);
        setConversations(data.conversations);
      } else {
        console.log('📭 Nessuna conversazione trovata');
        setConversations([]);
      }
    } catch (error) {
      console.error('❌ Errore imprevisto:', error);
      toast.error('Errore nel caricamento delle conversazioni');
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const handleDeleteConversation = async (conversationId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questa conversazione?')) {
      return;
    }

    try {
      const { error } = await supabase.functions.invoke('force-delete-conversation', {
        body: { conversationId }
      });

      if (error) {
        toast.error('Errore nell\'eliminazione della conversazione');
        return;
      }

      toast.success('Conversazione eliminata con successo');
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      
      if (selectedConversation === conversationId) {
        setSelectedConversation(null);
      }
    } catch (error) {
      console.error('Errore eliminazione:', error);
      toast.error('Errore nell\'eliminazione della conversazione');
    }
  };

  const handleArchiveConversation = async (conversationId: string) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ status: 'archived' })
        .eq('id', conversationId);

      if (error) {
        toast.error('Errore nell\'archiviazione della conversazione');
        return;
      }

      toast.success('Conversazione archiviata');
      loadConversations();
    } catch (error) {
      console.error('Errore archiviazione:', error);
      toast.error('Errore nell\'archiviazione della conversazione');
    }
  };

  const filteredConversations = conversations.filter(conv => {
    // Filtro per testo di ricerca
    const matchesSearch = !searchQuery || 
      conv.user_profile?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.user_profile?.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.user_profile?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.last_message_text?.toLowerCase().includes(searchQuery.toLowerCase());

    // Filtro per status
    const matchesStatus = statusFilter === 'all' || conv.status === statusFilter;

    // Filtro per data - corretto per confrontare solo la data
    let matchesDate = true;
    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      const conversationDate = conv.last_message_at ? new Date(conv.last_message_at) : new Date(conv.created_at);
      
      // Confronta solo la data (ignora l'ora)
      const filterDateString = filterDate.toISOString().split('T')[0];
      const conversationDateString = conversationDate.toISOString().split('T')[0];
      
      matchesDate = conversationDateString === filterDateString;
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  const formatDateTime = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Data non valida';
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return 'Data non valida';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-6 w-6 animate-spin text-drplant-green" />
            <span>Caricamento conversazioni...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard Esperto</h1>
        <p className="text-muted-foreground">
          Gestisci le conversazioni con gli utenti
        </p>
      </div>

      {/* Filtri e Ricerca */}
      <Card className="mb-6">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtri e Ricerca
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Cerca</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nome, email, messaggio..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Data ultimo messaggio</label>
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <select
                className="w-full p-2 border border-input bg-background rounded-md"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Tutti</option>
                <option value="active">Attive</option>
                <option value="archived">Archiviate</option>
                <option value="finished">Finite</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Azioni</label>
              <div className="flex gap-2">
                <Button
                  onClick={loadConversations}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Aggiorna
                </Button>
                <Button
                  onClick={() => {
                    setSearchQuery('');
                    setDateFilter('');
                    setStatusFilter('all');
                  }}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  Reset
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiche */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <MessageCircle className="h-8 w-8 text-drplant-green" />
              <div>
                <p className="text-sm text-muted-foreground">Totale</p>
                <p className="text-2xl font-bold">{conversations.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <MessageCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Attive</p>
                <p className="text-2xl font-bold">
                  {conversations.filter(c => c.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Archive className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Archiviate</p>
                <p className="text-2xl font-bold">
                  {conversations.filter(c => c.status === 'archived').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <User className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Utenti Unici</p>
                <p className="text-2xl font-bold">
                  {new Set(conversations.map(c => c.user_id)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista Conversazioni */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Conversazioni ({filteredConversations.length})</span>
            <Badge variant="secondary">
              {filteredConversations.length} / {conversations.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nessuna conversazione trovata</p>
              </div>
            ) : (
              <div className="space-y-1 p-4">
                {filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`p-4 rounded-lg border transition-colors cursor-pointer hover:bg-accent ${
                      selectedConversation === conversation.id ? 'bg-accent border-drplant-green' : ''
                    }`}
                    onClick={() => setSelectedConversation(
                      selectedConversation === conversation.id ? null : conversation.id
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="font-medium truncate">
                            {conversation.user_profile?.first_name || conversation.user_profile?.last_name
                              ? `${conversation.user_profile.first_name || ''} ${conversation.user_profile.last_name || ''}`.trim()
                              : conversation.user_profile?.email || 'Utente sconosciuto'
                            }
                          </span>
                          <Badge 
                            variant={conversation.status === 'active' ? 'default' : 'secondary'}
                            className={conversation.status === 'active' ? 'bg-green-100 text-green-800' : ''}
                          >
                            {conversation.status === 'active' ? 'Attiva' : 
                             conversation.status === 'archived' ? 'Archiviata' : 'Finita'}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground mb-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            <span>Creata: {formatDate(conversation.created_at)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3" />
                            <span>
                              Ultimo messaggio: {formatDateTime(conversation.last_message_at)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MessageCircle className="h-3 w-3" />
                            <span>{conversation.message_count || 0} messaggi</span>
                          </div>
                        </div>

                        {conversation.last_message_text && (
                          <div className="bg-muted/50 p-2 rounded text-sm">
                            <p className="text-muted-foreground mb-1">Ultimo messaggio:</p>
                            <p className="truncate">
                              {conversation.last_message_text.length > 100
                                ? conversation.last_message_text.substring(0, 100) + '...'
                                : conversation.last_message_text
                              }
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleArchiveConversation(conversation.id);
                          }}
                          disabled={conversation.status === 'archived'}
                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteConversation(conversation.id);
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>

                    {selectedConversation === conversation.id && (
                      <>
                        <Separator className="my-3" />
                        <div className="space-y-2 text-sm">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="font-medium mb-2">Informazioni Utente</p>
                              <div className="space-y-1 text-muted-foreground">
                                <p>Email: {conversation.user_profile?.email || 'N/A'}</p>
                                <p>Nome: {conversation.user_profile?.first_name || 'N/A'}</p>
                                <p>Cognome: {conversation.user_profile?.last_name || 'N/A'}</p>
                              </div>
                            </div>
                            <div>
                              <p className="font-medium mb-2">Dettagli Conversazione</p>
                              <div className="space-y-1 text-muted-foreground">
                                <p>ID: {conversation.id}</p>
                                <p>Titolo: {conversation.title || 'N/A'}</p>
                                <p>Data creazione: {formatDateTime(conversation.created_at)}</p>
                                <p>Data ultimo aggiornamento: {formatDateTime(conversation.updated_at)}</p>
                                <p>Data ultimo messaggio: {formatDateTime(conversation.last_message_at)}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfessionalExpertDashboard;
