
import React, { useEffect, useState } from 'react';
import { useUserChatRealtime } from './user/useUserChatRealtime';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { Card, CardContent } from '@/components/ui/card';
import { MessageCircle, Wifi, WifiOff, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UserChatViewRealtimeProps {
  userId: string;
}

export const UserChatViewRealtime: React.FC<UserChatViewRealtimeProps> = ({ userId }) => {
  const {
    activeChat,
    messages,
    isSending,
    isConnected,
    handleSendMessage,
    startChatWithExpert,
    currentConversationId,
    forceRefresh,
    connectionRetries,
    lastMessageLoad
  } = useUserChatRealtime(userId);

  const [isInitializing, setIsInitializing] = useState(true);

  console.log('🎯 UserChatViewRealtime - Stato attuale:', {
    userId,
    activeChat,
    messagesCount: messages.length,
    currentConversationId,
    isConnected,
    isSending,
    connectionRetries,
    lastMessageLoad,
    messages: messages
  });

  useEffect(() => {
    console.log('🚀 UserChatViewRealtime - Inizializzazione per userId:', userId);
    if (userId && !activeChat) {
      startChatWithExpert();
    }
    
    // Reset initializing state after a delay
    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 5000); // Aumentato il timeout

    return () => clearTimeout(timer);
  }, [userId, activeChat, startChatWithExpert]);

  // Force refresh function
  const handleForceRefresh = () => {
    console.log('🔄 Force refresh triggered');
    if (forceRefresh) {
      forceRefresh();
      setIsInitializing(true);
      setTimeout(() => setIsInitializing(false), 3000);
    } else {
      window.location.reload();
    }
  };

  if (!userId) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Accesso Richiesto</h3>
            <p className="text-gray-600">Effettua l'accesso per utilizzare la chat</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isInitializing && !currentConversationId && connectionRetries < 3) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-drplant-green mx-auto mb-4"></div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Inizializzazione Chat</h3>
            <p className="text-gray-600">Preparazione della conversazione con l'esperto...</p>
            
            {connectionRetries > 0 && (
              <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center justify-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-yellow-700">
                    Tentativo di connessione {connectionRetries}/3...
                  </span>
                </div>
              </div>
            )}

            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleForceRefresh}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Ricarica Chat
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Se ci sono troppi tentativi falliti, mostra errore
  if (connectionRetries >= 3 && !currentConversationId) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-red-900 mb-2">Errore di Connessione</h3>
            <p className="text-red-600 mb-4">
              Impossibile collegarsi al server. Controlla la tua connessione internet.
            </p>
            <Button
              variant="outline"
              onClick={handleForceRefresh}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Riprova
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getConnectionStatus = () => {
    if (isConnected) {
      return {
        icon: <Wifi className="h-4 w-4 text-green-500" />,
        text: "Connesso",
        bgColor: "bg-green-50",
        textColor: "text-green-700"
      };
    } else if (connectionRetries > 0) {
      return {
        icon: <RefreshCw className="h-4 w-4 text-yellow-500 animate-spin" />,
        text: `Riconnessione (${connectionRetries}/3)`,
        bgColor: "bg-yellow-50",
        textColor: "text-yellow-700"
      };
    } else {
      return {
        icon: <WifiOff className="h-4 w-4 text-red-500" />,
        text: "Disconnesso",
        bgColor: "bg-red-50",
        textColor: "text-red-700"
      };
    }
  };

  const connectionStatus = getConnectionStatus();

  return (
    <div className="flex flex-col h-full">
      {/* Connection Status Bar */}
      <div className={`border-b border-gray-200 px-4 py-3 ${connectionStatus.bgColor}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {connectionStatus.icon}
            <span className={`text-sm font-medium ${connectionStatus.textColor}`}>
              {connectionStatus.text}
            </span>
            
            {lastMessageLoad && (
              <div className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span className="text-xs text-gray-500">
                  Aggiornato: {lastMessageLoad.toLocaleTimeString()}
                </span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">
              Conv: {currentConversationId ? currentConversationId.slice(0, 8) : 'N/A'}
            </span>
            <span className="text-xs text-gray-500">
              Messaggi: {messages.length}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleForceRefresh}
              className="h-6 w-6 p-0"
              title="Ricarica chat"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        {!isConnected && connectionRetries >= 3 && (
          <div className="mt-2 p-2 bg-red-100 rounded text-xs text-red-700">
            ⚠️ Connessione real-time non disponibile. I messaggi potrebbero non aggiornarsi automaticamente.
          </div>
        )}
      </div>

      {/* Messages */}
      <MessageList messages={messages} />

      {/* Message Input */}
      {currentConversationId ? (
        <MessageInput
          onSendMessage={handleSendMessage}
          isSending={isSending}
          disabledInput={!currentConversationId}
          variant="default"
        />
      ) : (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-center text-gray-500">
            <div className="mb-2">
              <AlertTriangle className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
              Chat in inizializzazione...
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleForceRefresh}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Ricarica Chat
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
