
import { useState } from "react";
import { useExpertConversation } from "./expert/useExpertConversation";
import EmptyConversationState from "./expert/EmptyConversationState";
import ConversationList from "./ConversationList";
import ConversationBody from "./expert/ConversationBody";
import ProductRecommendationDialog from "./ProductRecommendationDialog";

interface ExpertChatViewProps {
  userId: string;
}

/**
 * Render expert chat view including conversation list and body.
 * @example
 * ExpertChatViewProps(userId)
 * <div>Rendered component structure</div>
 * @param {Object} userId - The ID of the user participating in the expert chat.
 * @returns {JSX.Element} A React element representing the expert chat view.
 * @description
 *   - Utilizes the useExpertConversation hook to manage chat state and actions.
 *   - Structures the UI into sections for conversation list, conversation body, and product recommendation dialog.
 *   - Handles chat initiation, conversation selection, deletion, blocking, message sending, and product recommendation interactions.
 */
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
