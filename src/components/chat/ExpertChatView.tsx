import { toast } from 'sonner';
import { Conversation, Product } from './types';
import ConversationList from './ConversationList';
import ProductRecommendationDialog from './ProductRecommendationDialog';
import ConversationHeader from './expert/ConversationHeader';
import ConversationBody from './expert/ConversationBody';
import EmptyConversationState from './expert/EmptyConversationState';
import { useExpertConversation } from './expert/useExpertConversation';

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
    handleSendMessage
  } = useExpertConversation(userId);

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-xl font-bold mb-4 px-2 text-drplant-green">Plant Pathologist Panel</h2>
      
      <div className="flex-1 flex flex-col md:flex-row border rounded-lg overflow-hidden">
        {/* Conversations sidebar */}
        <div className="w-full md:w-1/3 border-r">
          <ConversationList
            conversations={conversations}
            currentConversationId={currentConversation?.id}
            onSelectConversation={handleChatSelection}
            onDeleteConversation={handleDeleteConversation}
            onToggleBlockUser={handleToggleBlockUser}
          />
        </div>
        
        {/* Chat area */}
        <div className="w-full md:w-2/3 flex flex-col">
          {currentConversation ? (
            <>
              <ConversationHeader
                username={currentConversation.username}
                isBlocked={currentConversation.blocked}
                onRecommendProduct={() => setIsProductDialogOpen(true)}
                onToggleBlockUser={() => handleToggleBlockUser(currentConversation.id)}
                onDeleteConversation={() => handleDeleteConversation(currentConversation.id)}
              />
              
              <ConversationBody
                messages={currentConversation.messages}
                isBlocked={currentConversation.blocked}
                onSendMessage={handleSendMessage}
                isSending={isSending}
              />
            </>
          ) : (
            <EmptyConversationState />
          )}
        </div>
      </div>
      
      {/* Product recommendation dialog */}
      <ProductRecommendationDialog
        isOpen={isProductDialogOpen}
        onOpenChange={setIsProductDialogOpen}
        onSendRecommendations={handleSendProductRecommendations}
        username={currentConversation?.username}
      />
    </div>
  );
};

export default ExpertChatView;
