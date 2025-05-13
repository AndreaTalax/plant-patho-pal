
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { DiagnosedDisease } from '../types';

interface ActionButtonsProps {
  resetDiagnosis: () => void;
  navigateToChat: () => void;
  diagnosisResult: string | null;
  diagnosedDisease: DiagnosedDisease | null;
}

const ActionButtons = ({ 
  resetDiagnosis, 
  navigateToChat,
  diagnosisResult,
  diagnosedDisease
}: ActionButtonsProps) => {
  return (
    <div className="flex gap-2 mt-4">
      <Button 
        variant="outline" 
        className="flex-1"
        onClick={resetDiagnosis}
      >
        New Diagnosis
      </Button>
      {diagnosisResult && diagnosedDisease && (
        <Button 
          className="flex-1 bg-drplant-blue hover:bg-drplant-blue-dark"
          onClick={navigateToChat}
        >
          <MessageCircle className="mr-2 h-4 w-4" /> Expert Consult
        </Button>
      )}
    </div>
  );
};

export default ActionButtons;
