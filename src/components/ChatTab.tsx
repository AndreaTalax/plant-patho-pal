
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { UserChatViewRealtime } from './chat/UserChatViewRealtime';
import { ConnectionStatus } from './ConnectionStatus';
import { Button } from '@/components/ui/button';
import { MessageCircle, Sparkles } from 'lucide-react';

const ChatTab = () => {
  const { isAuthenticated, user } = useAuth();
  const [showChat, setShowChat] = useState(false);

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

  if (!showChat) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ConnectionStatus />
        
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-drplant-blue to-drplant-green bg-clip-text text-transparent">
              Chat con Fitopatologo
            </h1>
            <p className="text-gray-600 text-lg">
              Consulenza diretta con il nostro esperto Marco Nigro
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-drplant-green rounded-full flex items-center justify-center mr-4">
                <MessageCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Fitopatologo qualificato</h3>
                <p className="text-gray-600">Consulenza personalizzata</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center">
                <Sparkles className="h-5 w-5 text-drplant-blue mr-3" />
                <span>Risposta entro 24h</span>
              </div>
              <div className="flex items-center">
                <Sparkles className="h-5 w-5 text-drplant-blue mr-3" />
                <span>Sempre disponibile e gratuito</span>
              </div>
            </div>

            <Button
              onClick={() => setShowChat(true)}
              className="w-full bg-drplant-green hover:bg-drplant-green/90 text-white py-3 text-lg"
            >
              Chat con Esperto
            </Button>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Raccomandazione:</strong> Entrambe le opzioni inviano automaticamente le tue 
                informazioni e foto all'esperto per una valutazione completa.
              </p>
            </div>
          </div>
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
