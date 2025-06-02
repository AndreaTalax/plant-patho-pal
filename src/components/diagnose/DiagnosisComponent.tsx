// src/components/DiagnosisComponent.tsx
import React, { useState } from 'react';
import { usePlantDiagnosis } from '../services/aiDiagnosisService';

interface DiagnosisProps {
  plantImage: File | string;
  plantData: {
    environment: string;
    irrigation: string;
    plantName: string;
  };
  onDiagnosisComplete: (result: any) => void;
}

export const DiagnosisComponent: React.FC<DiagnosisProps> = ({
  plantImage,
  plantData,
  onDiagnosisComplete
}) => {
  const { analyzePlant, isAnalyzing, result } = usePlantDiagnosis();
  const [selectedOption, setSelectedOption] = useState<'ai' | 'expert' | null>(null);

  const handleAIDiagnosis = async () => {
    setSelectedOption('ai');
    
    try {
      const diagnosis = await analyzePlant({
        image: plantImage,
        plantData,
        userLocation: 'Italy' // Puoi ottenerlo dalla geolocalizzazione
      });

      if (diagnosis.success && diagnosis.disease.confidence >= 70) {
        onDiagnosisComplete({
          type: 'ai',
          data: diagnosis.disease
        });
      } else {
        // Fallback a fitopatologo se confidence bassa
        handleExpertConsultation();
      }
    } catch (error) {
      console.error('AI Diagnosis failed:', error);
      // Fallback a fitopatologo in caso di errore
      handleExpertConsultation();
    }
  };

  const handleExpertConsultation = () => {
    setSelectedOption('expert');
    
    // Invia richiesta al fitopatologo Marco Nigro
    const expertRequest = {
      type: 'expert',
      data: {
        patientData: plantData,
        image: plantImage,
        requestedAt: new Date().toISOString(),
        status: 'pending'
      }
    };

    onDiagnosisComplete(expertRequest);
  };

  if (isAnalyzing) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mb-4"></div>
        <p className="text-lg font-medium">Analizzando la pianta...</p>
        <p className="text-sm text-gray-600 mt-2">L'AI sta processando l'immagine</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold mb-4">Scegli il tipo di diagnosi</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Opzione AI */}
        <div 
          className={`
            border-2 rounded-lg p-6 cursor-pointer transition-all
            ${selectedOption === 'ai' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}
          `}
          onClick={handleAIDiagnosis}
        >
          <div className="flex items-center mb-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mr-3">
              <span className="text-white font-bold">AI</span>
            </div>
            <div>
              <h4 className="font-semibold">Diagnosi AI</h4>
              <p className="text-sm text-gray-600">Risultato immediato</p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              <span>Analisi istantanea</span>
            </div>
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              <span>Accuratezza 90%+</span>
            </div>
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              <span>Prodotti consigliati</span>
            </div>
          </div>
        </div>

        {/* Opzione Esperto */}
        <div 
          className={`
            border-2 rounded-lg p-6 cursor-pointer transition-all
            ${selectedOption === 'expert' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}
          `}
          onClick={handleExpertConsultation}
        >
          <div className="flex items-center mb-3">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mr-3">
              <span className="text-white font-bold">🌱</span>
            </div>
            <div>
              <h4 className="font-semibold">Dr. Marco Nigro</h4>
              <p className="text-sm text-gray-600">Fitopatologo esperto</p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              <span>Diagnosi professionale</span>
            </div>
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              <span>Esperienza decennale</span>
            </div>
            <div className="flex items-center">
              <span className="text-orange-500 mr-2">⏱</span>
              <span>Risposta in 24h</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sezione risultati */}
      {result && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold mb-2">Risultato Diagnosi</h4>
          {result.success ? (
            <div className="space-y-2">
              <p><strong>Malattia:</strong> {result.disease.name}</p>
              <p><strong>Confidenza:</strong> {result.disease.confidence}%</p>
              <p><strong>Descrizione:</strong> {result.disease.description}</p>
              <p><strong>Trattamento:</strong> {result.disease.treatment}</p>
            </div>
          ) : (
            <div className="text-red-600">
              <p>Errore nell'analisi: {result.error}</p>
              <button 
                onClick={handleExpertConsultation}
                className="mt-2 text-blue-600 underline"
              >
                Consulta il fitopatologo
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
