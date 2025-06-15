import React, { useEffect } from 'react';
import { useUserChatRealtime } from './user/useUserChatRealtime';
import { usePlantInfo } from '@/context/PlantInfoContext';
import { useAuth } from '@/context/AuthContext';
import { ConsultationDataService } from '@/services/chat/consultationDataService';
import { useToast } from '@/hooks/use-toast';
import ChatHeader from './user/ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import EmptyStateView from './user/EmptyStateView';
import UserPlantSummary from './user/UserPlantSummary';
import ChatConnectionError from './user/ChatConnectionError';

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
  const { toast, dismiss } = useToast();
  const [popupDismissed, setPopupDismissed] = React.useState(false);

  const [autoDataSent, setAutoDataSent] = React.useState(false);

  useEffect(() => {
    dismiss();
    setPopupDismissed(true);
  }, []);

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
        const alreadySent = await ConsultationDataService.isConsultationDataSent(currentConversationId);

        if (alreadySent) {
          console.log('[AUTO-DATA ✅] Dati già inviati, nessuna azione necessaria');
          setAutoDataSent(true);
          return;
        }

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
          firstName: userProfile.first_name || userProfile.firstName || "",
          lastName: userProfile.last_name || userProfile.lastName || "",
          email: userProfile.email || "",
          birthDate: userProfile.birth_date || userProfile.birthDate || "",
          birthPlace: userProfile.birth_place || userProfile.birthPlace || ""
        };

        console.log('[AUTO-DATA 📤] Invio Dati:', { ...plantData, hasImage: !!plantData.imageUrl });

        const success = await ConsultationDataService.sendInitialConsultationData(
          currentConversationId,
          plantData,
          userData,
          plantInfo.useAI || false
        );

        setAutoDataSent(true);

        if (success) {
          toast({
            title: 'Dati e foto inviati automaticamente all\'esperto!',
            description: 'Marco Nigro ha ricevuto tutte le informazioni e la foto della tua pianta',
            duration: 4000,
          });
        } else {
          toast({
            title: 'Attenzione: dati automatici non inviati, riprova tra poco.',
            description: '',
            duration: 4000,
            variant: 'destructive'
          });
        }

      } catch (error) {
        setAutoDataSent(false);
        console.error('[AUTO-DATA ❌]', error);
        toast({
          title: 'Errore nell\'invio automatico dei dati',
          description: '',
          duration: 4000,
          variant: 'destructive'
        });
      }
    };

    if (
      activeChat === 'expert' &&
      currentConversationId &&
      plantInfo?.infoComplete &&
      userProfile
    ) {
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
    setAutoDataSent(false);
    startChatWithExpert();
  };

  const handleBackClick = () => {
    setAutoDataSent(false);
    setActiveChat(null);
  };

  const [connectionError, setConnectionError] = React.useState<string | null>(null);
  useEffect(() => {
    if (!currentConversationId && activeChat === 'expert') {
      const timer = setTimeout(() => {
        setConnectionError("Impossibile connettersi alla chat. Errore di connessione con il server.");
        toast({
          title: "Errore di connessione alla chat",
          description: "Problemi di connessione o server (502). Riprova tra poco.",
          duration: 10000,
          variant: "destructive"
        });
      }, 4000);
      return () => clearTimeout(timer);
    } else {
      setConnectionError(null);
    }
  }, [currentConversationId, activeChat, toast]);

  useEffect(() => {
    console.log("[DEBUG UserChat] userId:", userId);
    console.log("[DEBUG UserChat] activeChat:", activeChat);
    console.log("[DEBUG UserChat] currentConversationId:", currentConversationId);
    console.log("[DEBUG UserChat] isConnected:", isConnected);
    console.log("[DEBUG UserChat] canSend:", !!currentConversationId && !!userId);
  }, [userId, activeChat, currentConversationId, isConnected]);

  if (!activeChat || activeChat !== 'expert') {
    return <EmptyStateView onStartChat={handleStartChat} />;
  }

  return (
    <div className="flex flex-col h-full">
      <ChatHeader 
        onBackClick={handleBackClick}
        isConnected={isConnected}
      />
      <UserPlantSummary />
      <MessageList messages={messages} />

      <ChatConnectionError message={connectionError || (!currentConversationId ? "Chat non disponibile. Problema di connessione o server." : undefined)} />

      <div className="relative">
        <MessageInput 
          onSendMessage={handleSendMessage}
          isSending={isSending}
          conversationId={currentConversationId || ""}
          senderId={userId}
          recipientId="07c7fe19-33c3-4782-b9a0-4e87c8aa7044"
          disabledInput={!userId}
          variant="persistent"
        />
      </div>
      {!!connectionError && (
        <div className="p-4 text-center text-red-500 font-medium">
          {connectionError}
        </div>
      )}
    </div>
  );
};
