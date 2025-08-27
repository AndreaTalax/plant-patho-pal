
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
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-center">
              {diagnosedDisease?.healthy ? "La tua pianta è sana!" : "Risultati dell'analisi"}
            </h2>
            
            <div className="prose prose-sm">
              <p>{diagnosisResult}</p>
            </div>

            {diagnosedDisease && !diagnosedDisease.healthy && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">{diagnosedDisease.name}</h3>
                {diagnosedDisease.description && (
                  <p className="text-sm text-gray-600 mb-2">{diagnosedDisease.description}</p>
                )}
                
                {diagnosedDisease.symptoms && diagnosedDisease.symptoms.length > 0 && (
                  <div className="mb-2">
                    <h4 className="font-medium text-sm">Sintomi:</h4>
                    <ul className="list-disc list-inside text-sm text-gray-600">
                      {diagnosedDisease.symptoms.map((symptom, index) => (
                        <li key={index}>{symptom}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {diagnosedDisease.treatments && diagnosedDisease.treatments.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm">Trattamenti consigliati:</h4>
                    <ul className="list-disc list-inside text-sm text-gray-600">
                      {diagnosedDisease.treatments.map((treatment, index) => (
                        <li key={index}>{treatment}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
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
