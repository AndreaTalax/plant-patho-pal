
import React, { useState, useEffect } from 'react';
import { useUserChatRealtime } from '@/hooks/useUserChatRealtime';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { ChatInitializer } from './user/ChatInitializer';
import { DatabaseMessage } from '@/services/chat/types';
import { Message } from './types';
import { toast } from 'sonner';

interface UserChatViewRealtimeProps {
  userId: string;
}

export const UserChatViewRealtime: React.FC<UserChatViewRealtimeProps> = ({ userId }) => {
  const [autoDataSent, setAutoDataSent] = useState(false);
  
  const {
    activeChat,
    setActiveChat,
    messages,
    isSending,
    isConnected,
    handleSendMessage,
    startChatWithExpert,
    currentConversationId
  } = useUserChatRealtime(userId);

  // Auto-start chat with expert when component mounts
  useEffect(() => {
    if (!activeChat) {
      console.log('🚀 Auto-starting chat with expert...');
      startChatWithExpert();
    }
  }, [activeChat, startChatWithExpert]);

  // Reset auto data sent when conversation changes
  useEffect(() => {
    if (currentConversationId) {
      setAutoDataSent(false);
    }
  }, [currentConversationId]);

  const handleConnectionError = () => {
    toast.error('Connessione persa', {
      description: 'Tentativo di riconnessione in corso...',
      duration: 3000
    });
  };

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

  if (!activeChat) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-drplant-green mx-auto mb-4"></div>
          <p className="text-gray-600">Avvio chat con l'esperto...</p>
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
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-xs text-gray-500">
              {isConnected ? 'Real-Time' : 'Disconnesso'}
            </span>
          </div>
        </div>
      </div>

      {/* Lista Messaggi */}
      <div className="flex-1 overflow-hidden">
        <MessageList 
          messages={formatMessagesForDisplay(messages)}
          currentUserId={userId}
          isLoading={false}
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
      {!isConnected && (
        <div className="bg-red-50 border-t border-red-200 p-2 text-center">
          <p className="text-sm text-red-600">
            Connessione persa - Tentativo di riconnessione...
          </p>
        </div>
      )}
    </div>
  );
};
