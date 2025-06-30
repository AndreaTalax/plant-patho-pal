
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { UserChatViewRealtime } from './chat/UserChatViewRealtime';
import { ConnectionStatus } from './ConnectionStatus';
import { MessageCircle, Crown } from 'lucide-react';
import { usePremiumStatus } from '@/services/premiumService';
import { Button } from '@/components/ui/button';
import { PremiumPaywallModal } from './diagnose/PremiumPaywallModal';

const ChatTab = () => {
  const { isAuthenticated, user } = useAuth();
  const { hasExpertChatAccess } = usePremiumStatus();
  const [showPaywall, setShowPaywall] = useState(false);

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

  return (
    <div className="h-[calc(100vh-8rem)]">
      <ConnectionStatus />
      <UserChatViewRealtime userId={user.id} />
    </div>
  );
};

export default ChatTab;
