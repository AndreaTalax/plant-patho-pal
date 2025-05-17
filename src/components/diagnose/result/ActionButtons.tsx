
import { Button } from "@/components/ui/button";
import { ArrowRight, Save, AlertCircle, MessageCircle, Loader2, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ActionButtonsProps {
  onStartNewAnalysis: () => void;
  onSaveDiagnosis?: () => void;
  onChatWithExpert?: () => void;
  saveLoading?: boolean;
  hasValidAnalysis: boolean;
  useAI?: boolean;
}

const ActionButtons = ({ 
  onStartNewAnalysis, 
  onSaveDiagnosis, 
  onChatWithExpert, 
  saveLoading = false,
  hasValidAnalysis,
  useAI = false
}: ActionButtonsProps) => {
  // Add navigate hook for direct navigation when needed
  const navigate = useNavigate();
  
  const handleChatWithExpert = () => {
    if (onChatWithExpert) {
      onChatWithExpert();
    } else {
      // Fallback direct navigation if callback not provided
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

      {!useAI && (
        <Button
          className="w-full bg-drplant-blue-dark hover:bg-drplant-blue-darker flex items-center justify-center gap-2"
          onClick={handleChatWithExpert}
        >
          <MessageCircle className="h-4 w-4" />
          <span>Vai alla chat con il fitopatologo</span>
        </Button>
      )}
      
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
