
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

        // Prepare plant data with image URL
        const plantData = {
          symptoms: plantInfo.symptoms || 'Nessun sintomo specificato',
          wateringFrequency: plantInfo.wateringFrequency || 'Non specificata',
          sunExposure: plantInfo.lightExposure || 'Non specificata',
          environment: plantInfo.isIndoor ? 'Interno' : 'Esterno',
          plantName: plantInfo.name || 'Pianta non identificata',
          imageUrl: plantInfo.uploadedImageUrl, // Assicuriamoci che l'immagine sia inclusa
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

        console.log('📊 Sending data including image:', { 
          ...plantData, 
          hasImage: !!plantData.imageUrl 
        });

        // Send data
        const success = await ConsultationDataService.sendInitialConsultationData(
          currentConversationId,
          plantData,
          userData,
          plantInfo.useAI || false
        );

        if (success) {
          toast.success('Dati e immagine inviati automaticamente all\'esperto!', {
            description: 'Marco Nigro ha ricevuto tutte le informazioni e la foto della tua pianta'
          });
        }

      } catch (error) {
        console.error('❌ Error sending automatic consultation data:', error);
        toast.error('Errore nell\'invio automatico dei dati');
      }
    };

    // Delay to ensure conversation is fully loaded
    const timer = setTimeout(sendInitialData, 2000);
    return () => clearTimeout(timer);
  }, [activeChat, currentConversationId, plantInfo?.infoComplete, plantInfo?.uploadedImageUrl, userProfile, messages.length]);

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
        conversationId={currentConversationId || undefined}
        senderId={userId}
        recipientId="07c7fe19-33c3-4782-b9a0-4e87c8aa7044" // Marco Nigro ID
      />
    </div>
  );
};
