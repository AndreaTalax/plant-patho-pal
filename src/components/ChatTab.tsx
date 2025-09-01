
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { SimpleRealtimeChatView } from './chat/SimpleRealtimeChatView';
import { RealtimeChatTestButton } from './chat/RealtimeChatTestButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ChatTab = () => {
  const { user } = useAuth();

  // Se non è autenticato
  if (!user) {
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Lock className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Accesso Richiesto</h3>
            <p className="text-gray-600 text-center mb-4">
              Effettua il login per accedere alla chat con l'esperto
            </p>
            <Button onClick={() => window.location.reload()}>
              Vai al Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Per utenti di test, mostra sia il pulsante test che la chat
  if (user.email === 'test@gmail.com') {
    return (
      <div className="space-y-6 p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Chat con Esperto - Modalità Test</h2>
          <p className="text-gray-600">
            Stai utilizzando l'account di test. Hai accesso completo alle funzionalità.
          </p>
        </div>
        
        {/* Pulsante test per debugging */}
        <div className="flex justify-center">
          <RealtimeChatTestButton />
        </div>
        
        {/* Chat principale */}
        <SimpleRealtimeChatView />
      </div>
    );
  }

  // Per utenti normali, mostra solo la chat
  return (
    <div className="space-y-4 p-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
          <MessageCircle className="h-6 w-6 text-drplant-green" />
          Chat con Marco Nigro
        </h2>
        <p className="text-gray-600">
          Comunica direttamente con il nostro esperto di fitopatologia
        </p>
      </div>
      
      <SimpleRealtimeChatView />
    </div>
  );
};

export default ChatTab;
