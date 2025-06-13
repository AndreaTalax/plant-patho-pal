
import React, { useEffect } from 'react';
import { useUserChatRealtime } from './user/useUserChatRealtime';
import { usePlantInfo } from '@/context/PlantInfoContext';
import { useAuth } from '@/context/AuthContext';
import { ConsultationDataService } from '@/services/chat/consultationDataService';
import { toast } from 'sonner';
import ChatHeader from './user/ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import EmptyStateView from './user/EmptyStateView';

interface UserChatViewRealtimeProps {
  userId: string;
}

export const UserChatViewRealtime: React.FC<UserChatViewRealtimeProps> = ({ userId }) => {
  const { plantInfo } = usePlantInfo();
  const { userProfile } = useAuth();
  const {
    activeChat,
    setActiveChat,
    messages,
    isSending,
    isConnected,
    handleSendMessage,
    startChatWithExpert,
    currentConversationId
  } = useUserChatRealtime(userId);

  // Send initial consultation data automatically when chat is active and data is available
  useEffect(() => {
    const sendInitialData = async () => {
      if (!activeChat || 
          !currentConversationId || 
          !plantInfo?.infoComplete || 
          !userProfile ||
          messages.length === 0) {
        return;
      }

      console.log('🔄 Checking if consultation data should be sent automatically...');
      
      try {
        // Check if data was already sent
        const alreadySent = await ConsultationDataService.isConsultationDataSent(currentConversationId);
        
        if (alreadySent) {
          console.log('✅ Consultation data already sent');
          return;
        }

        console.log('📤 Sending initial consultation data automatically...');

        // Prepare plant data
        const plantData = {
          symptoms: plantInfo.symptoms || 'Nessun sintomo specificato',
          wateringFrequency: plantInfo.wateringFrequency || 'Non specificata',
          sunExposure: plantInfo.lightExposure || 'Non specificata',
          environment: plantInfo.isIndoor ? 'Interno' : 'Esterno',
          plantName: plantInfo.name || 'Pianta non identificata',
          imageUrl: plantInfo.uploadedImageUrl,
          aiDiagnosis: (plantInfo as any).aiDiagnosis,
          useAI: plantInfo.useAI,
          sendToExpert: plantInfo.sendToExpert
        };

        // Prepare user data
        const userData = {
          firstName: userProfile.first_name || '',
          lastName: userProfile.last_name || '',
          email: userProfile.email || '',
          birthDate: userProfile.birth_date || 'Non specificata',
          birthPlace: userProfile.birth_place || 'Non specificato'
        };

        // Send data
        const success = await ConsultationDataService.sendInitialConsultationData(
          currentConversationId,
          plantData,
          userData,
          plantInfo.useAI || false
        );

        if (success) {
          toast.success('Dati inviati automaticamente all\'esperto!', {
            description: 'Marco Nigro ha ricevuto tutte le informazioni sulla tua pianta'
          });
        }

      } catch (error) {
        console.error('❌ Error sending automatic consultation data:', error);
      }
    };

    // Delay to ensure conversation is fully loaded
    const timer = setTimeout(sendInitialData, 2000);
    return () => clearTimeout(timer);
  }, [activeChat, currentConversationId, plantInfo?.infoComplete, userProfile, messages.length]);

  const handleStartChat = () => {
    startChatWithExpert();
  };

  const handleBackClick = () => {
    setActiveChat(null);
  };

  if (!activeChat || activeChat !== 'expert') {
    return <EmptyStateView onStartChat={handleStartChat} />;
  }

  return (
    <div className="flex flex-col h-full">
      <ChatHeader 
        onBackClick={handleBackClick}
        isConnected={isConnected}
      />
      <MessageList messages={messages} />
      <MessageInput 
        onSendMessage={handleSendMessage}
        isSending={isSending}
      />
    </div>
  );
};
