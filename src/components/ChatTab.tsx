
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { UserChatViewRealtime } from './chat/UserChatViewRealtime';
import { ConnectionStatus } from './ConnectionStatus';
import { MessageCircle, Crown, FileText } from 'lucide-react';
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
}

const ChatTab = () => {
  const { isAuthenticated, user } = useAuth();
  const { hasExpertChatAccess } = usePremiumStatus();
  const [showPaywall, setShowPaywall] = useState(false);
  const [activeConversations, setActiveConversations] = useState<ActiveConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

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
          .select('id, status, last_message_text, last_message_at, created_at, updated_at')
          .eq('user_id', user.id)
          .eq('expert_id', MARCO_NIGRO_ID)
          .eq('status', 'active') // Solo conversazioni attive
          .order('last_message_at', { ascending: false });

        if (error) {
          console.error('❌ ChatTab: Errore nel controllo conversazioni:', error);
          setActiveConversations([]);
        } else {
          console.log('✅ ChatTab: Conversazioni trovate:', conversations);
          setActiveConversations((conversations || []) as ActiveConversation[]);
          
          // Se c'è una sola conversazione attiva, selezionala automaticamente
          if (conversations && conversations.length === 1) {
            setSelectedConversationId(conversations[0].id);
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
    };
  }, [isAuthenticated, user?.id]);

  if (!isAuthenticated || !user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <MessageCircle className="h-16 w-16 mx-auto mb-6 text-drplant-green" />
          <h2 className="text-2xl font-bold mb-4">Accedi per utilizzare la chat</h2>
          <p className="text-gray-600">
            Effettua l'accesso per chattare con i nostri esperti di fitopatie
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
          <p className="text-gray-600">Caricamento chat...</p>
        </div>
      </div>
    );
  }

  // Se l'utente non ha accesso premium alla chat E non ha conversazioni attive
  if (!hasExpertChatAccess && activeConversations.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <Crown className="h-16 w-16 mx-auto mb-6 text-amber-500" />
          <h2 className="text-2xl font-bold mb-4">Chat Premium con Fitopatologo</h2>
          <p className="text-gray-600 mb-6">
            La chat diretta con il nostro esperto Marco Nigro è disponibile solo per gli utenti Premium
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800 text-sm">
              💡 <strong>Ricorda:</strong> La diagnosi AI rimane sempre gratuita! 
              Puoi utilizzarla dalla sezione "Diagnosi".
            </p>
          </div>
          
          <Button
            onClick={() => setShowPaywall(true)}
            className="bg-drplant-green hover:bg-drplant-green-dark"
            size="lg"
          >
            <Crown className="h-5 w-5 mr-2" />
            Passa a Premium
          </Button>
          
          <PremiumPaywallModal
            open={showPaywall}
            onClose={() => setShowPaywall(false)}
          />
        </div>
      </div>
    );
  }

  // Se l'utente ha accesso premium e conversazioni attive
  if (activeConversations.length > 0) {
    // Se è stata selezionata una conversazione specifica, mostra la chat
    if (selectedConversationId) {
      return (
        <div className="h-[calc(100vh-8rem)]">
          <ConnectionStatus />
          <UserChatViewRealtime 
            userId={user.id} 
            conversationId={selectedConversationId}
            onBackToList={() => setSelectedConversationId(null)}
          />
        </div>
      );
    }

    // Mostra la lista delle conversazioni attive
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">Le tue conversazioni attive</h2>
            <p className="text-gray-600">
              Continua le conversazioni con il fitopatologo Marco Nigro
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
                    <CardTitle className="text-lg">
                      Conversazione con Marco Nigro
                    </CardTitle>
                    <Badge 
                      variant={conversation.status === 'active' ? 'default' : 'secondary'}
                      className="bg-green-100 text-green-800"
                    >
                      Attiva
                    </Badge>
                  </div>
                  <CardDescription>
                    Iniziata il {new Date(conversation.created_at).toLocaleDateString('it-IT', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {conversation.last_message_text && (
                    <div className="mb-3">
                      <p className="text-sm text-gray-600 mb-1">Ultimo messaggio:</p>
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
                      Ultimo aggiornamento: {new Date(conversation.last_message_at).toLocaleString('it-IT')}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Button
              onClick={() => {
                const event = new CustomEvent('switchTab', { detail: { tab: 'diagnose' } });
                window.dispatchEvent(event);
              }}
              variant="outline"
              className="mr-4"
            >
              <FileText className="h-4 w-4 mr-2" />
              Nuova Diagnosi
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Se l'utente ha accesso premium ma non ha conversazioni attive
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto text-center">
        <MessageCircle className="h-16 w-16 mx-auto mb-6 text-drplant-green" />
        <h2 className="text-2xl font-bold mb-4">Chat con il Fitopatologo</h2>
        <p className="text-gray-600 mb-6">
          Per iniziare una conversazione con il nostro esperto Marco Nigro, 
          effettua prima una diagnosi dalla sezione "Diagnosi" e scegli la 
          consulenza esperto.
        </p>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-blue-800 text-sm">
            <FileText className="inline h-4 w-4 mr-1" />
            <strong>Come funziona:</strong> Fai una diagnosi, carica la foto della tua pianta, 
            seleziona "Consulenza Esperto" e inizierai automaticamente la chat.
          </p>
        </div>
        
        <Button
          onClick={() => {
            const event = new CustomEvent('switchTab', { detail: { tab: 'diagnose' } });
            window.dispatchEvent(event);
          }}
          className="bg-drplant-green hover:bg-drplant-green-dark"
          size="lg"
        >
          <FileText className="h-5 w-5 mr-2" />
          Vai alla Diagnosi
        </Button>
      </div>
    </div>
  );
};

export default ChatTab;
