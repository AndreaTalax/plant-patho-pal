
import { Button } from "@/components/ui/button";
import { ArrowRight, Save, AlertCircle, MessageCircle, Loader2, RefreshCw, Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { AuthRequiredDialog } from "@/components/auth/AuthRequiredDialog";
import { supabase } from "@/integrations/supabase/client";
// import { EXPERT } from '@/components/chat/types'; // Rimosso: usiamo sempre MARCO_NIGRO_ID per coerenza backend
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
  const { user } = useAuth();
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

    if (!hasExpertChatAccess) {
      setShowPaywallModal(true);
      return;
    }

    try {
      console.log("🚀 Starting chat with expert, diagnosisData:", diagnosisData);
      
      // Ottieni la sessione per autorizzare l'edge function
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Sessione non valida, esegui di nuovo l’accesso');
        return;
      }
      
      const plantType = diagnosisData?.plantType || diagnosisData?.plantInfo?.name || 'Non specificato';
      const symptoms = diagnosisData?.symptoms || diagnosisData?.plantInfo?.symptoms || 'Non specificati';
      const imageUrl = diagnosisData?.imageUrl || null;
      
      console.log("📋 Prepared data - plantType:", plantType, "symptoms:", symptoms, "imageUrl:", imageUrl);
      
      // Crea/avvia conversazione con l'esperto
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          user_id: user.id,
          expert_id: MARCO_NIGRO_ID, // Usa sempre l’ID esperto coerente col backend
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

      // Messaggio iniziale
      let initialMessage = `🌱 **Nuova richiesta di consulenza**\n\n**Tipo di pianta:** ${plantType}\n**Sintomi osservati:** ${symptoms}`;

      // Allego anche il risultato AI, se disponibile
      if (diagnosisData?.diagnosisResult) {
        initialMessage += `\n\n🤖 **Analisi AI precedente (riassunto):**\n${typeof diagnosisData.diagnosisResult === 'string' 
          ? diagnosisData.diagnosisResult 
          : '```json\n' + JSON.stringify(diagnosisData.diagnosisResult, null, 2) + '\n```'}`;
      }

      initialMessage += `\n\n${imageUrl ? '📸 **Immagine allegata**\n\n' : ''}Ciao Marco, ho bisogno del tuo aiuto per questa pianta. Puoi darmi una diagnosi professionale?`;

      console.log("📝 Initial message:", initialMessage);

      // Invia messaggio via Edge Function "send-message" (con token)
      const { data: sendMsgData, error: sendMsgError } = await supabase.functions.invoke('send-message', {
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
        console.error("❌ Error sending initial message via edge function:", sendMsgError);
        throw sendMsgError;
      }

      // Se c’è un’immagine, inviala come messaggio separato (sempre via edge function)
      if (imageUrl) {
        console.log("📸 Sending image message via edge function:", imageUrl);
        const { error: imageMessageError } = await supabase.functions.invoke('send-message', {
          body: {
            conversationId: conversation.id,
            recipientId: MARCO_NIGRO_ID,
            text: '📸 Immagine della pianta',
            imageUrl,
            products: null
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (imageMessageError) {
          console.error("⚠️ Error sending image message:", imageMessageError);
          // Non blocchiamo per l'immagine, continuiamo
        }
      }

      // Vai alla chat
      navigate('/');
      setTimeout(() => {
        const event = new CustomEvent('switchTab', { detail: 'chat' });
        window.dispatchEvent(event);
      }, 100);
      
      toast.success('✅ Chat avviata con il fitopatologo!', {
        description: 'Dati e analisi AI inviati automaticamente',
        duration: 4000
      });

    } catch (error: any) {
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
