
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

const ChatTab = () => {
  const { isAuthenticated, user } = useAuth();
  const { hasExpertChatAccess } = usePremiumStatus();
  const [showPaywall, setShowPaywall] = useState(false);
  const [hasActiveConversation, setHasActiveConversation] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Controlla se l'utente ha già una conversazione attiva
  useEffect(() => {
    const checkActiveConversation = async () => {
      if (!isAuthenticated || !user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const { data: conversation, error } = await supabase
          .from('conversations')
          .select('id, status')
          .eq('user_id', user.id)
          .eq('expert_id', MARCO_NIGRO_ID)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error('Errore nel controllo conversazione:', error);
          setHasActiveConversation(false);
        } else {
          setHasActiveConversation(!!conversation);
        }
      } catch (error) {
        console.error('Errore nel controllo conversazione:', error);
        setHasActiveConversation(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkActiveConversation();
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

  // Se l'utente non ha accesso premium alla chat
  if (!hasExpertChatAccess) {
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

  // Se l'utente ha accesso premium ma non ha una conversazione attiva
  if (!hasActiveConversation) {
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
  }

  return (
    <div className="h-[calc(100vh-8rem)]">
      <ConnectionStatus />
      <UserChatViewRealtime userId={user.id} />
    </div>
  );
};

export default ChatTab;
