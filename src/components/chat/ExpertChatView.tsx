
import { useState, useEffect } from 'react';
import { toast } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { ShoppingBag, User, MessageSquare, Trash2, Ban } from 'lucide-react';
import { supabase, EXPERT_ID } from '@/integrations/supabase/client';
import { Conversation, DatabaseConversation, Message, Product } from './types';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import ConversationList from './ConversationList';
import ProductRecommendationDialog from './ProductRecommendationDialog';
import { 
  loadConversations,
  loadMessages, 
  convertToUIMessage, 
  sendMessage as sendMessageService,
  updateConversationStatus
} from './chatService';

interface ExpertChatViewProps {
  userId: string;
}

const ExpertChatView = ({ userId }: ExpertChatViewProps) => {
  // State management
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [dbConversations, setDbConversations] = useState<DatabaseConversation[]>([]);
  const [currentDbConversation, setCurrentDbConversation] = useState<DatabaseConversation | null>(null);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  // Load conversations from database
  useEffect(() => {
    const fetchConversations = async () => {
      const data = await loadConversations(true, userId);
      
      // Cast data to the DatabaseConversation type
      const typedData = data as unknown as DatabaseConversation[];
      setDbConversations(typedData);
      
      // Convert to UI format
      const convertedConversations = typedData.map((conv: DatabaseConversation) => {
        const username = conv.user?.username || conv.user_id;
        return {
          id: conv.id,
          username: username,
          lastMessage: conv.last_message_text || "No messages yet",
          unread: false, // TODO: Implement unread status
          blocked: conv.status === "blocked",
          messages: []
        };
      });
      
      setConversations(convertedConversations);
    };
    
    fetchConversations();
    
    // Set up a realtime subscription for conversations
    const conversationsSubscription = supabase
      .channel('conversations-channel')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'conversations' 
        }, 
        (payload) => {
          console.log('Conversation change received:', payload);
          fetchConversations();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(conversationsSubscription);
    };
  }, [userId]);
  
  // Handle chat selection
  const handleChatSelection = async (conversationId: string) => {
    const selected = dbConversations.find(conv => conv.id === conversationId);
    if (!selected) return;
    
    setCurrentDbConversation(selected);
    
    // Load messages for this conversation
    const messagesData = await loadMessages(conversationId);
    
    // Convert to UI format
    const messagesForConversation = messagesData.map(msg => convertToUIMessage(msg));
    
    // Find conversation in UI state and update
    const uiConversation = conversations.find(conv => conv.id === conversationId);
    if (uiConversation) {
      setCurrentConversation({
        ...uiConversation,
        messages: messagesForConversation || [],
        unread: false // Mark as read
      });
      
      // Update state to mark as read
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId ? {...conv, unread: false} : conv
        )
      );
    }
    
    // Set up realtime subscription for messages in this conversation
    const messagesSubscription = supabase
      .channel(`messages-channel-${conversationId}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        }, 
        (payload) => {
          console.log('Message received:', payload);
          const newMsg = payload.new;
          
          const formattedMessage = convertToUIMessage(newMsg);
          
          // Update current conversation
          setCurrentConversation(prev => {
            if (!prev) return null;
            return {
              ...prev,
              messages: [...prev.messages, formattedMessage]
            };
          });
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(messagesSubscription);
    };
  };
  
  // Delete conversation
  const handleDeleteConversation = async (conversationId: string) => {
    try {
      // Archive conversation instead of deleting it
      const success = await updateConversationStatus(conversationId, 'archived');
        
      if (!success) {
        toast.error("Error archiving conversation");
        return;
      }
      
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      if (currentConversation?.id === conversationId) {
        setCurrentConversation(null);
      }
      
      toast.success("Conversation deleted successfully");
    } catch (error) {
      console.error("Error in handleDeleteConversation:", error);
      toast.error("Error deleting conversation");
    }
  };
  
  // Block/Unblock user
  const handleToggleBlockUser = async (conversationId: string) => {
    try {
      const isCurrentlyBlocked = conversations.find(c => c.id === conversationId)?.blocked || false;
      const newStatus = isCurrentlyBlocked ? 'active' : 'blocked';
      
      const success = await updateConversationStatus(conversationId, newStatus);
        
      if (!success) {
        toast.error(`Error ${isCurrentlyBlocked ? 'unblocking' : 'blocking'} user`);
        return;
      }
      
      // Update UI state
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId ? {...conv, blocked: !isCurrentlyBlocked} : conv
        )
      );
      
      if (currentConversation?.id === conversationId) {
        setCurrentConversation(prev => 
          prev ? {...prev, blocked: !isCurrentlyBlocked} : null
        );
      }
      
      toast.success(isCurrentlyBlocked 
        ? "User has been unblocked" 
        : "User has been blocked"
      );
    } catch (error) {
      console.error("Error in handleToggleBlockUser:", error);
      toast.error("Error changing user block status");
    }
  };
  
  // Send product recommendations
  const handleSendProductRecommendations = async (products: Product[]) => {
    if (!currentDbConversation || products.length === 0) {
      return;
    }
    
    try {
      setIsSending(true);

      const success = await sendMessageService(
        currentDbConversation.id,
        EXPERT_ID,
        currentDbConversation.user_id,
        'I recommend the following products for your plant:',
        products
      );
        
      if (!success) {
        toast.error("Error sending product recommendations");
        setIsSending(false);
        return;
      }
      
      toast.success("Product recommendations sent!");
      setIsSending(false);
    } catch (error) {
      console.error("Error in sendProductRecommendations:", error);
      toast.error("Error sending product recommendations");
      setIsSending(false);
    }
  };
  
  // Send a regular text message
  const handleSendMessage = async (text: string) => {
    if (!currentDbConversation) return;
    
    try {
      setIsSending(true);
      
      const success = await sendMessageService(
        currentDbConversation.id,
        EXPERT_ID,
        currentDbConversation.user_id,
        text
      );
        
      if (!success) {
        toast.error("Error sending message");
        setIsSending(false);
        return;
      }
      
      setIsSending(false);
      toast.success("Reply sent successfully!");
    } catch (error) {
      console.error("Error in sendMessage:", error);
      toast.error("Error sending message");
      setIsSending(false);
    }
  };

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
              <div className="bg-white p-2 shadow-sm flex items-center justify-between border-b">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <User className="h-4 w-4" />
                  </Avatar>
                  <div>
                    <h3 className="font-medium text-sm">
                      {currentConversation.username}
                      {currentConversation.blocked && <span className="ml-1 text-xs bg-red-100 text-red-600 px-1 rounded">Blocked</span>}
                    </h3>
                  </div>
                </div>
                
                <div className="flex items-center space-x-1">
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="gap-1 text-xs py-1 h-7"
                    onClick={() => setIsProductDialogOpen(true)}
                    disabled={currentConversation.blocked}
                  >
                    <ShoppingBag className="h-3 w-3" />
                    Recommend
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-6 w-6 text-red-500 hover:bg-red-50"
                    onClick={() => handleToggleBlockUser(currentConversation.id)}
                    title={currentConversation.blocked ? "Unblock user" : "Block user"}
                  >
                    <Ban className="h-3 w-3" />
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-6 w-6 text-red-500 hover:bg-red-50"
                    onClick={() => handleDeleteConversation(currentConversation.id)}
                    title="Delete conversation"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <MessageList 
                messages={currentConversation.messages}
                isExpertView={true}
              />
              
              <div className="p-2 border-t bg-white">
                {currentConversation.blocked ? (
                  <div className="p-2 bg-red-50 text-red-600 rounded-md text-center text-sm">
                    This user is blocked. Unblock to continue.
                  </div>
                ) : (
                  <MessageInput
                    onSendMessage={handleSendMessage}
                    isSending={isSending}
                    isMasterAccount={true}
                  />
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
              <MessageSquare className="h-10 w-10 mb-3 text-gray-300" />
              <p className="text-sm">Select a conversation to start</p>
            </div>
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
