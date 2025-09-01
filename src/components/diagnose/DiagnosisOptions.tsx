import React from 'react';
import { CheckCircle, Circle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { usePlantInfo } from '@/context/PlantInfoContext';
import DirectChatButton from './DirectChatButton';
import { Button } from '@/components/ui/button';

interface DiagnosisOptionsProps {
  onOptionChange: (option: 'ai' | 'expert') => void;
  uploadedImage: string | File | null;
  onStartDiagnosis: () => void;
}

export const DiagnosisOptions: React.FC<DiagnosisOptionsProps> = ({
  onOptionChange,
  uploadedImage,
  onStartDiagnosis
}) => {
  const { plantInfo, setPlantInfo } = usePlantInfo();

  const handleAIToggle = () => {
    setPlantInfo(prev => ({
      ...prev,
      useAI: !prev.useAI,
      sendToExpert: false // Disabilita l'altra opzione
    }));
    onOptionChange('ai');
  };

  const handleExpertToggle = () => {
    setPlantInfo(prev => ({
      ...prev,
      sendToExpert: !prev.sendToExpert,
      useAI: false // Disabilita l'altra opzione
    }));
    onOptionChange('expert');
  };

  return (
    <div className="space-y-4">
      {/* Diagnosi AI */}
      <div className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
        plantInfo.useAI 
          ? 'border-drplant-green bg-drplant-green/5' 
          : 'border-gray-200 hover:border-drplant-green/50'
      }`} onClick={() => handleAIToggle()}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            {plantInfo.useAI ? (
              <CheckCircle className="w-5 h-5 text-drplant-green" />
            ) : (
              <Circle className="w-5 h-5 text-gray-400" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-gray-900">Diagnosi con Intelligenza Artificiale</h3>
              <Badge variant="outline" className="text-xs">
                Veloce
              </Badge>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Ricevi un'analisi rapida e automatizzata della tua pianta.
              Ideale per identificare problemi comuni e ottenere suggerimenti.
            </p>
          </div>
        </div>
      </div>

      {/* Chat con Fitopatologo */}
      <div className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
        plantInfo.sendToExpert 
          ? 'border-drplant-green bg-drplant-green/5' 
          : 'border-gray-200 hover:border-drplant-green/50'
      }`} onClick={() => handleExpertToggle()}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            {plantInfo.sendToExpert ? (
              <CheckCircle className="w-5 h-5 text-drplant-green" />
            ) : (
              <Circle className="w-5 h-5 text-gray-400" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-gray-900">Chat con Fitopatologo</h3>
              <Badge variant="outline" className="text-xs">
                Gratuito
              </Badge>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Consulenza diretta con il Dr. Marco Nigro, fitopatologo esperto.
              Ricevi consigli personalizzati e risposte professionali.
            </p>
            
            {plantInfo.sendToExpert && (
              <div className="mt-4">
                <DirectChatButton 
                  uploadedImage={uploadedImage}
                  isDisabled={!plantInfo.infoComplete}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pulsante di avvio diagnosi */}
      {!plantInfo.sendToExpert && (
        <Button
          onClick={onStartDiagnosis}
          disabled={!plantInfo.useAI || !plantInfo.infoComplete}
          className="bg-drplant-green hover:bg-drplant-green/90 text-white w-full"
        >
          Avvia Diagnosi AI
        </Button>
      )}
    </div>
  );
};

export default DiagnosisOptions;
