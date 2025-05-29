
import { useState } from "react";
import { useExpertConversation } from "./expert/useExpertConversation";
import EmptyConversationState from "./expert/EmptyConversationState";
import ConversationList from "./ConversationList";
import ConversationBody from "./expert/ConversationBody";
import ProductRecommendationDialog from "./ProductRecommendationDialog";

interface ExpertChatViewProps {
  userId: string;
}

const ExpertChatView = ({ userId }: ExpertChatViewProps) => {
  const {
    conversations,
    currentConversation,
    isProductDialogOpen,
    setIsProductDialogOpen,
    isSending,
    handleChatSelection,
    handleDeleteConversation,
    handleToggleBlockUser,
    handleSendProductRecommendations,
    handleSendMessage,
  } = useExpertConversation(userId);

  const handleStartExpertChat = async () => {
    // For now, we'll use the existing conversation logic from the hook
    // This will be improved when we add the actual chat creation functionality
    console.log("Starting expert chat...");
  };

  return (
    <div className="flex h-full">
      <div className="w-full md:w-1/3 border-r bg-gray-50">
        <ConversationList
          conversations={conversations}
          currentConversationId={currentConversation?.id}
          onSelectConversation={handleChatSelection}
          onDeleteConversation={handleDeleteConversation}
          onToggleBlockUser={handleToggleBlockUser}
        />
      </div>
      
      <div className="w-full md:w-2/3 flex flex-col">
        {currentConversation ? (
          <ConversationBody
            conversation={currentConversation}
            isSending={isSending}
            onSendMessage={handleSendMessage}
            onOpenProductDialog={() => setIsProductDialogOpen(true)}
          />
        ) : (
          <EmptyConversationState onStartChat={handleStartExpertChat} />
        )}
      </div>
      
      <ProductRecommendationDialog
        isOpen={isProductDialogOpen}
        onClose={() => setIsProductDialogOpen(false)}
        onSendRecommendations={handleSendProductRecommendations}
      />
    </div>
  );
};

export default ExpertChatView;
