import { useState, useEffect } from 'react';
import { toast } from '@/components/ui/sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { ChevronRight, MessageSquare } from 'lucide-react';
import { supabase, EXPERT_ID } from '@/integrations/supabase/client';
import { useTheme } from '@/context/ThemeContext';
import { Message, DatabaseConversation, EXPERT } from './types';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import {
  findOrCreateConversation,
  loadMessages,
  convertToUIMessage,
  sendMessage as sendMessageService
} from './chatService';

interface UserChatViewProps {
  userId: string;
}

const UserChatView = ({ userId }: UserChatViewProps) => {
  const { t } = useTheme();
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentDbConversation, setCurrentDbConversation] = useState<DatabaseConversation | null>(null);
  const [isSending, setIsSending] = useState(false);
  
  // Initialize chat when activeChat changes
  useEffect(() => {
    if (!activeChat || !userId) return;
    
    const initializeChat = async () => {
      // Get or create conversation
      const conversation = await findOrCreateConversation(userId);
      if (!conversation) {
        toast.error("Could not start conversation with expert");
        return;
      }
      
      setCurrentDbConversation(conversation);
      
      // Load messages
      const messagesData = await loadMessages(conversation.id);
      
      // Convert to UI format
      const messagesForConversation = messagesData.map(msg => convertToUIMessage(msg));
      
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
            const newMsg = payload.new;
            
            const formattedMessage = convertToUIMessage(newMsg as any);
            
            setMessages(prev => [...prev, formattedMessage]);
          }
        )
        .subscribe();
        
      return () => {
        supabase.removeChannel(messagesSubscription);
      };
    };
    
    initializeChat();
  }, [activeChat, userId]);
  
  // Send message
  const handleSendMessage = async (text: string) => {
    try {
      setIsSending(true);
      
      // Create conversation if it doesn't exist
      if (!currentDbConversation) {
        const conversation = await findOrCreateConversation(userId);
        if (!conversation) {
          toast.error("Could not create conversation");
          setIsSending(false);
          return;
        }
        setCurrentDbConversation(conversation);
      }
      
      const success = await sendMessageService(
        currentDbConversation!.id,
        userId,
        EXPERT_ID,
        text
      );
        
      if (!success) {
        toast.error("Error sending message");
        setIsSending(false);
        return;
      }
      
      setIsSending(false);
      toast.success(t("notificationSent", { name: EXPERT.name }) || `Message sent to ${EXPERT.name}`);
    } catch (error) {
      console.error("Error in handleSendMessage:", error);
      toast.error("Error sending message");
      setIsSending(false);
    }
  };

  // Show expert selection if no chat is active
  if (!activeChat) {
    return (
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
    );
  }

  // Show chat interface if chat is active
  return (
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
      <MessageList messages={messages} />
      
      {/* Message input */}
      <div className="p-3 border-t bg-white">
        <MessageInput
          onSendMessage={handleSendMessage}
          isSending={isSending}
        />
      </div>
    </div>
  );
};

export default UserChatView;
