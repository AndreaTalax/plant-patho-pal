
import { useState } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Send, ChevronRight } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

const ChatTab = () => {
  const [activeChat, setActiveChat] = useState<string | null>(null);
  
  // Mock data
  const experts = [
    { id: '1', name: 'Dr. Sarah Johnson', specialty: 'Fungal Diseases', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=256&h=256&auto=format&fit=crop', email: 'sarah.johnson@drplant.com' },
    { id: '2', name: 'Prof. Michael Chen', specialty: 'Insect Pests', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=256&h=256&auto=format&fit=crop', email: 'michael.chen@drplant.com' },
    { id: '3', name: 'Dr. Aisha Patel', specialty: 'Nutrient Deficiencies', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=256&h=256&auto=format&fit=crop', email: 'aisha.patel@drplant.com' },
  ];
  
  const [messages, setMessages] = useState<Array<{id: string, sender: string, text: string, time: string}>>([
    { id: '1', sender: 'expert', text: 'Hello! I see you may have a case of powdery mildew. Could you provide more details about your plant?', time: '10:30 AM' },
  ]);
  
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  const sendMessage = async () => {
    if (newMessage.trim() === '') return;
    
    const now = new Date();
    const timeStr = now.getHours() + ':' + now.getMinutes().toString().padStart(2, '0');
    
    // Add user message to chat
    setMessages([...messages, {
      id: Date.now().toString(),
      sender: 'user',
      text: newMessage,
      time: timeStr
    }]);
    
    setIsSending(true);
    
    try {
      // Get the expert who's being messaged
      const activeExpert = experts.find(e => e.id === activeChat);
      
      if (activeExpert) {
        // In a real app, this would be a backend API call
        console.log(`Sending email notification to: ${activeExpert.email}`);
        console.log(`Message content: ${newMessage}`);
        
        // Simulate API call to send email notification
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        toast.success(`Notification sent to ${activeExpert.name}`);
      }
      
      // Clear input after sending
      setNewMessage('');
      
      // Simulate expert response after a delay
      setTimeout(() => {
        setMessages(curr => [...curr, {
          id: (Date.now() + 1).toString(),
          sender: 'expert',
          text: "Thanks for the additional details. Based on the symptoms you've described, it sounds like we're dealing with a fungal infection. I'd recommend a treatment with neem oil or a potassium bicarbonate solution. Would you like me to recommend some specific products from our shop?",
          time: (new Date().getHours() + ':' + new Date().getMinutes().toString().padStart(2, '0'))
        }]);
      }, 2000);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full pt-6 pb-24">
      {!activeChat ? (
        <div className="px-4">
          <h2 className="text-2xl font-bold mb-6 text-drplant-green">Expert Consultation</h2>
          
          <div className="space-y-4">
            <p className="text-gray-600">Connect with plant pathologists and agronomists for expert advice on your plant health issues.</p>
            
            {experts.map(expert => (
              <Card 
                key={expert.id} 
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                onClick={() => setActiveChat(expert.id)}
              >
                <div className="flex items-center gap-3">
                  <Avatar>
                    <img src={expert.avatar} alt={expert.name} />
                  </Avatar>
                  <div>
                    <h3 className="font-medium">{expert.name}</h3>
                    <p className="text-sm text-gray-500">{expert.specialty}</p>
                  </div>
                </div>
                <ChevronRight className="text-gray-400" />
              </Card>
            ))}
            
            <div className="mt-6 text-center text-gray-500 text-sm">
              <p>Response time: typically within 1-2 hours</p>
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
            <Avatar className="h-8 w-8">
              <img 
                src={experts.find(e => e.id === activeChat)?.avatar} 
                alt={experts.find(e => e.id === activeChat)?.name}
              />
            </Avatar>
            <div>
              <h3 className="font-medium text-sm">
                {experts.find(e => e.id === activeChat)?.name}
              </h3>
              <p className="text-xs text-green-600">Online</p>
            </div>
          </div>
          
          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                placeholder="Type your message..."
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
