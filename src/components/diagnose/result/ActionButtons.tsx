
import { Button } from "@/components/ui/button";
import { ArrowRight, Save, AlertCircle, MessageCircle, Loader2, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { AuthRequiredDialog } from "@/components/auth/AuthRequiredDialog";
import { supabase } from "@/integrations/supabase/client";
import { EXPERT } from '@/components/chat/types';
import { MARCO_NIGRO_ID } from '@/components/phytopathologist';
import { toast } from "sonner";

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
  const navigate = useNavigate();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  
  const isAuthenticated = !!user;
  
  const startChatWithExpert = async () => {
    if (!isAuthenticated) {
      setShowAuthDialog(true);
      return;
    }

    try {
      console.log("Starting chat with expert, diagnosisData:", diagnosisData);
      
      // Prepare diagnosis data for the expert
      const plantType = diagnosisData?.plantType || diagnosisData?.plantInfo?.name || 'Non specificato';
      const symptoms = diagnosisData?.symptoms || diagnosisData?.plantInfo?.symptoms || 'Non specificati';
      const imageUrl = diagnosisData?.imageUrl || null;
      
      console.log("Prepared data - plantType:", plantType, "symptoms:", symptoms, "imageUrl:", imageUrl);
      
      // Create the conversation
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
        console.error("Error creating conversation:", convError);
        throw convError;
      }

      console.log("Conversation created:", conversation);

      // Create initial message with diagnosis data
      const initialMessage = `🌱 **Nuova richiesta di consulenza**

**Tipo di pianta:** ${plantType}
**Sintomi osservati:** ${symptoms}

${imageUrl ? '📸 **Immagine allegata**' : ''}

Ciao Marco, ho bisogno del tuo aiuto per questa pianta. Puoi darmi una diagnosi professionale?`;

      console.log("Initial message:", initialMessage);

      // Insert the initial message
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          sender_id: user.id,
          recipient_id: MARCO_NIGRO_ID,
          text: initialMessage
        });

      if (messageError) {
        console.error("Error sending message:", messageError);
        throw messageError;
      }

      // If there's an image, send it as a separate message
      if (imageUrl) {
        console.log("Sending image message:", imageUrl);
        const { error: imageMessageError } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversation.id,
            sender_id: user.id,
            recipient_id: MARCO_NIGRO_ID,
            text: imageUrl
          });

        if (imageMessageError) {
          console.error("Error sending image message:", imageMessageError);
          // Non blocchiamo per l'immagine, continuiamo
        }
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
    if (onChatWithExpert) {
      onChatWithExpert();
    } else {
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
              <span>Salva questa diagnosi</span>
            </>
          )}
        </Button>
      )}

      <Button
        className="w-full bg-drplant-blue-dark hover:bg-drplant-blue-darker flex items-center justify-center gap-2"
        onClick={handleChatWithExpert}
      >
        <MessageCircle className="h-4 w-4" />
        <span>Chat con il fitopatologo</span>
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
    </div>
  );
};

export default ActionButtons;
