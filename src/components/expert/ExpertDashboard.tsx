
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Clock, CheckCircle, AlertCircle, User, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';

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
  };
}

interface ConversationSummary {
  id: string;
  user_id: string;
  last_message_text: string;
  last_message_timestamp: string;
  status: string;
  user_profile?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

const ExpertDashboard = () => {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExpertData();
    
    // Subscribe to real-time updates
    const consultationsChannel = supabase
      .channel('expert-consultations')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'expert_consultations' },
        () => loadExpertData()
      )
      .subscribe();

    const conversationsChannel = supabase
      .channel('expert-conversations')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'conversations' },
        () => loadExpertData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(consultationsChannel);
      supabase.removeChannel(conversationsChannel);
    };
  }, []);

  const loadExpertData = async () => {
    try {
      // Load consultations
      const { data: consultationsData, error: consultationsError } = await supabase
        .from('expert_consultations')
        .select(`
          *,
          user_profile:user_id (
            first_name,
            last_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (consultationsError) {
        console.error('Error loading consultations:', consultationsError);
      } else {
        setConsultations(consultationsData || []);
      }

      // Load conversations
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('conversations')
        .select(`
          *,
          user_profile:user_id (
            first_name,
            last_name,
            email
          )
        `)
        .eq('expert_id', 'premium-user-id')
        .order('updated_at', { ascending: false });

      if (conversationsError) {
        console.error('Error loading conversations:', conversationsError);
      } else {
        setConversations(conversationsData || []);
      }
    } catch (error) {
      console.error('Error loading expert data:', error);
      toast.error('Errore nel caricamento dei dati');
    } finally {
      setLoading(false);
    }
  };

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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Caricamento dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Esperto</h1>
        <div className="flex gap-4">
          <Card className="px-4 py-2">
            <div className="text-sm text-gray-500">Consultazioni Attive</div>
            <div className="text-2xl font-bold text-blue-600">
              {consultations.filter(c => c.status !== 'completed').length}
            </div>
          </Card>
          <Card className="px-4 py-2">
            <div className="text-sm text-gray-500">Conversazioni</div>
            <div className="text-2xl font-bold text-green-600">
              {conversations.length}
            </div>
          </Card>
        </div>
      </div>

      <Tabs defaultValue="consultations" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="consultations">Consultazioni</TabsTrigger>
          <TabsTrigger value="conversations">Conversazioni</TabsTrigger>
        </TabsList>

        <TabsContent value="consultations" className="space-y-4">
          {consultations.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                Nessuna consultazione disponibile
              </CardContent>
            </Card>
          ) : (
            consultations.map((consultation) => (
              <Card key={consultation.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {getInitials(consultation.user_profile?.first_name, consultation.user_profile?.last_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {consultation.user_profile?.first_name} {consultation.user_profile?.last_name}
                        </div>
                        <div className="text-sm text-gray-500">{consultation.user_profile?.email}</div>
                      </div>
                    </CardTitle>
                    {getStatusBadge(consultation.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Sintomi:</h4>
                    <p className="text-gray-700">{consultation.symptoms || 'Nessun sintomo specificato'}</p>
                  </div>
                  
                  {consultation.plant_info && (
                    <div>
                      <h4 className="font-medium mb-2">Informazioni Pianta:</h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>Ambiente: {consultation.plant_info.isIndoor ? 'Interno' : 'Esterno'}</div>
                        <div>Irrigazione: {consultation.plant_info.wateringFrequency || 'Non specificata'} volte/settimana</div>
                        <div>Esposizione luce: {consultation.plant_info.lightExposure || 'Non specificata'}</div>
                      </div>
                    </div>
                  )}

                  {consultation.image_url && (
                    <div>
                      <h4 className="font-medium mb-2">Immagine:</h4>
                      <img 
                        src={consultation.image_url} 
                        alt="Pianta" 
                        className="w-32 h-32 object-cover rounded-lg"
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="h-4 w-4" />
                    {formatDistanceToNow(new Date(consultation.created_at), { 
                      addSuffix: true, 
                      locale: it 
                    })}
                  </div>

                  <div className="flex gap-2">
                    {consultation.status === 'pending' && (
                      <Button
                        onClick={() => updateConsultationStatus(consultation.id, 'in_progress')}
                        size="sm"
                      >
                        Prendi in Carico
                      </Button>
                    )}
                    {consultation.status === 'in_progress' && (
                      <Button
                        onClick={() => updateConsultationStatus(consultation.id, 'completed')}
                        size="sm"
                        variant="outline"
                      >
                        Segna come Completato
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="conversations" className="space-y-4">
          {conversations.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                Nessuna conversazione disponibile
              </CardContent>
            </Card>
          ) : (
            conversations.map((conversation) => (
              <Card key={conversation.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {getInitials(conversation.user_profile?.first_name, conversation.user_profile?.last_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {conversation.user_profile?.first_name} {conversation.user_profile?.last_name}
                        </div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {conversation.last_message_text || 'Nessun messaggio'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">
                        {conversation.last_message_timestamp && 
                          formatDistanceToNow(new Date(conversation.last_message_timestamp), {
                            addSuffix: true,
                            locale: it
                          })
                        }
                      </div>
                      <Button size="sm" variant="outline" className="mt-2">
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Apri Chat
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExpertDashboard;
