
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
    messages,
    isSending,
    isConnected,
    handleSendMessage,
    startChatWithExpert,
    currentConversationId,
    initializationError,
    resetChat
  } = useUserChatRealtime(userId);

  // Auto-start chat immediately when component mounts
  useEffect(() => {
    if (!activeChat && !initializationError) {
      console.log('🚀 Avvio automatico chat con esperto...');
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

  // Handle back button - emit custom event to switch tab
  const handleBackClick = () => {
    const event = new CustomEvent('switchTab', { detail: 'diagnose' });
    window.dispatchEvent(event);
  };

  // Error state with quick recovery
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
              <p className="font-medium mb-2">Connessione in corso...</p>
              <p className="text-sm mb-4">Sto stabilendo la connessione con l'esperto</p>
              <Button
                onClick={() => {
                  resetChat();
                  setTimeout(startChatWithExpert, 500);
                }}
                size="sm"
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Riprova ora
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // Simplified loading state
  if (!activeChat) {
    return (
      <div className="flex flex-col h-full">
        <ChatHeader 
          onBackClick={handleBackClick}
          isConnected={isConnected}
        />
        
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-drplant-green mx-auto mb-4"></div>
            <p className="text-gray-600">Connessione alla chat...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Auto data initializer */}
      <ChatInitializer
        activeChat={activeChat}
        currentConversationId={currentConversationId}
        autoDataSent={autoDataSent}
        setAutoDataSent={setAutoDataSent}
      />
      
      {/* Header with back button */}
      <div className="flex-shrink-0">
        <ChatHeader 
          onBackClick={handleBackClick}
          isConnected={isConnected}
        />
      </div>

      {/* Data display when needed */}
      {showComprehensiveData && (
        <div className="flex-shrink-0">
          <ComprehensiveDataDisplay
            isVisible={showComprehensiveData}
            onToggle={() => setShowComprehensiveData(!showComprehensiveData)}
          />
        </div>
      )}

      {/* Main chat area */}
      <div className="flex-1 overflow-hidden bg-white">
        <MessageList 
          messages={formatMessagesForDisplay(messages)}
        />
      </div>

      {/* Message input with audio and emoji enabled */}
      <div className="flex-shrink-0">
        <MessageBoard
          onSendMessage={handleSendMessage}
          isSending={isSending}
          isConnected={isConnected}
          disabled={!isConnected}
          conversationId={currentConversationId}
          senderId={userId}
          recipientId="marco-nigro-id"
        />
      </div>
    </div>
  );
};
