
import React, { useEffect } from 'react';
import { useUserChatRealtime } from './user/useUserChatRealtime';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import ChatHeader from './user/ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import EmptyStateView from './user/EmptyStateView';
import UserPlantSummary from './user/UserPlantSummary';
import ChatConnectionError from './user/ChatConnectionError';
import { ChatInitializer } from './user/ChatInitializer';
import { useConnectionManager } from './user/ConnectionManager';

interface UserChatViewRealtimeProps {
  userId: string;
}

export const UserChatViewRealtime: React.FC<UserChatViewRealtimeProps> = ({ userId }) => {
  const { userProfile } = useAuth();
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
  const { dismiss } = useToast();
  const [autoDataSent, setAutoDataSent] = React.useState(false);

  const { connectionError } = useConnectionManager(currentConversationId, activeChat);

  useEffect(() => {
    dismiss();
  }, []);

  const handleStartChat = () => {
    setAutoDataSent(false);
    startChatWithExpert();
  };

  const handleBackClick = () => {
    setAutoDataSent(false);
    setActiveChat(null);
  };

  useEffect(() => {
    console.log("[DEBUG UserChat] userId:", userId);
    console.log("[DEBUG UserChat] activeChat:", activeChat);
    console.log("[DEBUG UserChat] currentConversationId:", currentConversationId);
    console.log("[DEBUG UserChat] isConnected:", isConnected);
    console.log("[DEBUG UserChat] canSend:", !!currentConversationId && !!userId);
  }, [userId, activeChat, currentConversationId, isConnected]);

  if (!activeChat || activeChat !== 'expert') {
    return <EmptyStateView onStartChat={handleStartChat} />;
  }

  return (
    <div className="flex flex-col h-full">
      <ChatInitializer
        activeChat={activeChat}
        currentConversationId={currentConversationId}
        autoDataSent={autoDataSent}
        setAutoDataSent={setAutoDataSent}
      />
      
      <ChatHeader 
        onBackClick={handleBackClick}
        isConnected={isConnected}
      />
      <UserPlantSummary />
      <MessageList messages={messages} />

      <ChatConnectionError message={connectionError || (!currentConversationId ? "Chat non disponibile. Problema di connessione o server." : undefined)} />

      <div className="relative">
        <MessageInput 
          onSendMessage={handleSendMessage}
          isSending={isSending}
          conversationId={currentConversationId || ""}
          senderId={userId}
          recipientId="07c7fe19-33c3-4782-b9a0-4e87c8aa7044"
          disabledInput={!userId}
          variant="persistent"
        />
      </div>
      {!!connectionError && (
        <div className="p-4 text-center text-red-500 font-medium">
          {connectionError}
        </div>
      )}
    </div>
  );
};
