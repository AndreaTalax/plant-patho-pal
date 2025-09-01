
import { Button } from "@/components/ui/button";
import { ArrowRight, Save, AlertCircle, MessageCircle, Loader2, RefreshCw, Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { AuthRequiredDialog } from "@/components/auth/AuthRequiredDialog";
import { supabase } from "@/integrations/supabase/client";
import { MARCO_NIGRO_ID } from '@/components/phytopathologist';
import { toast } from "sonner";
import { usePremiumStatus } from "@/services/premiumService";
import { PremiumPaywallModal } from "../PremiumPaywallModal";
import { ConsultationDataService } from '@/services/chat/consultationDataService';
import { usePlantInfo } from "@/context/PlantInfoContext"; // NEW

interface ActionButtonsProps {
  onStartNewAnalysis: () => void;
  onSaveDiagnosis?: () => void;
  onChatWithExpert?: () => void;
  saveLoading?: boolean;
  hasValidAnalysis: boolean;
  useAI?: boolean;
  diagnosisData?: {
    plantType?: string;
    plantVariety?: string;
    symptoms?: string;
    imageUrl?: string;
    diagnosisResult?: any;
    plantInfo?: any;
  };
}

const ActionButtons = ({ 
  onStartNewAnalysis, 
  onSaveDiagnosis, 
  onChatWithExpert, 
  saveLoading = false,
  hasValidAnalysis,
  useAI = false,
  diagnosisData
}: ActionButtonsProps) => {
  const { user, userProfile } = useAuth();
  const { hasExpertChatAccess } = usePremiumStatus();
  const navigate = useNavigate();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [showPaywallModal, setShowPaywallModal] = useState(false);
  const [isSendingToChat, setIsSendingToChat] = useState(false);
  const { plantInfo } = usePlantInfo(); // NEW
  
  const isAuthenticated = !!user;

  // Funzione migliorata per il redirect alla chat
  const redirectToChat = () => {
    console.log('🎯 Redirecting to chat tab (enhanced)...');
    
    // Persistenza
    try {
      localStorage.setItem('activeTab', 'chat');
      localStorage.setItem('forceTabSwitch', 'chat');
      localStorage.setItem('openExpertChat', 'true');
    } catch (e) {
      console.warn('LocalStorage not available:', e);
    }

    // Aggiorna hash per eventuale listener
    try {
      window.location.hash = 'chat';
    } catch (e) {
      console.warn('Cannot set location hash:', e);
    }

    // Naviga alla home (container tab) e passa stato
    navigate('/', { 
      state: { 
        activeTab: 'chat',
        openExpertChat: true,
        timestamp: Date.now()
      } 
    });

    // Eventi broadcast
    const switchEvent = new CustomEvent('switchTab', { detail: 'chat' });
    window.dispatchEvent(switchEvent);
    document.dispatchEvent(switchEvent as any);
    window.postMessage({ type: 'SWITCH_TAB', tab: 'chat' }, '*');

    // Tentativi ritardati + click diretto su bottone "Chat" se presente
    const attemptClick = () => {
      try {
        const byDataAttr = document.querySelector('[data-tab="chat"]') as HTMLElement | null;
        if (byDataAttr) byDataAttr.click();

        const buttons = Array.from(document.querySelectorAll('button, a')) as HTMLElement[];
        const chatBtn = buttons.find(el => (el.textContent || '').trim().toLowerCase() === 'chat');
        if (chatBtn) chatBtn.click();
      } catch (e) {
        console.warn('Fallback click failed:', e);
      }
    };

    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('switchTab', { detail: 'chat' }));
      window.postMessage({ type: 'SWITCH_TAB', tab: 'chat' }, '*');
      attemptClick();
    }, 100);

    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('switchTab', { detail: 'chat' }));
      window.postMessage({ type: 'SWITCH_TAB', tab: 'chat' }, '*');
      attemptClick();
    }, 500);

    console.log('✅ Chat redirect executed with enhanced methods');
  };
  
  const startChatWithExpert = async () => {
    if (!isAuthenticated) {
      setShowAuthDialog(true);
      return;
    }

    if (!hasExpertChatAccess) {
      setShowPaywallModal(true);
      return;
    }

    setIsSendingToChat(true);

    try {
      console.log("🚀 Starting comprehensive chat with expert...");
      console.log("📋 Diagnosis data:", diagnosisData);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Sessione non valida, esegui di nuovo l\'accesso');
        return;
      }
      
      // Prepara dati completi per l'invio
      const fallbackPlantType = plantInfo?.name || 'Pianta da identificare'; // NEW
      const plantType = diagnosisData?.plantType || diagnosisData?.plantInfo?.name || fallbackPlantType;
      const symptoms = diagnosisData?.symptoms || diagnosisData?.plantInfo?.symptoms || plantInfo?.symptoms || 'Sintomi da descrivere';

      // NEW: prendiamo la foto dal contesto se non fornita in diagnosisData
      const imageUrl = diagnosisData?.imageUrl 
        || diagnosisData?.plantInfo?.imageUrl 
        || plantInfo?.uploadedImageUrl 
        || null;

      const diagnosisResult = diagnosisData?.diagnosisResult || null;
      
      console.log("📊 Prepared data:", { plantType, symptoms, imageUrl: !!imageUrl, diagnosisResult: !!diagnosisResult });
      
      // Crea/trova conversazione con l'esperto
      const { data: existingConversation } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .eq('expert_id', MARCO_NIGRO_ID)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);

      let conversation = existingConversation?.[0];

      if (!conversation) {
        const { data: newConversation, error: convError } = await supabase
          .from('conversations')
          .insert({
            user_id: user.id,
            expert_id: MARCO_NIGRO_ID,
            title: `Consulenza per ${plantType}`,
            status: 'active'
          })
          .select()
          .single();

        if (convError) {
          console.error("❌ Error creating conversation:", convError);
          throw convError;
        }
        conversation = newConversation;
      }

      console.log("✅ Conversation ready:", conversation.id);

      // Prepara messaggio iniziale dell'utente
      let initialMessage = `🌱 **Nuova richiesta di consulenza**\n\n`;
      initialMessage += `**Tipo di pianta:** ${plantType}\n`;
      initialMessage += `**Sintomi:** ${symptoms}\n`;
      
      if (diagnosisResult) {
        initialMessage += `\n🤖 **Analisi AI:**\n`;
        initialMessage += typeof diagnosisResult === 'string' 
          ? diagnosisResult 
          : '```json\n' + JSON.stringify(diagnosisResult, null, 2) + '\n```';
      }
      
      initialMessage += `\n\nCiao Marco, ho bisogno del tuo aiuto per questa pianta. Puoi darmi una diagnosi professionale?`;

      // Invia messaggio iniziale
      const { error: sendMsgError } = await supabase.functions.invoke('send-message', {
        body: {
          conversationId: conversation.id,
          recipientId: MARCO_NIGRO_ID,
          text: initialMessage,
          imageUrl: null,
          products: null
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (sendMsgError) {
        console.error("❌ Error sending initial message:", sendMsgError);
      } else {
        console.log("✅ Initial message sent");
      }

      // Invia immagine separatamente se presente (usa anche il fallback dal contesto)
      if (imageUrl) {
        console.log("📸 Sending image to expert...");
        const { error: imageError } = await supabase.functions.invoke('send-message', {
          body: {
            conversationId: conversation.id,
            recipientId: MARCO_NIGRO_ID,
            text: '📸 Immagine della pianta per la consultazione',
            imageUrl: imageUrl,
            products: null
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (imageError) {
          console.error("⚠️ Error sending image:", imageError);
        } else {
          console.log("✅ Image sent successfully");
        }
      }

      // Invia dati completi tramite il servizio automatico
      const plantData = {
        symptoms: symptoms,
        wateringFrequency: diagnosisData?.plantInfo?.wateringFrequency || plantInfo?.wateringFrequency || 'Da specificare',
        sunExposure: diagnosisData?.plantInfo?.lightExposure || plantInfo?.lightExposure || 'Da specificare',
        environment: (diagnosisData?.plantInfo?.isIndoor ?? plantInfo?.isIndoor) !== undefined
          ? ((diagnosisData?.plantInfo?.isIndoor ?? plantInfo?.isIndoor) ? 'Interno' : 'Esterno')
          : 'Da specificare',
        plantName: plantType,
        imageUrl: imageUrl,
        aiDiagnosis: diagnosisResult,
        useAI: !!useAI,
        sendToExpert: true
      };

      const userData = {
        firstName: userProfile?.first_name || userProfile?.firstName || 'Non specificato',
        lastName: userProfile?.last_name || userProfile?.lastName || 'Non specificato',
        email: userProfile?.email || 'Non specificato',
        birthDate: userProfile?.birth_date || userProfile?.birthDate || 'Non specificata',
        birthPlace: userProfile?.birth_place || userProfile?.birthPlace || 'Non specificato'
      };

      console.log("📤 Sending comprehensive consultation data...");
      
      const dataSent = await ConsultationDataService.sendInitialConsultationData(
        conversation.id,
        plantData,
        userData,
        !!useAI
      );

      if (!dataSent) {
        console.warn("⚠️ Automatic data send partially failed");
        toast.warning('Chat avviata', { 
          description: 'Messaggi inviati, ma alcuni dati potrebbero non essere stati trasmessi completamente.'
        });
      } else {
        console.log("✅ All data sent successfully");
        toast.success('✅ Chat avviata con successo!', {
          description: 'Foto, diagnosi e dati inviati automaticamente a Marco Nigro',
          duration: 4000
        });
      }

      // Redirect affidabile alla chat
      console.log("🎯 Executing chat redirect (enhanced)...");
      redirectToChat();

    } catch (error: any) {
      console.error("❌ Error in chat setup:", error);
      toast.error("❌ Errore nell'avvio della chat", {
        description: error?.message || 'Riprova più tardi',
        duration: 4000
      });
    } finally {
      setIsSendingToChat(false);
    }
  };
  
  const handleChatWithExpert = async () => {
    console.log("🎯 handleChatWithExpert called");
    
    // Esegui sempre l'handler personalizzato se presente
    try {
      if (onChatWithExpert) {
        console.log("🔄 Executing custom onChatWithExpert handler...");
        await Promise.resolve(onChatWithExpert());
      }
    } catch (e) {
      console.warn('⚠️ Custom handler error:', e);
    }
    
    // Esegui sempre il nostro flusso principale
    await startChatWithExpert();
  };

  const handleSaveDiagnosis = async () => {
    if (!onSaveDiagnosis) {
      console.log("❌ onSaveDiagnosis handler not provided");
      toast.error("Funzione di salvataggio non disponibile");
      return;
    }

    if (!user) {
      setShowAuthDialog(true);
      return;
    }

    try {
      console.log("💾 Attempting to save diagnosis...");
      await onSaveDiagnosis();
      console.log("✅ Diagnosis saved successfully");
    } catch (error) {
      console.error("❌ Error saving diagnosis:", error);
      toast.error("❌ Errore nel salvare la diagnosi");
    }
  };

  return (
    <div className="space-y-3 pt-2">
      {useAI && hasValidAnalysis && onSaveDiagnosis && (
        <Button 
          onClick={handleSaveDiagnosis}
          className="w-full bg-drplant-blue hover:bg-drplant-blue-dark flex items-center justify-center gap-2"
          disabled={saveLoading}
        >
          {saveLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Salvando...</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>Salva questa diagnosi</span>
            </>
          )}
        </Button>
      )}

      <Button
        className={`w-full flex items-center justify-center gap-2 ${
          hasExpertChatAccess 
            ? 'bg-drplant-blue-dark hover:bg-drplant-blue-darker' 
            : 'border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800'
        }`}
        variant={hasExpertChatAccess ? 'default' : 'outline'}
        onClick={handleChatWithExpert}
        disabled={isSendingToChat}
      >
        {isSendingToChat ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Invio in corso...</span>
          </>
        ) : (
          <>
            {!hasExpertChatAccess && <Crown className="h-4 w-4" />}
            <MessageCircle className="h-4 w-4" />
            <span>
              {hasExpertChatAccess 
                ? 'Vai alla Chat' 
                : 'Chat Premium con Esperto'
              }
            </span>
          </>
        )}
      </Button>
      
      <Button 
        onClick={onStartNewAnalysis} 
        variant="outline"
        className="w-full flex items-center justify-center gap-2"
      >
        <RefreshCw className="h-4 w-4" />
        <span>Inizia nuova analisi</span>
      </Button>
      
      {useAI && (
        <div className="flex items-center justify-center pt-4 pb-2">
          <div className="px-4 py-2 bg-amber-50 rounded-full border border-amber-200 text-xs text-amber-700 flex items-center">
            <AlertCircle className="h-3.5 w-3.5 text-amber-500 mr-1.5" />
            <span>Per una diagnosi definitiva, consulta sempre un esperto</span>
          </div>
        </div>
      )}
      
      <AuthRequiredDialog 
        isOpen={showAuthDialog}
        onClose={() => setShowAuthDialog(false)}
        title="Devi accedere per contattare il fitopatologo"
        description="Per visualizzare le conversazioni con il fitopatologo devi prima accedere."
      />

      <PremiumPaywallModal
        open={showPaywallModal}
        onClose={() => setShowPaywallModal(false)}
      />
    </div>
  );
};

export default ActionButtons;

