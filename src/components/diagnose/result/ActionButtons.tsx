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
  onPayAndSendDiagnosis?: () => void; // Nuova funzione per pagamento e invio
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
  onPayAndSendDiagnosis, 
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
    console.log("🔍 DEBUG: startChatWithExpert called", {
      isAuthenticated,
      hasExpertChatAccess,
      diagnosisData,
      userProfile
    });

    if (!isAuthenticated) {
      console.log("❌ User not authenticated");
      setShowAuthDialog(true);
      return;
    }

    // Controlla se l'utente ha accesso premium
    if (!hasExpertChatAccess) {
      console.log("❌ User does not have expert chat access - showing paywall");
      setShowPaywallModal(true);
      return;
    }

    try {
      console.log("🚀 TRIGGER PDF AUTOMATICO - Starting chat with expert, diagnosisData:", diagnosisData);
      
      // Create the conversation
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          user_id: user.id,
          expert_id: MARCO_NIGRO_ID,
          title: `Consulenza Fitopatologo`,
          status: 'active'
        })
        .select()
        .single();

      if (convError) {
        console.error("Error creating conversation:", convError);
        throw convError;
      }

      console.log("✅ Conversazione creata:", conversation.id);

      // Trigger automatic PDF generation and sending
      if (diagnosisData && userProfile) {
        console.log("📄 GENERAZIONE PDF AUTOMATICA in corso...");
        
        // Prepare comprehensive plant data
        const plantData = {
          plantName: diagnosisData.plantType || diagnosisData.plantInfo?.name || 'Pianta non identificata',
          symptoms: diagnosisData.symptoms || diagnosisData.plantInfo?.symptoms || 'Sintomi non specificati',
          environment: diagnosisData.plantInfo?.environment || 'Non specificato',
          wateringFrequency: diagnosisData.plantInfo?.wateringFrequency || 'Non specificata',
          sunExposure: diagnosisData.plantInfo?.sunExposure || 'Non specificata',
          imageUrl: diagnosisData.imageUrl,
          diagnosisResult: diagnosisData.diagnosisResult,
          useAI: useAI
        };

        // Prepare user profile data
        const userData = {
          firstName: userProfile.first_name || '',
          lastName: userProfile.last_name || '',
          email: userProfile.email || user.email,
          birthDate: userProfile.birth_date || 'Non specificata',
          birthPlace: userProfile.birth_place || 'Non specificato'
        };

        console.log("📊 Dati per PDF:", { plantData, userData });

        // Send PDF automatically using the consultation service
        const { ConsultationDataService } = await import('@/services/chat/consultationDataService');
        const success = await ConsultationDataService.sendInitialConsultationData(
          conversation.id,
          plantData,
          userData,
          useAI,
          diagnosisData.diagnosisResult
        );

        if (success) {
          console.log("✅ PDF INVIATO AUTOMATICAMENTE!");
          toast.success('PDF con tutti i dati inviato automaticamente al fitopatologo!');
        } else {
          console.error("❌ Errore invio PDF automatico");
          toast.error('Errore nell\'invio automatico del PDF');
        }
      } else {
        console.error("❌ Dati insufficienti per PDF automatico");
      }

      // Navigate to chat
      navigate('/');
      setTimeout(() => {
        const event = new CustomEvent('switchTab', { detail: 'chat' });
        window.dispatchEvent(event);
      }, 100);
      
      toast.success('Chat avviata con il fitopatologo!');

    } catch (error) {
      console.error("Errore nell'avvio della chat:", error);
      toast.error("Errore nell'avvio della chat");
    }
  };
  
  const handleChatWithExpert = () => {
    console.log("🔥 BUTTON CLICKED: handleChatWithExpert called");
    console.log("🎯 handleChatWithExpert called", { onChatWithExpert: !!onChatWithExpert });
    if (onChatWithExpert) {
      console.log("📞 Calling onChatWithExpert prop");
      onChatWithExpert();
    } else {
      console.log("🚀 Calling startChatWithExpert directly");
      startChatWithExpert();
    }
  };

  return (
    <div className="space-y-3 pt-2">
      {useAI && hasValidAnalysis && onSaveDiagnosis && (
        <Button 
          onClick={onSaveDiagnosis}
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
              <span>Salva diagnosi nel profilo</span>
            </>
          )}
        </Button>
      )}

      {/* Pulsante per pagare e inviare diagnosi AI (per utenti non premium) */}
      {!hasExpertChatAccess && useAI && hasValidAnalysis && onPayAndSendDiagnosis && (
        <Button
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white"
          onClick={onPayAndSendDiagnosis}
        >
          <Crown className="h-4 w-4" />
          <MessageCircle className="h-4 w-4" />
          <span>Paga e Invia Diagnosi AI all'Esperto (€9.99/mese)</span>
        </Button>
      )}

      {/* Pulsante chat normale per utenti premium */}
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
        <span>
          {hasExpertChatAccess 
            ? 'Chat con il fitopatologo' 
            : (useAI && hasValidAnalysis ? 'Chat Manuale con Esperto' : 'Chat Premium con Esperto')
          }
        </span>
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
