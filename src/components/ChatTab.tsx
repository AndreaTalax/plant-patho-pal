
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { UserChatViewRealtime } from './chat/UserChatViewRealtime';
import { ConnectionStatus } from './ConnectionStatus';
import { MessageCircle, Crown, FileText, Trash2, Bell } from 'lucide-react';
import { usePremiumStatus } from '@/services/premiumService';
import { Button } from '@/components/ui/button';
import { PremiumPaywallModal } from './diagnose/PremiumPaywallModal';
import { supabase } from '@/integrations/supabase/client';
import { MARCO_NIGRO_ID } from '@/components/phytopathologist';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ActiveConversation {
  id: string;
  status: 'active' | 'archived';
  last_message_text?: string;
  last_message_at?: string;
  created_at: string;
  unread_count?: number;
  conversation_type?: string;
}

const ChatTab = () => {
  const { isAuthenticated, user, userProfile } = useAuth();
  const { t } = useTheme();
  const { hasExpertChatAccess } = usePremiumStatus();
  const [showPaywall, setShowPaywall] = useState(false);
  const [activeConversations, setActiveConversations] = useState<ActiveConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  // Determina se si tratta di una chat professionale dalla conversazione selezionata
  const selectedConversation = activeConversations.find(c => c.id === selectedConversationId);
  const isProfessionalChat = selectedConversation?.conversation_type === 'professional_quote';

  // Controlla le conversazioni attive dell'utente
  useEffect(() => {
    const checkActiveConversations = async () => {
      if (!isAuthenticated || !user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        console.log('🔍 ChatTab: Controllo conversazioni per utente:', user.id);
        const { data: conversations, error } = await supabase
          .from('conversations')
          .select('id, status, last_message_text, last_message_at, created_at, updated_at, conversation_type')
          .eq('user_id', user.id)
          .eq('expert_id', MARCO_NIGRO_ID)
          .eq('status', 'active') // Solo conversazioni attive
          .order('last_message_at', { ascending: false });

        if (error) {
          console.error('❌ ChatTab: Errore nel controllo conversazioni:', error);
          setActiveConversations([]);
        } else {
          console.log('✅ ChatTab: Conversazioni attive trovate:', conversations);
          const list = (conversations || []) as ActiveConversation[];

          // Conta i messaggi non letti per ogni conversazione
          for (const conv of list) {
            const { count } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('conversation_id', conv.id)
              .eq('recipient_id', user.id)
              .eq('read', false);
            
            conv.unread_count = count || 0;
          }

          setActiveConversations(list);
          
          // Controlla se c'è una conversazione da aprire automaticamente (da preventivo professionale)
          const openConvId = localStorage.getItem('openConversationId');
          if (openConvId) {
            console.log('📂 Opening conversation from professional quote:', openConvId);
            setSelectedConversationId(openConvId);
            localStorage.removeItem('openConversationId');
          } 
          // Se non c'è una conversazione da aprire e c'è una sola conversazione, selezionala
          else if (list.length === 1) {
            setSelectedConversationId(list[0].id);
          }
        }
      } catch (error) {
        console.error('❌ ChatTab: Errore nel controllo conversazioni:', error);
        setActiveConversations([]);
      } finally {
        setIsLoading(false);
      }
    };

    checkActiveConversations();

    // Listener per aprire una conversazione specifica (da link email)
    const handleOpenConversation = (event: CustomEvent) => {
      const { conversationId } = event.detail;
      console.log('📧 Opening conversation from email link:', conversationId);
      setSelectedConversationId(conversationId);
    };

    window.addEventListener('openConversation', handleOpenConversation as EventListener);

    // Ascolta per aggiornamenti dopo la sincronizzazione dei dati della pianta
    const handlePlantDataSynced = () => {
      console.log('🔄 ChatTab: Ricontrollo conversazioni dopo sincronizzazione dati');
      setIsLoading(true);
      setTimeout(checkActiveConversations, 1000);
    };

    // Ascolta quando viene fatto il switch al tab chat
    const handleTabSwitch = (event: CustomEvent) => {
      if (event.detail === 'chat') {
        console.log('🔄 ChatTab: Forzo ricontrollo conversazioni per switch tab');
        setIsLoading(true);
        setTimeout(checkActiveConversations, 500);
      }
    };

    window.addEventListener('plantDataSynced', handlePlantDataSynced);
    window.addEventListener('switchTab', handleTabSwitch as EventListener);
    
    return () => {
      window.removeEventListener('plantDataSynced', handlePlantDataSynced);
      window.removeEventListener('switchTab', handleTabSwitch as EventListener);
      window.removeEventListener('openConversation', handleOpenConversation as EventListener);
    };
  }, [isAuthenticated, user?.id]);

  // Funzione per eliminare una conversazione
  const handleDeleteConversation = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Previeni l'apertura della conversazione
    
    if (!confirm('Sei sicuro di voler eliminare questa conversazione? Questa azione non può essere annullata.')) {
      return;
    }

    try {
      console.log('🗑️ Eliminazione conversazione:', conversationId);
      
      // Usa la edge function per eliminare
      const { error } = await supabase.functions.invoke('delete-conversation', {
        body: { conversationId }
      });

      if (error) {
        console.error('❌ Errore edge function:', error);
        alert('Errore nell\'eliminazione della conversazione');
        return;
      }

      // Rimuovi immediatamente dalla lista locale
      setActiveConversations(prev => prev.filter(c => c.id !== conversationId));
      
      // Se era la conversazione selezionata, deselezionala
      if (selectedConversationId === conversationId) {
        setSelectedConversationId(null);
      }

      console.log('✅ Conversazione eliminata con successo');
    } catch (error) {
      console.error('❌ Errore nell\'eliminazione:', error);
      alert('Errore nell\'eliminazione della conversazione');
    }
  };


  if (!isAuthenticated || !user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <MessageCircle className="h-16 w-16 mx-auto mb-6 text-drplant-green" />
          <h2 className="text-2xl font-bold mb-4">{t('accessToUseChat')}</h2>
          <p className="text-gray-600">
            {t('accessDescription')}
          </p>
        </div>
      </div>
    );
  }

  // Mostra loading mentre controlla la conversazione
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-drplant-green mx-auto mb-4"></div>
          <p className="text-gray-600">{t('chatLoading')}</p>
        </div>
      </div>
    );
  }

  // Se l'utente non ha accesso premium E non ha conversazioni attive, mostra paywall
  // Le conversazioni esistenti (professionali o consulenze completate) bypassano il paywall
  if (!hasExpertChatAccess && activeConversations.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <Crown className="h-16 w-16 mx-auto mb-6 text-amber-500" />
          <h2 className="text-2xl font-bold mb-4">{t('premiumChat')}</h2>
          <p className="text-gray-600 mb-6">
            {t('premiumChatDescription')}
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800 text-sm">
              💡 <strong>{t('remember')}:</strong> {t('aiDiagnosisRemainsFree')}
            </p>
          </div>
          
          <Button
            onClick={() => setShowPaywall(true)}
            className="bg-drplant-green hover:bg-drplant-green-dark"
            size="lg"
          >
            <Crown className="h-5 w-5 mr-2" />
            {t('upgradeToPremium')}
          </Button>
          
          <PremiumPaywallModal
            open={showPaywall}
            onClose={() => setShowPaywall(false)}
          />
        </div>
      </div>
    );
  }

  // Se l'utente ha conversazioni attive, può accedere sempre (anche senza premium)
  // Questo include richieste professionali e consulenze esperto completate
  if (activeConversations.length > 0) {
    // Se è stata selezionata una conversazione specifica, mostra la chat
    if (selectedConversationId) {
      const selectedConversation = activeConversations.find(c => c.id === selectedConversationId);
      const isProfessionalChat = selectedConversation?.conversation_type === 'professional_quote';

      return (
        <div className="h-[calc(100vh-8rem)]">
          <ConnectionStatus />
          <UserChatViewRealtime 
            userId={user.id} 
            conversationId={selectedConversationId}
            onBackToList={() => setSelectedConversationId(null)}
            isProfessionalChat={isProfessionalChat}
          />
        </div>
      );
    }

    // Mostra la lista delle conversazioni attive
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">{t('yourActiveConversations')}</h2>
            <p className="text-gray-600">
              {t('clickToViewDetails')}
            </p>
          </div>
          <div className="space-y-4">
            {activeConversations.map((conversation) => (
              <Card 
                key={conversation.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedConversationId(conversation.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">
                        {t('conversationWithExpert')}
                      </CardTitle>
                      {conversation.unread_count && conversation.unread_count > 0 && (
                        <div className="relative">
                          <Bell className="h-5 w-5 text-primary animate-pulse" />
                          <Badge 
                            variant="destructive" 
                            className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                          >
                            {conversation.unread_count}
                          </Badge>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={conversation.status === 'active' ? 'default' : 'secondary'}
                        className="bg-green-100 text-green-800"
                      >
                        {t('conversationActive')}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleDeleteConversation(conversation.id, e)}
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription>
                    {t('startedOn')} {new Date(conversation.created_at).toLocaleDateString(t('language') === 'it' ? 'it-IT' : 'en-US', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {conversation.last_message_text && (
                    <div className="mb-3">
                      <p className="text-sm text-gray-600 mb-1">{t('lastMessage')}:</p>
                      <p className="text-sm bg-gray-50 p-2 rounded truncate">
                        {conversation.last_message_text.length > 100 
                          ? conversation.last_message_text.substring(0, 100) + '...'
                          : conversation.last_message_text
                        }
                      </p>
                    </div>
                  )}
                  {conversation.last_message_at && (
                    <p className="text-xs text-gray-500">
                      {t('lastUpdate')}: {new Date(conversation.last_message_at).toLocaleString(t('language') === 'it' ? 'it-IT' : 'en-US')}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-8">
            <div className="text-center">
              <Button
                onClick={() => {
                  const event = new CustomEvent('switchTab', { detail: 'diagnose' });
                  window.dispatchEvent(event);
                }}
                variant="outline"
              >
                <FileText className="h-4 w-4 mr-2" />
                {t('newDiagnosis')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Se l'utente ha accesso premium ma non ha conversazioni attive, suggerisci diagnosi
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto text-center">
        <MessageCircle className="h-16 w-16 mx-auto mb-6 text-drplant-green" />
        <h2 className="text-2xl font-bold mb-4">{t('chatWithPhytopathologist')}</h2>
        <p className="text-gray-600 mb-6">
          {t('toStartConversation')}
        </p>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-blue-800 text-sm">
            <FileText className="inline h-4 w-4 mr-1" />
            <strong>{t('howItWorks')}:</strong> {t('diagnosisProcess')}
          </p>
        </div>
        
        <Button
          onClick={() => {
            const event = new CustomEvent('switchTab', { detail: 'diagnose' });
            window.dispatchEvent(event);
          }}
          className="bg-drplant-green hover:bg-drplant-green-dark"
          size="lg"
        >
          <FileText className="h-5 w-5 mr-2" />
          {t('goToDiagnosis')}
        </Button>
      </div>
    </div>
  );
};

export default ChatTab;
