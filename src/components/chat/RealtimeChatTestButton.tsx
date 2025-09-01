
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, TestTube, User, Bot } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { SimpleRealtimeChatView } from './SimpleRealtimeChatView';

export const RealtimeChatTestButton: React.FC = () => {
  const { user } = useAuth();
  const [showChat, setShowChat] = useState(false);

  if (showChat) {
    return <SimpleRealtimeChatView onBack={() => setShowChat(false)} />;
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5 text-blue-600" />
          Test Chat Real-Time
          <Badge variant="outline">Marco Nigro</Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-600">
          <p className="mb-2">Testa la chat in tempo reale con Marco Nigro:</p>
          <ul className="space-y-1 text-xs">
            <li className="flex items-center gap-2">
              <User className="h-3 w-3" />
              Utente: {user?.email}
            </li>
            <li className="flex items-center gap-2">
              <Bot className="h-3 w-3" />
              Esperto: Marco Nigro
            </li>
          </ul>
        </div>

        <Button 
          onClick={() => setShowChat(true)}
          className="w-full"
          disabled={!user?.id}
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Apri Chat Test
        </Button>

        {!user?.id && (
          <p className="text-xs text-red-600">
            Devi essere autenticato per testare la chat
          </p>
        )}
        
        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
          <p className="font-medium mb-1">Funzionalità testate:</p>
          <ul className="space-y-1">
            <li>• Creazione automatica conversazione</li>
            <li>• Invio/ricezione messaggi real-time</li> 
            <li>• Notifiche per nuovi messaggi</li>
            <li>• Gestione stato connessione</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
