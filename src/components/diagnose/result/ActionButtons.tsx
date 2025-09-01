
import { Button } from "@/components/ui/button";
import { ArrowRight, Save, AlertCircle, MessageCircle, Loader2, RefreshCw, Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { AuthRequiredDialog } from "@/components/auth/AuthRequiredDialog";
import { supabase } from "@/integrations/supabase/client";
import { EXPERT } from '@/components/chat/types';
import { MARCO_NIGRO_ID } from '@/components/phytopathologist';
import { toast } from "sonner";
import { usePremiumStatus } from "@/services/premiumService";
import { PremiumPaywallModal } from "../PremiumPaywallModal";

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
  
  const isAuthenticated = !!user;
  
  const startChatWithExpert = async () => {
    if (!isAuthenticated) {
      setShowAuthDialog(true);
      return;
    }

    // Controlla se l'utente ha accesso premium
    if (!hasExpertChatAccess) {
      setShowPaywallModal(true);
      return;
    }

    try {
      console.log("🚀 Starting chat with expert, diagnosisData:", diagnosisData);
      
      // Prepare diagnosis data for the expert
      const plantType = diagnosisData?.plantType || diagnosisData?.plantInfo?.name || 'Non specificato';
      const symptoms = diagnosisData?.symptoms || diagnosisData?.plantInfo?.symptoms || 'Non specificati';
      const imageUrl = diagnosisData?.imageUrl || null;
      
      console.log("📋 Prepared data - plantType:", plantType, "symptoms:", symptoms, "imageUrl:", imageUrl);
      
      // Create the conversation first
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          user_id: user.id,
          expert_id: EXPERT.id,
          title: `Consulenza per ${plantType}`,
          status: 'active'
        })
        .select()
        .single();

      if (convError) {
        console.error("❌ Error creating conversation:", convError);
        throw convError;
      }

      console.log("✅ Conversation created:", conversation);

      // Create initial message with diagnosis data including AI analysis
      let initialMessage = `🌱 **Nuova richiesta di consulenza**

**Tipo di pianta:** ${plantType}
**Sintomi osservati:** ${symptoms}`;

      // Add AI diagnosis data if available
      if (diagnosisData?.diagnosisResult && useAI) {
        initialMessage += `\n\n🤖 **Analisi AI precedente:**
${JSON.stringify(diagnosisData.diagnosisResult, null, 2)}`;
      }

      initialMessage += `\n\n${imageUrl ? '📸 **Immagine allegata**\n\n' : ''}Ciao Marco, ho bisogno del tuo aiuto per questa pianta. Puoi darmi una diagnosi professionale?`;

      console.log("📝 Initial message:", initialMessage);

      // Insert the initial message
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          sender_id: user.id,
          recipient_id: MARCO_NIGRO_ID,
          content: initialMessage,
          text: initialMessage,
          metadata: {
            plantType: plantType,
            symptoms: symptoms,
            aiAnalysis: diagnosisData?.diagnosisResult || null,
            autoSent: true
          }
        });

      if (messageError) {
        console.error("❌ Error sending message:", messageError);
        throw messageError;
      }

      // If there's an image, send it as a separate message
      if (imageUrl) {
        console.log("📸 Sending image message:", imageUrl);
        const { error: imageMessageError } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversation.id,
            sender_id: user.id,
            recipient_id: MARCO_NIGRO_ID,
            content: imageUrl,
            text: 'Immagine della pianta',
            metadata: {
              isImage: true,
              autoSent: true
            }
          });

        if (imageMessageError) {
          console.error("⚠️ Error sending image message:", imageMessageError);
          // Non blocchiamo per l'immagine, continuiamo
        }
      }

      // Navigate to chat
      navigate('/');
      setTimeout(() => {
        const event = new CustomEvent('switchTab', { detail: 'chat' });
        window.dispatchEvent(event);
      }, 100);
      
      toast.success('✅ Chat avviata con il fitopatologo!', {
        description: 'Dati e analisi AI inviati automaticamente',
        duration: 4000
      });

    } catch (error) {
      console.error("❌ Errore nell'avvio della chat:", error);
      toast.error("❌ Errore nell'avvio della chat", {
        description: error.message || 'Riprova più tardi',
        duration: 4000
      });
    }
  };
  
  const handleChatWithExpert = () => {
    if (onChatWithExpert) {
      onChatWithExpert();
    } else {
      startChatWithExpert();
    }
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
      console.log("💾 Tentativo di salvataggio diagnosi...");
      await onSaveDiagnosis();
      console.log("✅ Diagnosi salvata con successo");
    } catch (error) {
      console.error("❌ Errore nel salvataggio:", error);
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
      >
        {!hasExpertChatAccess && <Crown className="h-4 w-4" />}
        <MessageCircle className="h-4 w-4" />
        <span>{hasExpertChatAccess ? 'Chat con il fitopatologo' : 'Chat Premium con Esperto'}</span>
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
