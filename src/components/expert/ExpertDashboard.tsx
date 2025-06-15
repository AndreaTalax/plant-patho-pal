import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Clock, CheckCircle, AlertCircle, User, Calendar, Trash2 } from 'lucide-react';
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
  user_profile?: {
    first_name: string;
    last_name: string;
    email: string;
  } | null;
}

/**
 * Loads and manages expert data including consultations and conversations, with real-time updates and error handling.
 * @example
 * expertDashboard()
 * // no return value
 * @param {void} No arguments are required for this function.
 * @returns {JSX.Element} Returns a JSX element representing the expert dashboard interface.
 * @description
 *   - Utilizes Supabase for fetching and subscribing to real-time updates for consultations and conversations.
 *   - Manages state for loading status, consultations, and conversations.
 *   - Provides helper functions for handling consultation status updates and formatting user information.
 */
const ExpertDashboard = () => {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingConsultation, setDeletingConsultation] = useState<string | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<ConversationSummary | null>(null);

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

  /**
   * Synchronizes expert consultations and conversations with user profiles.
   * @example
   * sync()
   * // Initiates synchronization process
   * @returns {void} No return value.
   * @description
   *   - Retrieves consultations and conversations from the Supabase database.
   *   - Maps user profiles to each consultation and conversation based on the user_id.
   *   - Displays error messages in the console and shows a toast notification on failure.
   */
  const loadExpertData = async () => {
    try {
      // Load consultations first
      const { data: consultationsData, error: consultationsError } = await supabase
        .from('expert_consultations')
        .select('*')
        .order('created_at', { ascending: false });

      if (consultationsError) {
        console.error('Error loading consultations:', consultationsError);
      } else {
        // Now get user profiles for each consultation
        const consultationsWithProfiles = await Promise.all(
          (consultationsData || []).map(async (consultation) => {
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('first_name, last_name, email')
              .eq('id', consultation.user_id)
              .maybeSingle();
            
            if (profileError) {
              console.error('Error fetching profile for user:', consultation.user_id, profileError);
            }
            
            return {
              ...consultation,
              user_profile: profile
            };
          })
        );
        
        setConsultations(consultationsWithProfiles);
      }

      // Load conversations - Fix: Use the actual UUID instead of string
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('conversations')
        .select('*')
        .eq('expert_id', MARCO_NIGRO_ID)
        .order('updated_at', { ascending: false });

      if (conversationsError) {
        console.error('Error loading conversations:', conversationsError);
      } else {
        // Get user profiles for each conversation and map to ConversationSummary format
        const conversationsWithProfiles = await Promise.all(
          (conversationsData || []).map(async (conversation) => {
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('first_name, last_name, email')
              .eq('id', conversation.user_id)
              .maybeSingle();
            
            if (profileError) {
              console.error('Error fetching profile for user:', conversation.user_id, profileError);
            }
            
            return {
              id: conversation.id,
              user_id: conversation.user_id,
              last_message_text: conversation.last_message_at ? 'Recent message' : 'No messages yet',
              last_message_timestamp: conversation.last_message_at,
              status: conversation.status || 'active',
              user_profile: profile
            };
          })
        );
        
        setConversations(conversationsWithProfiles);
      }
    } catch (error) {
      console.error('Error loading expert data:', error);
      toast.error('Errore nel caricamento dei dati');
    } finally {
      setLoading(false);
    }
  };

  /**
  * Updates the consultation status in the database and provides user feedback
  * @example
  * sync('12345', 'completed')
  * // Updates the status of consultation with id '12345' to 'completed' and shows a success or error toast message
  * @param {string} consultationId - The unique identifier of the consultation to be updated.
  * @param {string} newStatus - The new status to be set for the consultation.
  * @returns {void} No return value.
  * @description
  *   - Utilizes Supabase as the backend service to update the consultation status in the database.
  *   - Provides user feedback for success or failure using toast notifications.
  *   - Reloads expert data upon successful update to ensure the UI reflects the current state.
  */
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

  /**
  * Returns a styled badge component based on the provided status.
  * @example
  * getBadgeComponent('pending')
  * "<Badge variant='outline' className='text-yellow-600'><Clock className='h-3 w-3 mr-1' />In attesa</Badge>"
  * @param {string} status - The status to determine the badge styling.
  * @returns {JSX.Element} Returns a badge element with specific styling and icon based on the status.
  * @description
  *   - Supports multiple predefined status values: 'pending', 'in_progress', 'completed'.
  *   - Each status maps to a specific color and icon in the badge.
  *   - If the status does not match any predefined values, it returns a default badge with the status text.
  *   - Ensure that the status strings are passed in English, even though the display text is in Italian.
  */
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Caricamento dashboard...</div>
      </div>
    );
  }

  // Nuova funzione per Apri Chat (apre la dettaglio view)
  const handleOpenChat = (conversation: ConversationSummary) => {
    setSelectedConversation(conversation);
  };

  // Funzione per tornare indietro dalla chat dettaglio
  const handleCloseChat = () => {
    setSelectedConversation(null);
  };

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
                  Nessuna conversazione disponibile
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
                />
              ))
            )
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExpertDashboard;
