
import React, { useState, useEffect } from 'react';
import { useUserChatRealtime } from '@/hooks/useUserChatRealtime';
import MessageList from './MessageList';
import { ChatInitializer } from './user/ChatInitializer';
import { ComprehensiveDataDisplay } from './user/ComprehensiveDataDisplay';
import { MessageBoard } from './user/MessageBoard';
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
  const [showComprehensiveData, setShowComprehensiveData] = useState(false);
  
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

  // Show comprehensive data automatically when data is sent
  useEffect(() => {
    if (autoDataSent) {
      setShowComprehensiveData(true);
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
    <div className="flex flex-col h-full bg-gray-50">
      {/* Inizializzatore automatico dati - RIMOSSO l'invio automatico */}
      <ChatInitializer
        activeChat={activeChat}
        currentConversationId={currentConversationId}
        autoDataSent={autoDataSent}
        setAutoDataSent={setAutoDataSent}
      />
      
      {/* Header Chat */}
      <div className="bg-white border-b border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg text-gray-900">💬 Chat con Marco Nigro</h3>
            <p className="text-sm text-gray-600 flex items-center">
              Fitopatologo Professionista
              <span className={`ml-2 w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span className="ml-1 text-xs">
                {isConnected ? 'Online' : 'Connessione...'}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowComprehensiveData(!showComprehensiveData)}
              className="flex items-center gap-2"
            >
              {showComprehensiveData ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showComprehensiveData ? 'Nascondi Dati' : 'Mostra Dati'}
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
          </div>
        </div>
      </div>

      {/* Visualizzazione Comprensiva Dati */}
      <ComprehensiveDataDisplay
        isVisible={showComprehensiveData}
        onToggle={() => setShowComprehensiveData(!showComprehensiveData)}
      />

      {/* Lista Messaggi */}
      <div className="flex-1 overflow-hidden bg-white">
        <MessageList 
          messages={formatMessagesForDisplay(messages)}
        />
      </div>

      {/* Message Board per scrivere */}
      <MessageBoard
        onSendMessage={handleSendMessage}
        isSending={isSending}
        isConnected={isConnected}
        disabled={!isConnected}
      />

      {/* Connection Error Handler */}
      {!isConnected && activeChat && (
        <div className="bg-red-50 border-t border-red-200 p-3 text-center">
          <p className="text-sm text-red-600 font-medium">
            🔌 Connessione persa - Tentativo di riconnessione automatica...
          </p>
          <Button
            onClick={() => {
              resetChat();
              setTimeout(startChatWithExpert, 1000);
            }}
            variant="ghost"
            size="sm"
            className="mt-2 text-red-700 hover:bg-red-100"
          >
            Forza riconnessione
          </Button>
        </div>
      )}
    </div>
  );
};
