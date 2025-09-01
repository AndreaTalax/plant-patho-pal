import React, { useState, useEffect } from 'react';
import { useUserChatRealtime } from '@/hooks/useUserChatRealtime';
import MessageList from './MessageList';
import { ChatInitializer } from './user/ChatInitializer';
import { ComprehensiveDataDisplay } from './user/ComprehensiveDataDisplay';
import { MessageBoard } from './user/MessageBoard';
import ChatHeader from './user/ChatHeader';
import { DatabaseMessage } from '@/services/chat/types';
import { Message } from './types';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MARCO_NIGRO_ID } from '@/components/phytopathologist';

interface UserChatViewRealtimeProps {
  userId: string;
  conversationId?: string;
  onBackToList?: () => void;
}

export const UserChatViewRealtime: React.FC<UserChatViewRealtimeProps> = ({ userId, conversationId, onBackToList }) => {
  const [autoDataSent, setAutoDataSent] = useState(false);
  const [showComprehensiveData, setShowComprehensiveData] = useState(false);
  
  const {
    activeChat,
    messages,
    isSending,
    isConnected,
    handleSendMessage,
    startChatWithExpert,
    currentConversationId,
    initializationError,
    resetChat,
    isInitializing
  } = useUserChatRealtime(userId);

  // Auto-avvio chat quando il componente si monta
  useEffect(() => {
    if (!activeChat && !initializationError && !isInitializing) {
      console.log('🚀 UserChatViewRealtime: Avvio automatico chat');
      startChatWithExpert();
    }
  }, [activeChat, startChatWithExpert, initializationError, isInitializing]);

  // Reset dati automatici quando cambia conversazione
  useEffect(() => {
    if (currentConversationId) {
      setAutoDataSent(false);
    }
  }, [currentConversationId]);

  // Mostra dati comprensivi quando vengono inviati
  useEffect(() => {
    if (autoDataSent) {
      setShowComprehensiveData(true);
    }
  }, [autoDataSent]);

  const formatMessagesForDisplay = (dbMessages: DatabaseMessage[]): Message[] => {
    console.log('🔄 Formatting messages for display:', dbMessages.length);
    
    return dbMessages.map((msg, index) => {
      // Determina il sender basandosi sugli ID
      let sender: 'user' | 'expert';
      if (msg.sender_id === userId) {
        sender = 'user';
      } else if (msg.sender_id === MARCO_NIGRO_ID) {
        sender = 'expert';
      } else {
        // Fallback per messaggi dove l'ID del sender non corrisponde
        sender = msg.sender_id === userId ? 'user' : 'expert';
      }
      
      const formattedMessage: Message = {
        id: msg.id,
        sender: sender,
        text: msg.content || msg.text || '',
        time: new Date(msg.sent_at).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        image_url: msg.image_url || undefined
      };
      
      console.log(`🎨 Formatting message ${index + 1}/${dbMessages.length}:`, {
        id: formattedMessage.id,
        sender: formattedMessage.sender,
        text: formattedMessage.text.substring(0, 50),
        senderId: msg.sender_id,
        userId: userId,
        marcoId: MARCO_NIGRO_ID
      });
      
      return formattedMessage;
    });
  };

  // Gestione click pulsante indietro
  const handleBackClick = () => {
    if (onBackToList) {
      onBackToList();
    } else {
      const event = new CustomEvent('switchTab', { detail: 'diagnose' });
      window.dispatchEvent(event);
    }
  };

  // Gestione retry con reset completo
  const handleRetry = () => {
    console.log('🔄 UserChatViewRealtime: Tentativo di riconnessione');
    resetChat();
    setTimeout(() => {
      startChatWithExpert();
    }, 500);
  };

  // Log per debug dei messaggi formattati
  useEffect(() => {
    const formattedMessages = formatMessagesForDisplay(messages);
    console.log('📊 Messages debug info:', {
      totalMessages: messages.length,
      formattedMessages: formattedMessages.length,
      userMessages: formattedMessages.filter(m => m.sender === 'user').length,
      expertMessages: formattedMessages.filter(m => m.sender === 'expert').length,
      userId: userId,
      marcoId: MARCO_NIGRO_ID
    });
  }, [messages, userId]);

  // Stato di errore con opzioni di recupero
  if (initializationError) {
    return (
      <div className="flex flex-col h-full">
        <ChatHeader 
          onBackClick={handleBackClick}
          isConnected={isConnected}
        />

        <div className="flex-1 flex items-center justify-center p-4">
          <Alert className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="mt-2">
              <p className="font-medium mb-2">Problema di connessione alla chat</p>
              <p className="text-sm mb-4">{initializationError}</p>
              <div className="space-y-2">
                <Button
                  onClick={handleRetry}
                  size="sm"
                  className="w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Riprova
                </Button>
                <Button
                  onClick={handleBackClick}
                  size="sm"
                  variant="outline"
                  className="w-full"
                >
                  Torna alla diagnosi
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // Stato di caricamento
  if (isInitializing || !activeChat) {
    return (
      <div className="flex flex-col h-full">
        <ChatHeader 
          onBackClick={handleBackClick}
          isConnected={isConnected}
        />
        
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-drplant-green mx-auto mb-4"></div>
            <p className="text-gray-600">
              {isInitializing ? 'Inizializzazione chat...' : 'Connessione alla chat...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Inizializzatore dati automatico */}
      <ChatInitializer
        activeChat={activeChat}
        currentConversationId={currentConversationId}
        autoDataSent={autoDataSent}
        setAutoDataSent={setAutoDataSent}
      />
      
      {/* Header con pulsante indietro */}
      <div className="flex-shrink-0">
        <ChatHeader 
          onBackClick={handleBackClick}
          isConnected={isConnected}
        />
      </div>

      {/* Visualizzazione dati quando necessario */}
      <div className="flex-shrink-0">
        <ComprehensiveDataDisplay
          isVisible={showComprehensiveData}
          onToggle={() => setShowComprehensiveData(!showComprehensiveData)}
        />
      </div>

      {/* Area chat principale */}
      <div className="flex-1 overflow-hidden bg-white">
        <MessageList 
          messages={formatMessagesForDisplay(messages)}
        />
      </div>

      {/* Input messaggi */}
      <div className="flex-shrink-0">
        <MessageBoard
          onSendMessage={handleSendMessage}
          isSending={isSending}
          isConnected={isConnected}
          disabled={!isConnected && !activeChat}
          conversationId={currentConversationId}
          senderId={userId}
          recipientId={MARCO_NIGRO_ID}
        />
      </div>
    </div>
  );
};
