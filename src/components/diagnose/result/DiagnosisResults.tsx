
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import DiagnosisResult from './DiagnosisResult';
import ActionButtons from './ActionButtons';
import { usePlantDiagnosis } from '@/hooks/usePlantDiagnosis';
import type { DiagnosedDisease } from '../types';

interface DiagnosisResultsProps {
  diagnosisResult: string;
  diagnosedDisease: DiagnosedDisease | null;
  onStartNewAnalysis: () => void;
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

const DiagnosisResults = ({ 
  diagnosisResult, 
  diagnosedDisease, 
  onStartNewAnalysis,
  hasValidAnalysis,
  useAI = false,
  diagnosisData
}: DiagnosisResultsProps) => {
  const { saveDiagnosis, isSaving } = usePlantDiagnosis();

  const handleSaveDiagnosis = () => {
    console.log('🔄 Chiamando saveDiagnosis...');
    saveDiagnosis();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <DiagnosisResult 
            result={diagnosisResult}
            disease={diagnosedDisease}
          />
        </CardContent>
      </Card>

      <ActionButtons
        onStartNewAnalysis={onStartNewAnalysis}
        onSaveDiagnosis={handleSaveDiagnosis}
        saveLoading={isSaving}
        hasValidAnalysis={hasValidAnalysis}
        useAI={useAI}
        diagnosisData={diagnosisData}
      />
    </div>
  );
};

export default DiagnosisResults;
