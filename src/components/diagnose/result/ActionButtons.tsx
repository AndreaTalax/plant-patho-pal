
import { Button } from "@/components/ui/button";
import { ArrowRight, Save, AlertCircle, MessageCircle, Loader2, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { EXPERT_ID } from "@/integrations/supabase/client";

interface ActionButtonsProps {
  onStartNewAnalysis: () => void;
  onSaveDiagnosis?: () => void;
  onChatWithExpert?: () => void;
  saveLoading?: boolean;
  hasValidAnalysis: boolean;
  useAI?: boolean;
  plantImage?: string;
  plantInfo?: {
    isIndoor: boolean;
    wateringFrequency: number;
    lightExposure: string;
    symptoms?: string;
  };
}

const ActionButtons = ({ 
  onStartNewAnalysis, 
  onSaveDiagnosis, 
  onChatWithExpert, 
  saveLoading = false,
  hasValidAnalysis,
  useAI = false,
  plantImage,
  plantInfo
}: ActionButtonsProps) => {
  const { isAuthenticated, userProfile } = useAuth();
  const navigate = useNavigate();
  const [redirecting, setRedirecting] = useState(false);
  
  const handleChatWithExpert = async () => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    
    setRedirecting(true);
    
    try {
      if (plantImage && plantInfo) {
        // Find or create a conversation with the expert
        const { data: existingConversation, error: convCheckError } = await supabase
          .from('conversations')
          .select('id')
          .eq('user_id', userProfile.id)
          .eq('expert_id', EXPERT_ID)
          .single();
        
        let conversationId = existingConversation?.id;
        
        if (!conversationId) {
          // Create new conversation
          const { data: newConversation, error: convError } = await supabase
            .from('conversations')
            .insert({
              user_id: userProfile.id,
              expert_id: EXPERT_ID,
              status: 'active'
            })
            .select('id')
            .single();
          
          if (convError) {
            console.error("Error creating conversation:", convError);
            return;
          }
          
          conversationId = newConversation.id;
        }
        
        // Create a message with the plant information
        const messageText = `Ho bisogno di aiuto con la mia pianta.
        
Sintomi: ${plantInfo.symptoms || 'Non specificati'}

Dettagli pianta:
- Ambiente: ${plantInfo.isIndoor ? 'Interno' : 'Esterno'}
- Frequenza irrigazione: ${plantInfo.wateringFrequency} volte a settimana
- Esposizione luce: ${plantInfo.lightExposure}`;
        
        if (conversationId) {
          // Send the message with plant details and image
          const { error: msgError } = await supabase
            .from('messages')
            .insert({
              conversation_id: conversationId,
              sender_id: userProfile.id,
              recipient_id: EXPERT_ID,
              text: messageText,
              products: { 
                plantImage: plantImage,
                plantDetails: {
                  isIndoor: plantInfo.isIndoor,
                  wateringFrequency: plantInfo.wateringFrequency,
                  lightExposure: plantInfo.lightExposure,
                  symptoms: plantInfo.symptoms
                },
                userDetails: {
                  firstName: userProfile.firstName,
                  lastName: userProfile.lastName,
                  birthDate: userProfile.birthDate,
                  birthPlace: userProfile.birthPlace
                }
              }
            });
          
          if (msgError) {
            console.error("Error sending message:", msgError);
          }
        }
      }
    } catch (error) {
      console.error("Error preparing chat:", error);
    } finally {
      setRedirecting(false);
      
      // Navigate to home and trigger chat tab change
      navigate('/');
      setTimeout(() => {
        const event = new CustomEvent('switchTab', { detail: 'chat' });
        window.dispatchEvent(event);
      }, 100);
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
        disabled={redirecting}
      >
        {redirecting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Caricamento chat...</span>
          </>
        ) : (
          <>
            <MessageCircle className="h-4 w-4" />
            <span>Vai alla chat con il fitopatologo</span>
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
      
      {!useAI && (
        <p className="text-xs text-center text-gray-500 pt-2">
          La tua richiesta è stata inviata al fitopatologo. Riceverai una risposta al più presto nella sezione Chat.
        </p>
      )}
    </div>
  );
};

export default ActionButtons;
