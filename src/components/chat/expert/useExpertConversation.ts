import { useState, useEffect } from 'react';
import { supabase, EXPERT_ID } from '@/integrations/supabase/client';
import { Conversation, DatabaseConversation, Message, Product } from '../types';
import { 
  loadConversations,
  loadMessages, 
  convertToUIMessage, 
  sendMessage as sendMessageService,
  updateConversationStatus
} from '../chatService';
import { toast } from 'sonner';

/**
 * A custom hook to manage expert conversations in a chat application.
 * @example
 * const { 
 *   conversations, 
 *   currentConversation, 
 *   isProductDialogOpen, 
 *   setIsProductDialogOpen, 
 *   isSending, 
 *   handleChatSelection, 
 *   handleDeleteConversation, 
 *   handleToggleBlockUser, 
 *   handleSendProductRecommendations, 
 *   handleSendMessage 
 * } = useExpertConversation(userId);
 * @param {string} userId - The unique identifier for the user whose conversations are to be managed.
 * @returns {Object} An object containing conversation state, UI functions, and methods to manage conversations.
 * @description
 *   - Initializes and manages conversations and message states for a specified expert user.
 *   - Listens for real-time updates on conversations and messages via Supabase.
 *   - Provides methods to manipulate conversation state including selecting chats, archiving/deleting conversations, blocking users, and sending messages.
 */
export const useExpertConversation = (userId: string) => {
  // State management
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [dbConversations, setDbConversations] = useState<DatabaseConversation[]>([]);
  const [currentDbConversation, setCurrentDbConversation] = useState<DatabaseConversation | null>(null);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  // Load conversations from database
  useEffect(() => {
    /**
     * Synchronizes and updates the conversation data for a user.
     * @example
     * sync()
     * undefined
     * @param {string} userId - The unique identifier for the user whose conversations are being loaded.
     * @returns {void} The function does not return a value.
     * @description
     *   - Fetches conversation data for a specific user and formats this data for UI representation.
     *   - Logs an error in the console if the conversation data cannot be fetched.
     *   - Sets the formatted conversation data to be used in the user interface.
     */
    const fetchConversations = async () => {
      try {
        const data = await loadConversations(userId);
        
        // Set database conversations
        setDbConversations(data);
        
        // Convert to UI format
        const convertedConversations = data.map((conv: DatabaseConversation) => {
          const username = conv.user?.username || conv.user_id;
          return {
            id: conv.id,
            title: conv.title || `Chat with ${username}`,
            lastMessage: conv.last_message_text || "No messages yet",
            time: conv.last_message_at ? new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
            unreadCount: 0, // TODO: Implement unread count
            expertId: conv.expert_id,
            user_id: conv.user_id,
            username: username,
            blocked: conv.status === "blocked",
            messages: [],
            unread: false // TODO: Implement unread status
          };
        });
        
        setConversations(convertedConversations);
      } catch (error) {
        console.error("Error fetching conversations:", error);
      }
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
  /**
   * Synchronizes the expert's view of a conversation using a given conversation ID.
   * @example
   * sync("12345")
   * () => { ... } // Unsubscribe function
   * @param {string} conversationId - The unique identifier for the conversation to be synchronized.
   * @returns {Function} Returns a function that when called will unsubscribe from the real-time updates.
   * @description
   *   - Converts and updates messages from the database into the UI format for the selected conversation.
   *   - Marks the conversation as read in the UI state by updating its unread status.
   *   - Sets up a real-time listener for new messages associated with the conversation ID.
   *   - Updates the current conversation view with new incoming messages.
   */
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
          console.log('Message received (expert view):', payload);
          const newMsg = payload.new;
          
          const formattedMessage = convertToUIMessage(newMsg as any);
          
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
      
    console.log("Expert subscribed to messages channel:", `messages-channel-${conversationId}`);
      
    return () => {
      supabase.removeChannel(messagesSubscription);
    };
  };
  
  // Delete conversation
  /**
   * Deletes a conversation completely and updates UI state accordingly.
   * @example
   * sync('conversation-123')
   * // Deletes 'conversation-123' and updates the UI.
   * @param {string} conversationId - The unique identifier of the conversation to be deleted.
   * @returns {void} Does not return a value.
   * @description
   *   - Attempts to delete the conversation using the Supabase edge function.
   *   - Displays a toast message indicating success or error in deletion.
   *   - Updates conversation list to exclude deleted conversation.
   *   - Resets current conversation if it matches the id of the deleted conversation.
   */
  const handleDeleteConversation = async (conversationId: string) => {
    try {
      console.log('🗑️ Attempting to delete conversation:', conversationId);
      
      // Call Supabase edge function to delete conversation
      const { data, error } = await supabase.functions.invoke('delete-conversation', {
        body: { conversationId }
      });
      
      if (error) {
        console.error('Error deleting conversation:', error);
        toast.error('Errore nell\'eliminazione della conversazione');
        return;
      }
      
      // Update UI state
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      if (currentConversation?.id === conversationId) {
        setCurrentConversation(null);
      }
      
      toast.success('Conversazione eliminata con successo');
    } catch (error) {
      console.error('Error in handleDeleteConversation:', error);
      toast.error('Errore nell\'eliminazione della conversazione');
    }
  };
  
  // Block/Unblock user
  /**
   * Toggles the block status of a conversation.
   * @example
   * sync("conversation123")
   * User has been blocked
   * @param {string} conversationId - The ID of the conversation to update.
   * @returns {void} No return value; operation is performed for its side effects.
   * @description
   *   - Utilizes a toast function to notify the user of success or error conditions.
   *   - Updates both the conversations list and the current conversation state based on the new block status.
   *   - Safely handles errors by logging them and informing the user via toast.
   *   - Determines the new block status based on the current status of the conversation.
   */
  const handleToggleBlockUser = async (conversationId: string) => {
    try {
      const isCurrentlyBlocked = conversations.find(c => c.id === conversationId)?.blocked || false;
      const newStatus = isCurrentlyBlocked ? 'active' : 'blocked';
      
      const success = await updateConversationStatus(conversationId, newStatus);
        
      if (!success) {
        toast(`Error ${isCurrentlyBlocked ? 'unblocking' : 'blocking'} user`);
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
      
      toast(isCurrentlyBlocked 
        ? "User has been unblocked" 
        : "User has been blocked"
      );
    } catch (error) {
      console.error("Error in handleToggleBlockUser:", error);
      toast("Error changing user block status");
    }
  };
  
  // Send product recommendations
  /**
   * Sends product recommendations to a user in a chat conversation
   * @example
   * sync([{ id: 1, name: 'Plant Food' }, { id: 2, name: 'Potting Soil' }])
   * // Displays toast notifications based on success or failure
   * @param {Product[]} products - A list containing recommended products.
   * @returns {void} Does not return a value.
   * @description
   *   - Requires a valid database conversation to proceed.
   *   - Uses sendMessageService to deliver the message and check for success.
   *   - Utilizes toast notifications to inform the user of the operation outcome.
   *   - Handles exceptions to ensure application stability upon errors.
   */
  const handleSendProductRecommendations = async (products: Product[]) => {
    if (!currentDbConversation || products.length === 0) {
      return;
    }
    
    try {
      setIsSending(true);

      // Convert products array to a formatted text message with products data
      const productText = 'I recommend the following products for your plant:';

      const success = await sendMessageService(
        currentDbConversation.id,
        EXPERT_ID,
        currentDbConversation.user_id,
        productText,
        undefined, // no image
        products // pass products as the products parameter
      );
        
      if (!success) {
        toast("Error sending product recommendations");
        setIsSending(false);
        return;
      }
      
      toast("Product recommendations sent!");
      setIsSending(false);
    } catch (error) {
      console.error("Error in sendProductRecommendations:", error);
      toast("Error sending product recommendations");
      setIsSending(false);
    }
  };
  
  // Send a regular text message
  /**
   * Sends a message in the chat conversation and updates the conversation state.
   * @example
   * sync("Hello, how can I help you?")
   * // Immediate UX feedback with the message sent.
   * @param {string} text - Message text to be sent by the expert.
   * @returns {void} No return value; updates UI state directly.
   * @description
   *   - Temporarily adds the message to conversation state to improve UX before the message is confirmed sent.
   *   - Removes the message if sending fails to maintain accurate conversation history.
   *   - Utilizes toast notifications to alert user of errors in sending.
   */
  const handleSendMessage = async (text: string) => {
    if (!currentDbConversation) return;
    
    try {
      setIsSending(true);
      
      // Add message to UI immediately to improve UX
      const tempMessage: Message = {
        id: `temp-${Date.now()}`,
        sender: 'expert',
        text: text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setCurrentConversation(prev => {
        if (!prev) return null;
        return {
          ...prev,
          messages: [...prev.messages, tempMessage]
        };
      });
      
      const success = await sendMessageService(
        currentDbConversation.id,
        EXPERT_ID,
        currentDbConversation.user_id,
        text
      );
        
      if (!success) {
        // Remove temp message if sending failed
        setCurrentConversation(prev => {
          if (!prev) return null;
          return {
            ...prev,
            messages: prev.messages.filter(msg => msg.id !== tempMessage.id)
          };
        });
        
        toast("Error sending message");
        setIsSending(false);
        return;
      }
      
      setIsSending(false);
    } catch (error) {
      console.error("Error in sendMessage:", error);
      toast("Error sending message");
      setIsSending(false);
    }
  };

  return {
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
  };
};
