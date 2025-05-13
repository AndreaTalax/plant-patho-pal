
import { useState, useEffect, useRef } from 'react';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Send, ChevronRight, User, MessageSquare, Trash2, Ban, ShoppingBag } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { supabase, EXPERT_ID } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Type definitions for messages and products
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
}

interface Message {
  id: string;
  sender: string;
  text: string;
  time: string;
  products?: Product[];
}

interface DatabaseMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  recipient_id: string;
  text: string;
  sent_at: string;
  read: boolean;
  products: Product[] | null;
}

interface Conversation {
  id: string;
  username: string;
  lastMessage: string;
  unread: boolean;
  blocked: boolean;
  messages: Message[];
}

interface DatabaseConversation {
  id: string;
  created_at: string;
  updated_at: string;
  expert_id: string;
  user_id: string;
  status: string | null;
  last_message_text: string | null;
  last_message_timestamp: string | null;
  user?: {
    id: string;
    username: string;
  };
  expert?: {
    id: string;
    username: string;
  };
}

// Mock data for available products
const MOCK_PRODUCTS: Product[] = [
  { 
    id: 'prod1', 
    name: 'Organic Fungicide', 
    description: 'Natural fungicide for treating various plant diseases', 
    price: 19.99,
    image: '/lovable-uploads/1cb629ef-f7f2-4b66-a48a-5f22564bb3fa.png'
  },
  { 
    id: 'prod2', 
    name: 'Plant Nutrient Solution', 
    description: 'Complete nutrient mix for healthy plant growth', 
    price: 24.99,
    image: '/lovable-uploads/c8ba9199-f82d-4a4f-a6ae-1c8e340ed1b5.png'
  },
  { 
    id: 'prod3', 
    name: 'Pest Control Spray', 
    description: 'Effective against common garden pests', 
    price: 15.99,
    image: '/placeholder.svg'
  }
];

// Marco Nigro's expert data
const EXPERT = {
  id: EXPERT_ID,
  name: 'Plant Pathologist Marco Nigro', 
  specialty: 'Plant Diagnosis and Treatment', 
  avatar: '/lovable-uploads/c8ba9199-f82d-4a4f-a6ae-1c8e340ed1b5.png',
  email: 'agrotecnicomarconigro@gmail.com'
};

const ChatTab = () => {
  const { t } = useTheme();
  const { userProfile, isMasterAccount } = useAuth();
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  // Database state
  const [dbConversations, setDbConversations] = useState<DatabaseConversation[]>([]);
  const [dbMessages, setDbMessages] = useState<DatabaseMessage[]>([]);
  const [currentDbConversation, setCurrentDbConversation] = useState<DatabaseConversation | null>(null);
  
  // Master account view states
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  
  // Product recommendation dialog state
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  
  // Regular user view
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, currentConversation]);

  // Load conversations and messages from database
  useEffect(() => {
    if (!userProfile) return;
    
    const loadConversations = async () => {
      try {
        let query;
        
        if (isMasterAccount) {
          // Expert fetches all conversations where they're the expert
          query = supabase
            .from('conversations')
            .select('*, user:profiles!conversations_user_id_fkey(id, username, first_name, last_name)')
            .eq('expert_id', EXPERT_ID)
            .order('updated_at', { ascending: false });
        } else {
          // Regular users fetch their conversations
          query = supabase
            .from('conversations')
            .select('*, expert:profiles!conversations_expert_id_fkey(id, username, first_name, last_name)')
            .eq('user_id', userProfile.email)
            .order('updated_at', { ascending: false });
        }
        
        const { data, error } = await query;
        
        if (error) {
          console.error("Error loading conversations:", error);
          return;
        }
        
        if (!data || data.length === 0) {
          console.log("No conversations found");
          return;
        }
        
        setDbConversations(data as DatabaseConversation[]);
        
        // Convert to UI format for master account
        if (isMasterAccount) {
          const convertedConversations = data.map((conv: DatabaseConversation) => {
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
        }
      } catch (error) {
        console.error("Error in loadConversations:", error);
      }
    };
    
    loadConversations();
    
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
          loadConversations();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(conversationsSubscription);
    };
  }, [userProfile, isMasterAccount]);

  // Load messages for a specific conversation
  const loadMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('sent_at', { ascending: true });
        
      if (error) {
        console.error("Error loading messages:", error);
        return [];
      }
      
      if (!data) {
        return [];
      }
      
      // Cast the data to DatabaseMessage[] since we know the structure
      const typedMessages = data as DatabaseMessage[];
      setDbMessages(typedMessages);
      
      // Convert to UI format
      const convertedMessages = typedMessages.map((msg: DatabaseMessage) => {
        return {
          id: msg.id,
          sender: msg.sender_id === EXPERT_ID ? 'expert' : 'user',
          text: msg.text,
          time: new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          products: msg.products || undefined
        };
      });
      
      return convertedMessages;
    } catch (error) {
      console.error("Error in loadMessages:", error);
      return [];
    }
  };
  
  // Find or create conversation between user and expert
  const findOrCreateConversation = async () => {
    if (!userProfile) return null;
    
    try {
      // Check if conversation already exists
      const { data: existingConversations, error: fetchError } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', userProfile.email)
        .eq('expert_id', EXPERT_ID)
        .limit(1);
        
      if (fetchError) {
        console.error("Error fetching conversations:", fetchError);
        return null;
      }
      
      if (existingConversations && existingConversations.length > 0) {
        return existingConversations[0] as DatabaseConversation;
      }
      
      // Create new conversation
      const newConversationData = {
        user_id: userProfile.email,
        expert_id: EXPERT_ID,
        status: 'active'
      };
      
      const { data: newConversation, error: createError } = await supabase
        .from('conversations')
        .insert(newConversationData)
        .select()
        .single();
        
      if (createError) {
        console.error("Error creating conversation:", createError);
        return null;
      }
      
      return newConversation as DatabaseConversation;
    } catch (error) {
      console.error("Error in findOrCreateConversation:", error);
      return null;
    }
  };

  // Load chat messages for regular users
  useEffect(() => {
    if (!activeChat || !userProfile || isMasterAccount) return;
    
    const initializeChat = async () => {
      // Get or create conversation
      const conversation = await findOrCreateConversation();
      if (!conversation) {
        toast.error("Could not start conversation with expert");
        return;
      }
      
      setCurrentDbConversation(conversation);
      
      // Load messages
      const messagesForConversation = await loadMessages(conversation.id);
      
      if (!messagesForConversation || messagesForConversation.length === 0) {
        // Add initial greeting message if no messages exist
        setMessages([{ 
          id: '1', 
          sender: 'expert', 
          text: 'Good morning! I am Marco Nigro, a plant pathologist specialized in plant diagnosis and treatment. How can I help you today?', 
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        }]);
      } else {
        setMessages(messagesForConversation);
      }
      
      // Set up realtime subscription for messages in this conversation
      const messagesSubscription = supabase
        .channel(`messages-channel-${conversation.id}`)
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'messages',
            filter: `conversation_id=eq.${conversation.id}`
          }, 
          (payload) => {
            console.log('Message received:', payload);
            const newMsg = payload.new as DatabaseMessage;
            
            const formattedMessage = {
              id: newMsg.id,
              sender: newMsg.sender_id === EXPERT_ID ? 'expert' : 'user',
              text: newMsg.text,
              time: new Date(newMsg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              products: newMsg.products || undefined
            };
            
            setMessages(prev => [...prev, formattedMessage]);
          }
        )
        .subscribe();
        
      return () => {
        supabase.removeChannel(messagesSubscription);
      };
    };
    
    initializeChat();
  }, [activeChat, userProfile, isMasterAccount]);
  
  // Handle chat selection in master account view
  const handleChatSelection = async (conversationId: string) => {
    const selected = dbConversations.find(conv => conv.id === conversationId);
    if (!selected) return;
    
    setCurrentDbConversation(selected);
    
    // Load messages for this conversation
    const messagesForConversation = await loadMessages(conversationId);
    
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
          const newMsg = payload.new as DatabaseMessage;
          
          const formattedMessage = {
            id: newMsg.id,
            sender: newMsg.sender_id === EXPERT_ID ? 'expert' : 'user',
            text: newMsg.text,
            time: new Date(newMsg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            products: newMsg.products || undefined
          };
          
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
  
  // Delete conversation (Master account only)
  const handleDeleteConversation = async (conversationId: string) => {
    try {
      // Archive conversation instead of deleting it
      const { error } = await supabase
        .from('conversations')
        .update({ status: 'archived' })
        .eq('id', conversationId);
        
      if (error) {
        console.error("Error archiving conversation:", error);
        toast.error("Error deleting conversation");
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
  
  // Block/Unblock user (Master account only)
  const handleToggleBlockUser = async (conversationId: string) => {
    try {
      const isCurrentlyBlocked = conversations.find(c => c.id === conversationId)?.blocked || false;
      const newStatus = isCurrentlyBlocked ? 'active' : 'blocked';
      
      const { error } = await supabase
        .from('conversations')
        .update({ status: newStatus })
        .eq('id', conversationId);
        
      if (error) {
        console.error("Error updating conversation status:", error);
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
  
  // Open product recommendation dialog
  const openProductDialog = () => {
    setSelectedProducts([]);
    setIsProductDialogOpen(true);
  };
  
  // Toggle product selection
  const toggleProductSelection = (product: Product) => {
    setSelectedProducts(prev => {
      const isAlreadySelected = prev.some(p => p.id === product.id);
      
      if (isAlreadySelected) {
        return prev.filter(p => p.id !== product.id);
      } else {
        return [...prev, product];
      }
    });
  };
  
  // Send selected products as recommendations
  const sendProductRecommendations = async () => {
    if (!currentDbConversation || !userProfile || selectedProducts.length === 0) {
      setIsProductDialogOpen(false);
      return;
    }
    
    try {
      const messageData = {
        conversation_id: currentDbConversation.id,
        sender_id: isMasterAccount ? EXPERT_ID : userProfile.email,
        recipient_id: isMasterAccount ? currentDbConversation.user_id : EXPERT_ID,
        text: 'I recommend the following products for your plant:',
        products: selectedProducts
      };
      
      const { error } = await supabase
        .from('messages')
        .insert(messageData);
        
      if (error) {
        console.error("Error sending products:", error);
        toast.error("Error sending product recommendations");
        return;
      }
      
      toast.success("Product recommendations sent!");
      setIsProductDialogOpen(false);
    } catch (error) {
      console.error("Error in sendProductRecommendations:", error);
      toast.error("Error sending product recommendations");
    }
  };
  
  const sendMessage = async () => {
    if (newMessage.trim() === '' || !userProfile) return;
    
    setIsSending(true);
    
    try {
      if (!currentDbConversation) {
        // Create conversation if it doesn't exist (for regular users)
        const conversation = await findOrCreateConversation();
        if (!conversation) {
          toast.error("Could not create conversation");
          setIsSending(false);
          return;
        }
        setCurrentDbConversation(conversation);
      }
      
      const messageData = {
        conversation_id: currentDbConversation?.id,
        sender_id: isMasterAccount ? EXPERT_ID : userProfile.email,
        recipient_id: isMasterAccount ? currentDbConversation?.user_id : EXPERT_ID,
        text: newMessage
      };
      
      const { error } = await supabase
        .from('messages')
        .insert(messageData);
        
      if (error) {
        console.error("Error sending message:", error);
        toast.error("Error sending message");
        setIsSending(false);
        return;
      }
      
      // Clear input after sending
      setNewMessage('');
      setIsSending(false);
      
      // No need to update the UI state manually since we have real-time subscriptions
      
      // If it's a master account, provide feedback
      if (isMasterAccount) {
        toast.success("Reply sent successfully!");
      } else {
        toast.success(t("notificationSent", { name: EXPERT.name }) || `Message sent to ${EXPERT.name}`);
      }
    } catch (error) {
      console.error("Error in sendMessage:", error);
      toast.error("Error sending message");
      setIsSending(false);
    }
  };

  // Render master account view
  if (isMasterAccount) {
    return (
      <div className="flex flex-col h-full">
        <h2 className="text-xl font-bold mb-4 px-2 text-drplant-green">Plant Pathologist Panel</h2>
        
        <div className="flex-1 flex flex-col md:flex-row border rounded-lg overflow-hidden">
          {/* Conversations sidebar */}
          <div className="w-full md:w-1/3 border-r">
            <div className="p-2">
              <h3 className="font-medium text-sm mb-2">Conversations</h3>
              <div className="space-y-1">
                {conversations.map(conversation => (
                  <div 
                    key={conversation.id}
                    className={`p-2 rounded-lg cursor-pointer flex items-center ${
                      currentConversation?.id === conversation.id 
                        ? 'bg-drplant-green/10 border border-drplant-green/30' 
                        : 'hover:bg-gray-100'
                    } ${conversation.blocked ? 'opacity-50' : ''}`}
                    onClick={() => handleChatSelection(conversation.id)}
                  >
                    <Avatar className="h-8 w-8 mr-2">
                      <User className="h-5 w-5" />
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-sm">
                          {conversation.username}
                          {conversation.blocked && <span className="ml-1 text-xs bg-red-100 text-red-600 px-1 rounded">Blocked</span>}
                        </span>
                        {conversation.unread && (
                          <span className="bg-drplant-green text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                            •
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 truncate">{conversation.lastMessage}</p>
                    </div>
                    <div className="flex space-x-1 ml-1">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteConversation(conversation.id);
                        }}
                        title="Delete conversation"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className={`h-6 w-6 ${conversation.blocked ? 'text-green-500 hover:text-green-700 hover:bg-green-50' : 'text-red-500 hover:text-red-700 hover:bg-red-50'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleBlockUser(conversation.id);
                        }}
                        title={conversation.blocked ? "Unblock user" : "Block user"}
                      >
                        <Ban className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
                      onClick={openProductDialog}
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
                
                <div className="flex-1 overflow-y-auto p-3 space-y-3" ref={messagesContainerRef}>
                  {currentConversation.messages.map(message => (
                    <div 
                      key={message.id} 
                      className={`flex ${message.sender === 'expert' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div 
                        className={`max-w-[80%] rounded-lg p-2 ${
                          message.sender === 'expert' 
                            ? 'bg-drplant-green text-white rounded-tr-none' 
                            : 'bg-gray-100 text-gray-800 rounded-tl-none'
                        }`}
                      >
                        <p className="text-sm">{message.text}</p>
                        {message.products && (
                          <div className="mt-2 space-y-1">
                            {message.products.map(product => (
                              <div key={product.id} className="bg-white rounded-lg p-1 flex items-center gap-1 text-gray-800">
                                <div className="w-8 h-8 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                                  {product.image ? (
                                    <img src={product.image} alt={product.name} className="object-cover w-full h-full" />
                                  ) : (
                                    <ShoppingBag className="w-4 h-4 text-gray-400" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-xs">{product.name}</p>
                                  <p className="text-xs text-gray-500 truncate">{product.price.toFixed(2)} €</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className={`text-xs mt-1 ${
                          message.sender === 'expert' ? 'text-green-100' : 'text-gray-500'
                        }`}>
                          {message.time}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="p-2 border-t bg-white">
                  {currentConversation.blocked ? (
                    <div className="p-2 bg-red-50 text-red-600 rounded-md text-center text-sm">
                      This user is blocked. Unblock to continue.
                    </div>
                  ) : (
                    <div className="flex gap-1">
                      <Textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your response..."
                        className="flex-1 min-h-[60px] text-sm"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            if (!isSending) sendMessage();
                          }
                        }}
                      />
                      <Button 
                        size="sm"
                        className="bg-drplant-green hover:bg-drplant-green-dark h-full"
                        onClick={sendMessage}
                        disabled={isSending}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
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
        <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Recommend Products</DialogTitle>
              <DialogDescription>
                Select products to recommend to {currentConversation?.username}
              </DialogDescription>
            </DialogHeader>
            
            <div className="mt-4 space-y-3 max-h-80 overflow-y-auto">
              {MOCK_PRODUCTS.map(product => (
                <div 
                  key={product.id}
                  className={`
                    border rounded-lg p-3 flex items-center gap-3 cursor-pointer
                    ${selectedProducts.some(p => p.id === product.id) ? 'border-drplant-green bg-drplant-green/5' : 'border-gray-200'}
                  `}
                  onClick={() => toggleProductSelection(product)}
                >
                  <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="object-cover w-full h-full" />
                    ) : (
                      <ShoppingBag className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="font-medium">{product.name}</h4>
                    <p className="text-sm text-gray-500 line-clamp-2">{product.description}</p>
                    <p className="text-sm font-semibold mt-1">{product.price.toFixed(2)} €</p>
                  </div>
                  
                  <div className={`w-5 h-5 rounded-full border ${
                    selectedProducts.some(p => p.id === product.id) ? 'bg-drplant-green border-drplant-green' : 'border-gray-300'
                  }`}>
                    {selectedProducts.some(p => p.id === product.id) && (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-5 h-5">
                        <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end gap-3 mt-4">
              <Button 
                variant="outline" 
                onClick={() => setIsProductDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={sendProductRecommendations}
                disabled={selectedProducts.length === 0}
                className="bg-drplant-green hover:bg-drplant-green-dark"
              >
                Send Recommendations
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Regular user view
  return (
    <div className="flex flex-col min-h-full pt-3 pb-24">
      {!activeChat ? (
        <div className="px-4">
          <h2 className="text-xl font-bold mb-4 text-drplant-green">{t("expertConsultation") || "Expert Consultation"}</h2>
          
          <div className="space-y-4">
            <p className="text-gray-600 text-sm">{t("connectWithExperts") || "Connect with our experts to receive advice about your plants"}</p>
            
            <Card 
              key={EXPERT.id} 
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
              onClick={() => setActiveChat(EXPERT.id)}
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={EXPERT.avatar} alt={EXPERT.name} />
                </Avatar>
                <div>
                  <h3 className="font-medium">{EXPERT.name}</h3>
                  <p className="text-sm text-gray-500">{EXPERT.specialty}</p>
                </div>
              </div>
              <ChevronRight className="text-gray-400" />
            </Card>
            
            <div className="mt-4 text-center text-gray-500 text-sm">
              <p>{t("responseTime") || "Our experts will respond within 24 hours"}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-full">
          {/* Chat header */}
          <div className="bg-white p-3 shadow-sm flex items-center gap-3 border-b">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7" 
              onClick={() => setActiveChat(null)}
            >
              <ChevronRight className="rotate-180 h-4 w-4" />
            </Button>
            <Avatar className="h-8 w-8">
              <AvatarImage src={EXPERT.avatar} alt={EXPERT.name} />
            </Avatar>
            <div>
              <h3 className="font-medium text-sm">{EXPERT.name}</h3>
              <p className="text-xs text-green-600">{t("online") || "Online"}</p>
            </div>
          </div>
          
          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3" ref={messagesContainerRef}>
            {messages.map(message => (
              <div 
                key={message.id} 
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[80%] rounded-lg p-2 ${
                    message.sender === 'user' 
                      ? 'bg-drplant-blue text-white rounded-tr-none' 
                      : 'bg-gray-100 text-gray-800 rounded-tl-none'
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                  {message.products && (
                    <div className="mt-2 space-y-1">
                      {message.products.map(product => (
                        <div key={product.id} className="bg-white rounded-lg p-1 flex items-center gap-1 text-gray-800">
                          <div className="w-8 h-8 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                            {product.image ? (
                              <img src={product.image} alt={product.name} className="object-cover w-full h-full" />
                            ) : (
                              <ShoppingBag className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-xs">{product.name}</p>
                            <p className="text-xs text-gray-500 truncate">{product.price.toFixed(2)} €</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className={`text-xs mt-1 ${
                    message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {message.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Message input */}
          <div className="p-3 border-t bg-white">
            <div className="flex gap-1">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={t("typeYourMessage") || "Type your message..."}
                className="flex-1 h-9 text-sm"
                onKeyPress={(e) => e.key === 'Enter' && !isSending && sendMessage()}
                disabled={isSending}
              />
              <Button 
                size="sm"
                className="bg-drplant-blue hover:bg-drplant-blue-dark h-9 w-9 p-0"
                onClick={sendMessage}
                disabled={isSending}
              >
                {isSending ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatTab;
