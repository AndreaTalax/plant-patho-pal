
import React, { useEffect, useState } from 'react';
import { useUserChatRealtime } from './user/useUserChatRealtime';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { Card, CardContent } from '@/components/ui/card';
import { MessageCircle, Wifi, WifiOff, RefreshCw } from 'lucide-react';
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
    currentConversationId
  } = useUserChatRealtime(userId);

  const [isInitializing, setIsInitializing] = useState(true);

  console.log('🎯 UserChatViewRealtime - Stato attuale:', {
    userId,
    activeChat,
    messagesCount: messages.length,
    currentConversationId,
    isConnected,
    isSending,
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
    }, 2000);

    return () => clearTimeout(timer);
  }, [userId, activeChat, startChatWithExpert]);

  // Force refresh function
  const handleForceRefresh = () => {
    console.log('🔄 Force refresh triggered');
    window.location.reload();
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

  if (isInitializing && !currentConversationId) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-drplant-green mx-auto mb-4"></div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Inizializzazione Chat</h3>
            <p className="text-gray-600">Preparazione della conversazione con l'esperto...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Connection Status Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
            <span className="text-sm text-gray-600">
              {isConnected ? 'Connesso' : 'Disconnesso'}
            </span>
            <span className="text-xs text-gray-400">
              • Conv: {currentConversationId ? currentConversationId.slice(0, 8) : 'N/A'}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">
              Messaggi: {messages.length}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleForceRefresh}
              className="h-6 w-6 p-0"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Debug Info */}
      <div className="bg-blue-50 border-b border-blue-200 px-4 py-2">
        <div className="text-xs text-blue-700">
          <strong>🔍 Debug:</strong> UserId: {userId.slice(0, 8)}, 
          Chat: {activeChat || 'N/A'}, 
          Msgs: {messages.length}, 
          Connected: {isConnected ? '✅' : '❌'}
        </div>
      </div>

      {/* Messages */}
      <MessageList messages={messages} />

      {/* Message Input */}
      {currentConversationId ? (
        <MessageInput
          onSendMessage={handleSendMessage}
          isSending={isSending}
          disabledInput={!isConnected}
          variant="default"
        />
      ) : (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-center text-gray-500">
            Conversazione non disponibile. Ricarica la pagina.
            <Button
              variant="outline"
              size="sm"
              onClick={handleForceRefresh}
              className="ml-2"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Ricarica
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
