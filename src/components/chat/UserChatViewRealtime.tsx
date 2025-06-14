
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

  // Stato per evitare invii multipli durante lo stesso primo caricamento
  const [autoDataSent, setAutoDataSent] = React.useState(false);

  // Nuova logica: invio dati e immagine appena pronto e non già inviato (immediatamente dopo ogni caricamento chat/messaggi)
  useEffect(() => {
    const sendInitialData = async () => {
      if (
        !activeChat ||
        activeChat !== 'expert' ||
        !currentConversationId ||
        !plantInfo?.infoComplete ||
        !userProfile ||
        autoDataSent
      ) {
        return;
      }

      try {
        console.log('[AUTO-DATA ✉️] Controllo invio dati automatico...');
        // Verifica se già presenti tra i messaggi
        const alreadySent = await ConsultationDataService.isConsultationDataSent(currentConversationId);

        if (alreadySent) {
          console.log('[AUTO-DATA ✅] Dati già inviati, nessuna azione necessaria');
          setAutoDataSent(true);
          return;
        }

        // Prepara i dati pianta e utente
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

        const userData = {
          firstName: userProfile.first_name || '',
          lastName: userProfile.last_name || '',
          email: userProfile.email || '',
          birthDate: userProfile.birth_date || 'Non specificata',
          birthPlace: userProfile.birth_place || 'Non specificato'
        };

        console.log('[AUTO-DATA 📤] Invio Dati:', { ...plantData, hasImage: !!plantData.imageUrl });

        // Invia dati
        const success = await ConsultationDataService.sendInitialConsultationData(
          currentConversationId,
          plantData,
          userData,
          plantInfo.useAI || false
        );

        setAutoDataSent(true);

        if (success) {
          toast.success('Dati e foto inviati automaticamente all\'esperto!', {
            description: 'Marco Nigro ha ricevuto tutte le informazioni e la foto della tua pianta'
          });
        } else {
          toast.warning('Attenzione: dati automatici non inviati, riprova tra poco.');
        }

      } catch (error) {
        setAutoDataSent(false);
        console.error('[AUTO-DATA ❌]', error);
        toast.error('Errore nell\'invio automatico dei dati');
      }
    };

    // Se c'è una foto da inviare, l'invio è prioritario
    if (
      activeChat === 'expert' &&
      currentConversationId &&
      plantInfo?.infoComplete &&
      userProfile
    ) {
      // Piccolo delay per sicurezza UX
      const timer = setTimeout(sendInitialData, 1200);
      return () => clearTimeout(timer);
    }
  }, [
    activeChat,
    currentConversationId,
    plantInfo?.infoComplete,
    plantInfo?.uploadedImageUrl,
    userProfile,
    messages.length,
    autoDataSent
  ]);

  const handleStartChat = () => {
    setAutoDataSent(false); // reset lo stato invio automatico quando si riavvia la chat!
    startChatWithExpert();
  };

  const handleBackClick = () => {
    setAutoDataSent(false);
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
        recipientId="07c7fe19-33c3-4782-b9a0-4e87c8aa7044"
      />
    </div>
  );
};
