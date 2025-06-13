
import React from 'react';
import { useUserChat } from './user/useUserChat';
import ChatHeader from './user/ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import EmptyStateView from './user/EmptyStateView';
import { ChatDataManager } from './user/ChatDataManager';

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

  const handleDataSynced = () => {
    console.log('📊 Plant data has been synced to chat');
    // Trigger refresh se necessario
    setTimeout(() => {
      const refreshEvent = new CustomEvent('refreshChat');
      window.dispatchEvent(refreshEvent);
    }, 500);
  };

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
      {/* Gestione automatica della sincronizzazione dati */}
      <ChatDataManager onDataSynced={handleDataSynced} />
      
      <ChatHeader onBackClick={handleBackClick} />
      <MessageList messages={messages} />
      <MessageInput 
        onSendMessage={handleSendMessage}
        isSending={isSending}
      />
    </div>
  );
};

export default UserChatView;
