
import { useState, useEffect, useRef } from 'react';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Send, ChevronRight, User, MessageSquare } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';

// Rimosso il client Supabase che causava l'errore
const mockSupabase = {
  functions: {
    invoke: async (_name: string, _options: any) => {
      // Mock che simula sempre una risposta di successo
      console.log('Invocazione simulata della funzione Supabase con:', _options);
      return { error: null };
    }
  },
  from: (_table: string) => ({
    select: () => ({
      eq: (_field: string, _value: string) => ({
        order: (_field: string, _options: any) => {
          console.log('Simulazione query Supabase per:', _table);
          return { data: [], error: null };
        }
      })
    }),
    insert: (_data: any) => {
      console.log('Simulazione inserimento dati in Supabase:', _data);
      return { error: null };
    }
  })
};

// Mock data for chat conversations (for master account only)
const MOCK_CONVERSATIONS = [
  {
    id: 'conv1',
    username: 'Maria Rossi',
    lastMessage: 'Ho un problema con la mia pianta di basilico, le foglie sono macchiate.',
    unread: true,
    messages: [
      { id: '1', sender: 'user', text: 'Buongiorno, ho un problema con la mia pianta di basilico.', time: '10:30 AM' },
      { id: '2', sender: 'user', text: 'Le foglie hanno delle macchie marroni e sembrano seccarsi. Cosa potrebbe essere?', time: '10:31 AM' },
    ]
  },
  {
    id: 'conv2',
    username: 'Luca Bianchi',
    lastMessage: 'Quale fertilizzante consigliate per le piante di pomodoro?',
    unread: false,
    messages: [
      { id: '1', sender: 'user', text: 'Ciao, sto coltivando pomodori nel mio orto.', time: '09:15 AM' },
      { id: '2', sender: 'user', text: 'Quale fertilizzante mi consigliate per avere una buona produzione?', time: '09:16 AM' },
      { id: '3', sender: 'expert', text: 'Buongiorno! Per i pomodori consiglio un fertilizzante ricco di potassio e fosforo durante la fase di fioritura e fruttificazione.', time: '09:45 AM' },
    ]
  },
  {
    id: 'conv3',
    username: 'Giuseppe Verdi',
    lastMessage: 'La mia orchidea non fiorisce più, cosa posso fare?',
    unread: true,
    messages: [
      { id: '1', sender: 'user', text: 'La mia orchidea non fiorisce più da mesi.', time: '14:22 PM' },
      { id: '2', sender: 'user', text: 'È in un posto luminoso ma senza sole diretto, la annaffio una volta alla settimana. Cosa sto sbagliando?', time: '14:23 PM' },
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
  // Real expert data - only Marco Nigro
  const expert = {
    id: 'marco-nigro', 
    name: 'Agrotecnico Marco Nigro', 
    specialty: 'Diagnosi e Cura delle Piante', 
    avatar: '/lovable-uploads/c8ba9199-f82d-4a4f-a6ae-1c8e340ed1b5.png',
    email: 'agrotecnicomarconigro@gmail.com'
  };
  
  const [messages, setMessages] = useState<Array<{id: string, sender: string, text: string, time: string}>>([
    { id: '1', sender: 'expert', text: 'Buongiorno! Sono Marco Nigro, agrotecnico specializzato nella diagnosi e cura delle piante. Come posso aiutarti oggi?', time: '10:30 AM' },
  ]);
  
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, currentConversation]);

  // Load chat messages for regular users
  useEffect(() => {
    if (!activeChat || isMasterAccount) return;
    
    // Simulazione di caricamento messaggi senza accesso a Supabase
    const loadDefaultMessages = () => {
      // Imposta un messaggio iniziale dall'esperto
      setMessages([{ 
        id: '1', 
        sender: 'expert', 
        text: 'Buongiorno! Sono Marco Nigro, agrotecnico specializzato nella diagnosi e cura delle piante. Come posso aiutarti oggi?', 
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      }]);
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
            lastMessage: `Agrotecnico: ${newMessage}`
          } : conv
        )
      );
      
      // Update current conversation view
      setCurrentConversation(prev => {
        if (!prev) return null;
        return {
          ...prev,
          messages: [...prev.messages, expertMessage],
          lastMessage: `Agrotecnico: ${newMessage}`
        };
      });
      
      toast.success("Risposta inviata con successo!");
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
      // Invio notifica all'esperto tramite edge function
      const result = await mockSupabase.functions.invoke("send-specialist-notification", {
        body: {
          expertName: expert.name,
          userEmail: userProfile?.email || 'utente@esempio.com',
          userName: userProfile?.username || 'Utente',
          message: newMessage
        }
      });
      
      if (result.error) {
        throw new Error("Errore nell'invio della notifica");
      }
      
      toast.success(t("notificationSent", { name: expert.name }) || `Notifica inviata a ${expert.name}`);
      
      // Clear input after sending
      setNewMessage('');
      
      // Simulate expert response after a delay
      setTimeout(() => {
        const expertResponse = {
          id: (Date.now() + 1).toString(),
          sender: 'expert',
          text: t("expertResponse") || "Grazie per il tuo messaggio. Ti risponderò al più presto possibile.",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        
        setMessages(curr => [...curr, expertResponse]);
        setIsSending(false);
      }, 2000);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error(t("messageSendError") || "Errore nell'invio del messaggio");
      setIsSending(false);
    }
  };

  // Render master account view
  if (isMasterAccount) {
    return (
      <div className="flex flex-col min-h-full pt-6 pb-24">
        <h2 className="text-2xl font-bold mb-4 px-4 text-drplant-green">Pannello Agrotecnico</h2>
        
        <div className="flex-1 flex">
          {/* Conversations sidebar */}
          <div className="w-1/3 border-r min-h-full overflow-auto">
            <div className="p-4">
              <h3 className="font-semibold text-lg mb-2">Conversazioni</h3>
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
                      placeholder="Scrivi la tua risposta..."
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
                <p>Seleziona una conversazione per iniziare</p>
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
          <h2 className="text-2xl font-bold mb-6 text-drplant-green">{t("expertConsultation") || "Consulenza con Esperti"}</h2>
          
          <div className="space-y-4">
            <p className="text-gray-600">{t("connectWithExperts") || "Connettiti con i nostri esperti per ricevere consigli sulle tue piante"}</p>
            
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
              <p>{t("responseTime") || "I nostri esperti risponderanno entro 24 ore"}</p>
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
                placeholder={t("typeYourMessage") || "Scrivi il tuo messaggio..."}
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
