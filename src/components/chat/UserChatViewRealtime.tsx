
import React, { useState, useEffect } from 'react';
import { useUserChatRealtime } from '@/hooks/useUserChatRealtime';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { ChatInitializer } from './user/ChatInitializer';
import { UserDataDisplay } from './user/UserDataDisplay';
import { DatabaseMessage } from '@/services/chat/types';
import { Message } from './types';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Eye, EyeOff, RefreshCw, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface UserChatViewRealtimeProps {
  userId: string;
}

export const UserChatViewRealtime: React.FC<UserChatViewRealtimeProps> = ({ userId }) => {
  const [autoDataSent, setAutoDataSent] = useState(false);
  const [showUserData, setShowUserData] = useState(false);
  
  const {
    activeChat,
    setActiveChat,
    messages,
    isSending,
    isConnected,
    handleSendMessage,
    startChatWithExpert,
    currentConversationId,
    initializationError,
    resetChat
  } = useUserChatRealtime(userId);

  // Auto-start chat with expert when component mounts
  useEffect(() => {
    if (!activeChat && !initializationError) {
      console.log('🚀 Auto-starting chat with expert...');
      startChatWithExpert();
    }
  }, [activeChat, startChatWithExpert, initializationError]);

  // Reset auto data sent when conversation changes
  useEffect(() => {
    if (currentConversationId) {
      setAutoDataSent(false);
    }
  }, [currentConversationId]);

  // Show user data automatically when data is sent
  useEffect(() => {
    if (autoDataSent) {
      setShowUserData(true);
      const timer = setTimeout(() => setShowUserData(false), 10000);
      return () => clearTimeout(timer);
    }
  }, [autoDataSent]);

  const formatMessagesForDisplay = (dbMessages: DatabaseMessage[]): Message[] => {
    return dbMessages.map(msg => ({
      id: msg.id,
      sender: msg.sender_id === userId ? 'user' as const : 'expert' as const,
      text: msg.content || msg.text || '',
      time: new Date(msg.sent_at).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      image_url: msg.image_url || undefined
    }));
  };

  // Error state
  if (initializationError) {
    return (
      <div className="flex flex-col h-full">
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">Chat con Marco Nigro</h3>
              <p className="text-sm text-red-500">Errore di connessione</p>
            </div>
            <Button
              onClick={resetChat}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Riprova
            </Button>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-4">
          <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="mt-2">
              <p className="font-medium mb-2">Errore nell'avvio della chat</p>
              <p className="text-sm mb-4">{initializationError}</p>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    resetChat();
                    startChatWithExpert();
                  }}
                  size="sm"
                  variant="outline"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Riprova
                </Button>
                <Button
                  onClick={resetChat}
                  size="sm"
                  variant="ghost"
                >
                  Reset completo
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // Loading state
  if (!activeChat) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-drplant-green mx-auto mb-4"></div>
          <p className="text-gray-600">Avvio chat con l'esperto...</p>
          <Button
            onClick={resetChat}
            variant="ghost"
            size="sm"
            className="mt-2"
          >
            Annulla
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Inizializzatore automatico dati */}
      <ChatInitializer
        activeChat={activeChat}
        currentConversationId={currentConversationId}
        autoDataSent={autoDataSent}
        setAutoDataSent={setAutoDataSent}
      />
      
      {/* Header Chat */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg">Chat con Marco Nigro</h3>
            <p className="text-sm text-gray-500">
              Fitopatologo - {isConnected ? 'Online' : 'Connessione...'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowUserData(!showUserData)}
              className="flex items-center gap-2"
            >
              {showUserData ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showUserData ? 'Nascondi Dati' : 'Mostra Dati'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetChat}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Reset
            </Button>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-xs text-gray-500">
                {isConnected ? 'Real-Time' : 'Disconnesso'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Visualizzazione Dati Utente/Pianta */}
      <UserDataDisplay isVisible={showUserData} />

      {/* Lista Messaggi */}
      <div className="flex-1 overflow-hidden">
        <MessageList 
          messages={formatMessagesForDisplay(messages)}
        />
      </div>

      {/* Input Messaggi */}
      <MessageInput
        conversationId={currentConversationId}
        senderId={userId}
        recipientId="07c7fe19-33c3-4782-b9a0-4e87c8aa7044" // Marco Nigro ID
        onSendMessage={handleSendMessage}
        isSending={isSending}
        disabledInput={!isConnected}
        variant="default"
      />

      {/* Connection Error Handler */}
      {!isConnected && activeChat && (
        <div className="bg-red-50 border-t border-red-200 p-2 text-center">
          <p className="text-sm text-red-600">
            Connessione persa - Tentativo di riconnessione...
          </p>
          <Button
            onClick={() => {
              resetChat();
              setTimeout(startChatWithExpert, 1000);
            }}
            variant="ghost"
            size="sm"
            className="mt-1"
          >
            Forza riconnessione
          </Button>
        </div>
      )}
    </div>
  );
};
