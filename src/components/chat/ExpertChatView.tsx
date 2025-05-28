import { useState } from "react";
import { chatService } from "./chatService";
// ...altri import

const ExpertChatView = ({ userId }: ExpertChatViewProps) => {
  // ...tuo stato e hook
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
    // eventualmente aggiungi qui handleNewConversation se lo hai già
  } = useExpertConversation(userId);

  // Handler per il pulsante "Inizia chat con fitopatologo"
  const handleStartExpertChat = async () => {
    // Crea una nuova conversazione con l'username desiderato
    const newConv = await chatService.createConversation("Fitopatologo");
    handleChatSelection(newConv.id); // seleziona la nuova conversazione
  };

  return (
    // ...
    <div className="w-full md:w-2/3 flex flex-col">
      {currentConversation ? (
        // ...chat attiva...
      ) : (
        // Passa la prop corretta!
        <EmptyConversationState onStartChat={handleStartExpertChat} />
      )}
    </div>
    // ...
  );
};
