
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, Save } from 'lucide-react';

export interface ActionButtonsProps {
  onStartNewAnalysis: () => void;
  onSaveDiagnosis: () => Promise<void>;
  saveLoading: boolean;
  hasValidAnalysis: boolean;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ 
  onStartNewAnalysis,
  onSaveDiagnosis,
  saveLoading,
  hasValidAnalysis
}) => {
  return (
    <div className="flex flex-wrap gap-2 mt-4">
      <Button 
        variant="outline" 
        onClick={onStartNewAnalysis}
        className="flex-1"
      >
        <RefreshCw className="mr-2 h-4 w-4" />
        Nuova analisi
      </Button>
      
      <Button 
        onClick={onSaveDiagnosis}
        disabled={saveLoading || !hasValidAnalysis}
        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
      >
        {saveLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Salvataggio...
          </>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" />
            Salva diagnosi
          </>
        )}
      </Button>
    </div>
  );
};

export default ActionButtons;
