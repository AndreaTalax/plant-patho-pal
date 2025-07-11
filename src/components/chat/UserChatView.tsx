
import React from 'react';
import { useUserChat } from './user/useUserChat';
import ChatHeader from './user/ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import EmptyStateView from './user/EmptyStateView';

interface UserChatViewProps {
  userId: string;
}

/**
 * Vista chat per l'utente che comunica con l'esperto
 */
const UserChatView = ({ userId }: UserChatViewProps) => {
  const {
    activeChat,
    setActiveChat,
    messages,
    isSending,
    handleSendMessage,
  } = useUserChat(userId);

  const handleStartChat = () => {
    setActiveChat('expert');
  };

  const handleBackClick = () => {
    setActiveChat(null);
  };

  if (!activeChat || activeChat !== 'expert') {
    return <EmptyStateView onStartChat={handleStartChat} />;
  }

  return (
    <div className="flex flex-col h-full">
      <ChatHeader 
        onBackClick={handleBackClick} 
        isConnected={false}
      />
      <MessageList messages={messages} />
      <MessageInput 
        conversationId="temp-conversation"
        senderId={userId}
        recipientId="expert"
        onSendMessage={handleSendMessage}
      />
    </div>
  );
};

export default UserChatView;
