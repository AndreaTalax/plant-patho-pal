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

  // Stato per evitare invii multipli durante lo stesso primo caricamento
  const [autoDataSent, setAutoDataSent] = React.useState(false);

  // Dismiss tutti i toast quando si monta la chat per evitare freeze
  useEffect(() => {
    dismiss();
    setPopupDismissed(true);
  }, []); // Solo al mount

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
          firstName: userProfile.first_name || userProfile.firstName || "",
          lastName: userProfile.last_name || userProfile.lastName || "",
          email: userProfile.email || userProfile.mail || "",
          birthDate: userProfile.birth_date || userProfile.birthDate || "",
          birthPlace: userProfile.birth_place || userProfile.birthPlace || ""
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
          toast({
            title: 'Dati e foto inviati automaticamente all\'esperto!',
            description: 'Marco Nigro ha ricevuto tutte le informazioni e la foto della tua pianta',
            duration: 4000
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

  // funzione helper per mostrare i dati utente + pianta nel messaggio automatico
  function renderSummaryMessage() {
    if (!(plantInfo?.infoComplete && userProfile)) return null;
    // Sfrutta entrambi gli alias per robustezza test/admin
    const firstName = userProfile.first_name || userProfile.firstName || "";
    const lastName = userProfile.last_name || userProfile.lastName || "";
    const email = userProfile.email || userProfile.mail || "";
    const birthDate = userProfile.birth_date || userProfile.birthDate || "";
    const birthPlace = userProfile.birth_place || userProfile.birthPlace || "";

    return (
      <div className="bg-blue-100 rounded-lg p-3 my-2 text-sm font-mono">
        <div className="mb-2 font-bold text-blue-900">**Dati della pianta inviati automaticamente**</div>
        <div>
          <span className="inline-flex gap-1 items-center mr-2"><span role="img" aria-label="nome">🌱</span> <b>Nome pianta:</b> {plantInfo.name || "Non identificata"}</span><br/>
          <span className="inline-flex gap-1 items-center mr-2"><span role="img" aria-label="ambiente">🏠</span> <b>Ambiente:</b> {plantInfo.isIndoor ? "Interno" : "Esterno"}</span><br/>
          <span className="inline-flex gap-1 items-center mr-2"><span role="img" aria-label="luce">☀️</span> <b>Luce:</b> {plantInfo.lightExposure ?? "Non specificata"}</span><br/>
          <span className="inline-flex gap-1 items-center mr-2"><span role="img" aria-label="acqua">💧</span> <b>Irrigazione:</b> {plantInfo.wateringFrequency ?? "Non specificata"}</span><br/>
          <span className="inline-flex gap-1 items-center mr-2"><span role="img" aria-label="sintomi">🦠</span> <b>Sintomi:</b> {plantInfo.symptoms ?? "Non specificato"}</span>
          {plantInfo.uploadedImageUrl && (
            <div className="mt-1">
              <span className="block font-bold">📸 Foto allegata</span>
              <img src={plantInfo.uploadedImageUrl} alt="Immagine pianta" className="rounded border max-w-xs mt-1" />
            </div>
          )}
        </div>
        <div className="mt-3 font-medium text-blue-800 border-t pt-2">
          <span className="block mb-1">**I tuoi dati personali:**</span>
          <span className="inline-flex gap-1 items-center mr-2"><span role="img" aria-label="nome">👤</span> <b>Nome:</b> {firstName} {lastName}</span><br/>
          <span className="inline-flex gap-1 items-center mr-2"><span role="img" aria-label="email">✉️</span> <b>Email:</b> {email}</span><br/>
          {birthDate && (
            <span className="inline-flex gap-1 items-center mr-2"><span role="img" aria-label="nascita">🎂</span> <b>Data di nascita:</b> {birthDate}</span>
          )}
          {birthPlace && (
            <span className="inline-flex gap-1 items-center mr-2"><span role="img" aria-label="luogonascita">📍</span> <b>Luogo di nascita:</b> {birthPlace}</span>
          )}
        </div>
      </div>
    );
  }

  // ERRORE DI CONVERSAZIONE (502)
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

  // --- DEBUG: Log di diagnostica per problemi chat
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
      {/* Mostra sempre la sintesi dati pianta + persona all'inizio se info completata */}
      {renderSummaryMessage()}
      <MessageList messages={messages} />

      {/* AVVISO ERRORE sopra la chat, MA input SEMPRE visibile/interattivo */}
      {(!!connectionError || !currentConversationId) && (
        <div className="absolute left-0 right-0 top-20 flex items-center justify-center z-30 rounded-b-2xl pointer-events-none">
          <span className="text-red-700 text-base font-semibold text-center px-4 bg-white/90 shadow border rounded-lg">
            {connectionError || "Chat non disponibile. Problema di connessione o server."}
          </span>
        </div>
      )}

      {/* L’input è SEMPRE attivo se l’utente è autenticato */}
      <div className="relative">
        <MessageInput 
          onSendMessage={handleSendMessage}
          isSending={isSending}
          conversationId={currentConversationId || ""}
          senderId={userId}
          recipientId="07c7fe19-33c3-4782-b9a0-4e87c8aa7044"
          disabledInput={false} // <-- Sempre abilitato
        />
      </div>
      {(!!connectionError) && (
        <div className="p-4 text-center text-red-500 font-medium">
          {connectionError}
        </div>
      )}
    </div>
  );
};
