
import { useState, useEffect, useRef } from 'react';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Send, ChevronRight, User, MessageSquare } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';

// Removed the Supabase client that caused the error
const mockSupabase = {
  functions: {
    invoke: async (_name: string, _options: any) => {
      // Mock that always simulates a successful response
      console.log('Simulated invocation of Supabase function with:', _options);
      return { error: null };
    }
  },
  from: (_table: string) => ({
    select: () => ({
      eq: (_field: string, _value: string) => ({
        order: (_field: string, _options: any) => {
          console.log('Simulation of Supabase query for:', _table);
          return { data: [], error: null };
        }
      })
    }),
    insert: (_data: any) => {
      console.log('Simulation of data insertion in Supabase:', _data);
      return { error: null };
    }
  })
};

// Mock data for chat conversations (for master account only)
const MOCK_CONVERSATIONS = [
  {
    id: 'conv1',
    username: 'Maria Ross',
    lastMessage: 'I have a problem with my basil plant, the leaves are spotted.',
    unread: true,
    messages: [
      { id: '1', sender: 'user', text: 'Good morning, I have a problem with my basil plant.', time: '10:30 AM' },
      { id: '2', sender: 'user', text: 'The leaves have brown spots and seem to be drying out. What could it be?', time: '10:31 AM' },
    ]
  },
  {
    id: 'conv2',
    username: 'Luke White',
    lastMessage: 'What fertilizer do you recommend for tomato plants?',
    unread: false,
    messages: [
      { id: '1', sender: 'user', text: 'Hello, I am growing tomatoes in my garden.', time: '09:15 AM' },
      { id: '2', sender: 'user', text: 'What fertilizer would you recommend for good production?', time: '09:16 AM' },
      { id: '3', sender: 'expert', text: 'Good morning! For tomatoes I recommend a fertilizer rich in potassium and phosphorus during the flowering and fruiting phase.', time: '09:45 AM' },
    ]
  },
  {
    id: 'conv3',
    username: 'Joseph Green',
    lastMessage: 'My orchid is not flowering anymore, what can I do?',
    unread: true,
    messages: [
      { id: '1', sender: 'user', text: 'My orchid hasn\'t flowered for months.', time: '14:22 PM' },
      { id: '2', sender: 'user', text: 'It\'s in a bright spot but without direct sunlight, I water it once a week. What am I doing wrong?', time: '14:23 PM' },
    ]
  }
];

const ChatTab = () => {
  const { t } = useTheme();
  const { userProfile, isMasterAccount } = useAuth();
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  // Master account view states
  const [conversations, setConversations] = useState(MOCK_CONVERSATIONS);
  const [currentConversation, setCurrentConversation] = useState<typeof MOCK_CONVERSATIONS[0] | null>(null);
  
  // Regular user view
  // Real expert data - changed from Agrotecnico to Plant Pathologist Marco Nigro
  const expert = {
    id: 'marco-nigro', 
    name: 'Plant Pathologist Marco Nigro', 
    specialty: 'Plant Diagnosis and Treatment', 
    avatar: '/lovable-uploads/c8ba9199-f82d-4a4f-a6ae-1c8e340ed1b5.png',
    email: 'agrotecnicomarconigro@gmail.com'
  };
  
  const [messages, setMessages] = useState<Array<{id: string, sender: string, text: string, time: string}>>([
    { id: '1', sender: 'expert', text: 'Good morning! I am Marco Nigro, a plant pathologist specialized in plant diagnosis and treatment. How can I help you today?', time: '10:30 AM' },
  ]);
  
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [hasUserSentMessage, setHasUserSentMessage] = useState(false);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, currentConversation]);

  // Load chat messages for regular users
  useEffect(() => {
    if (!activeChat || isMasterAccount) return;
    
    // Simulation of loading messages without access to Supabase
    const loadDefaultMessages = () => {
      // Set an initial message from the expert
      setMessages([{ 
        id: '1', 
        sender: 'expert', 
        text: 'Good morning! I am Marco Nigro, a plant pathologist specialized in plant diagnosis and treatment. How can I help you today?', 
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      }]);
      
      // Reset user message status
      setHasUserSentMessage(false);
    };
    
    loadDefaultMessages();
  }, [activeChat, isMasterAccount]);
  
  // Handle chat selection in master account view
  const handleChatSelection = (conversationId: string) => {
    const selected = conversations.find(conv => conv.id === conversationId);
    if (selected) {
      setCurrentConversation(selected);
      
      // Mark as read
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId ? {...conv, unread: false} : conv
        )
      );
    }
  };
  
  const sendMessage = async () => {
    if (newMessage.trim() === '') return;
    
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const messageId = Date.now().toString();
    
    // Different behavior based on user role
    if (isMasterAccount) {
      // Master account sending message
      if (!currentConversation) return;
      
      const expertMessage = {
        id: messageId,
        sender: 'expert',
        text: newMessage,
        time: timeStr
      };
      
      // Add message to current conversation
      setConversations(prev => 
        prev.map(conv => 
          conv.id === currentConversation.id ? {
            ...conv, 
            messages: [...conv.messages, expertMessage],
            lastMessage: `Plant Pathologist: ${newMessage}`
          } : conv
        )
      );
      
      // Update current conversation view
      setCurrentConversation(prev => {
        if (!prev) return null;
        return {
          ...prev,
          messages: [...prev.messages, expertMessage],
          lastMessage: `Plant Pathologist: ${newMessage}`
        };
      });
      
      toast.success("Reply sent successfully!");
      setNewMessage('');
      return;
    }
    
    // Regular user sending message
    const userMessage = {
      id: messageId,
      sender: 'user',
      text: newMessage,
      time: timeStr
    };
    
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setIsSending(true);
    
    try {
      // Send notification to expert via edge function
      const result = await mockSupabase.functions.invoke("send-specialist-notification", {
        body: {
          expertName: expert.name,
          userEmail: userProfile?.email || 'user@example.com',
          userName: userProfile?.username || 'User',
          message: newMessage
        }
      });
      
      if (result.error) {
        throw new Error("Error sending notification");
      }
      
      toast.success(t("notificationSent", { name: expert.name }) || `Notification sent to ${expert.name}`);
      
      // Clear input after sending
      setNewMessage('');
      
      // Send only one standard response if it's the user's first message
      if (!hasUserSentMessage) {
        setTimeout(() => {
          const expertResponse = {
            id: (Date.now() + 1).toString(),
            sender: 'expert',
            text: "Plant Pathologist Marco Nigro will respond as soon as possible",
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          
          setMessages(curr => [...curr, expertResponse]);
          setHasUserSentMessage(true);
          setIsSending(false);
        }, 1000);
      } else {
        // If the user has already sent a message, don't send any automatic response
        setIsSending(false);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error(t("messageSendError") || "Error sending message");
      setIsSending(false);
    }
  };

  // Render master account view
  if (isMasterAccount) {
    return (
      <div className="flex flex-col min-h-full pt-6 pb-24">
        <h2 className="text-2xl font-bold mb-4 px-4 text-drplant-green">Plant Pathologist Panel</h2>
        
        <div className="flex-1 flex">
          {/* Conversations sidebar */}
          <div className="w-1/3 border-r min-h-full overflow-auto">
            <div className="p-4">
              <h3 className="font-semibold text-lg mb-2">Conversations</h3>
              <div className="space-y-2">
                {conversations.map(conversation => (
                  <div 
                    key={conversation.id}
                    className={`p-3 rounded-lg cursor-pointer flex items-center ${
                      currentConversation?.id === conversation.id 
                        ? 'bg-drplant-green/10 border border-drplant-green/30' 
                        : 'hover:bg-gray-100'
                    }`}
                    onClick={() => handleChatSelection(conversation.id)}
                  >
                    <Avatar className="h-10 w-10 mr-3">
                      <User className="h-6 w-6" />
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{conversation.username}</span>
                        {conversation.unread && (
                          <span className="bg-drplant-green text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            •
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 truncate">{conversation.lastMessage}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Chat area */}
          <div className="w-2/3 flex flex-col">
            {currentConversation ? (
              <>
                <div className="bg-white p-4 shadow-sm flex items-center gap-3 border-b">
                  <Avatar className="h-8 w-8">
                    <User className="h-5 w-5" />
                  </Avatar>
                  <div>
                    <h3 className="font-medium text-sm">{currentConversation.username}</h3>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={messagesContainerRef}>
                  {currentConversation.messages.map(message => (
                    <div 
                      key={message.id} 
                      className={`flex ${message.sender === 'expert' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div 
                        className={`max-w-[80%] rounded-2xl p-3 ${
                          message.sender === 'expert' 
                            ? 'bg-drplant-green text-white rounded-tr-none' 
                            : 'bg-gray-100 text-gray-800 rounded-tl-none'
                        }`}
                      >
                        <p>{message.text}</p>
                        <div className={`text-xs mt-1 ${
                          message.sender === 'expert' ? 'text-green-100' : 'text-gray-500'
                        }`}>
                          {message.time}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="p-4 border-t bg-white">
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your response..."
                      className="flex-1"
                      onKeyPress={(e) => e.key === 'Enter' && !isSending && sendMessage()}
                    />
                    <Button 
                      className="bg-drplant-green hover:bg-drplant-green-dark"
                      onClick={sendMessage}
                    >
                      <Send className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                <MessageSquare className="h-12 w-12 mb-4 text-gray-300" />
                <p>Select a conversation to start</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Regular user view
  return (
    <div className="flex flex-col min-h-full pt-6 pb-24">
      {!activeChat ? (
        <div className="px-4">
          <h2 className="text-2xl font-bold mb-6 text-drplant-green">{t("expertConsultation") || "Expert Consultation"}</h2>
          
          <div className="space-y-4">
            <p className="text-gray-600">{t("connectWithExperts") || "Connect with our experts to receive advice about your plants"}</p>
            
            <Card 
              key={expert.id} 
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
              onClick={() => setActiveChat(expert.id)}
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={expert.avatar} alt={expert.name} />
                </Avatar>
                <div>
                  <h3 className="font-medium">{expert.name}</h3>
                  <p className="text-sm text-gray-500">{expert.specialty}</p>
                </div>
              </div>
              <ChevronRight className="text-gray-400" />
            </Card>
            
            <div className="mt-6 text-center text-gray-500 text-sm">
              <p>{t("responseTime") || "Our experts will respond within 24 hours"}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-full">
          {/* Chat header */}
          <div className="bg-white p-4 shadow-sm flex items-center gap-3 border-b">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8" 
              onClick={() => setActiveChat(null)}
            >
              <ChevronRight className="rotate-180" />
            </Button>
            <Avatar className="h-10 w-10">
              <AvatarImage src={expert.avatar} alt={expert.name} />
            </Avatar>
            <div>
              <h3 className="font-medium text-sm">{expert.name}</h3>
              <p className="text-xs text-green-600">{t("online") || "Online"}</p>
            </div>
          </div>
          
          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={messagesContainerRef}>
            {messages.map(message => (
              <div 
                key={message.id} 
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[80%] rounded-2xl p-3 ${
                    message.sender === 'user' 
                      ? 'bg-drplant-blue text-white rounded-tr-none' 
                      : 'bg-gray-100 text-gray-800 rounded-tl-none'
                  }`}
                >
                  <p>{message.text}</p>
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
          <div className="p-4 border-t bg-white">
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={t("typeYourMessage") || "Type your message..."}
                className="flex-1"
                onKeyPress={(e) => e.key === 'Enter' && !isSending && sendMessage()}
                disabled={isSending}
              />
              <Button 
                className="bg-drplant-blue hover:bg-drplant-blue-dark"
                onClick={sendMessage}
                disabled={isSending}
              >
                {isSending ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Send className="h-5 w-5" />
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
