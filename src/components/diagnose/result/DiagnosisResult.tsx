
import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import ImageDisplay from './ImageDisplay';
import PlantInfoCard from './PlantInfoCard';
import ActionButtons from './ActionButtons';
import { AutoExpertNotificationService } from '@/components/chat/AutoExpertNotificationService';

interface Disease {
  name: string;
  description: string;
  symptoms: string[];
  causes: string;
  treatments: string[];
}

interface AnalysisDetails {
  multiServiceInsights: {
    plantSpecies: string;
  };
  sources: string[];
  apiSources: string[];
}

interface DiagnosisData {
  plantType: string;
  plantVariety: string;
  symptoms: string[];
  treatments: string[];
  confidence: number;
  isHealthy: boolean;
  diseaseInfo: {
    name: string;
    description: string;
    causes: string;
  };
  analysisMetadata: {
    timestamp: string;
    sources: string[];
    apiSources: string[];
  };
}

interface DiagnosisResultProps {
  diagnosedDisease: any;
  confidence: number;
  isHealthy: boolean;
  plantInfo: any;
  analysisDetails: any;
  imageSrc: string;
  onStartNewAnalysis: () => void;
  onSaveDiagnosis: () => void;
  onChatWithExpert?: () => void;
  saveLoading: boolean;
  isAnalyzing: boolean;
  hasExpertChatAccess: boolean;
}

const DiagnosisResult: React.FC<DiagnosisResultProps> = ({
  diagnosedDisease,
  confidence,
  isHealthy,
  plantInfo,
  analysisDetails,
  imageSrc,
  onStartNewAnalysis,
  onSaveDiagnosis,
  onChatWithExpert,
  saveLoading,
  isAnalyzing,
  hasExpertChatAccess,
}) => {
  const { user } = useAuth();

  if (isAnalyzing) {
    return <div className="text-center">Analisi in corso...</div>;
  }

  if (!imageSrc) {
    return <div className="text-center">Nessuna immagine da mostrare.</div>;
  }

  // Prepara i dati della diagnosi per l'invio all'esperto
  const diagnosisData = {
    plantType: plantInfo?.name || diagnosedDisease?.name || 'Pianta non identificata',
    plantVariety: analysisDetails?.multiServiceInsights?.plantSpecies || '',
    symptoms: diagnosedDisease?.symptoms || [],
    treatments: diagnosedDisease?.treatments || [],
    confidence: confidence || 0,
    isHealthy: isHealthy || false,
    diseaseInfo: {
      name: diagnosedDisease?.name || 'Nessuna malattia rilevata',
      description: diagnosedDisease?.description || '',
      causes: diagnosedDisease?.causes || '',
    },
    analysisMetadata: {
      timestamp: new Date().toISOString(),
      sources: analysisDetails?.sources || [],
      apiSources: analysisDetails?.apiSources || []
    }
  };

  // Invio automatico dei dati AI all'esperto quando disponibili (solo per utenti premium)
  useEffect(() => {
    const sendAutomaticDiagnosis = async () => {
      // Invia solo se l'utente ha accesso premium e c'è una diagnosi valida
      if (!user || !hasExpertChatAccess || !diagnosedDisease || isAnalyzing) {
        return;
      }

      // Aspetta un momento per assicurarsi che tutti i dati siano pronti
      const timeoutId = setTimeout(async () => {
        try {
          console.log('🤖 Invio automatico dati AI all\'esperto:', diagnosisData);
          
          await AutoExpertNotificationService.sendDiagnosisToExpert(
            user.id,
            diagnosisData
          );
          
          console.log('✅ Dati AI inviati automaticamente all\'esperto');
        } catch (error) {
          console.error('❌ Errore nell\'invio automatico all\'esperto:', error);
        }
      }, 2000);
      
      return () => {
        clearTimeout(timeoutId);
      };
    };

    sendAutomaticDiagnosis();
  }, [user, hasExpertChatAccess, diagnosedDisease, imageSrc, isAnalyzing, confidence, isHealthy]);

  // Funzione per gestire il click su "Chat con l'esperto" - invia sempre i dati
  const handleChatWithExpert = async () => {
    console.log('🗣️ Click su Chat con l\'esperto, invio dati della diagnosi...');
    
    if (!user) {
      console.error('❌ Utente non autenticato');
      return;
    }

    try {
      // Invia sempre i dati della diagnosi quando si clicca "Chat con l'esperto"
      console.log('📤 Invio dati diagnosi all\'esperto:', diagnosisData);
      
      await AutoExpertNotificationService.sendDiagnosisToExpert(
        user.id,
        diagnosisData
      );
      
      console.log('✅ Dati diagnosi inviati all\'esperto con successo');
      
      // Poi chiama la funzione originale per aprire la chat
      if (onChatWithExpert) {
        await onChatWithExpert();
      }
    } catch (error) {
      console.error('❌ Errore nell\'invio dati all\'esperto:', error);
      
      // Anche in caso di errore, prova ad aprire la chat
      if (onChatWithExpert) {
        await onChatWithExpert();
      }
    }
  };

  return (
    <div className="space-y-2 px-2">
      <div className="text-xl font-semibold text-center">
        {isHealthy ? "La tua pianta è sana!" : "Risultati dell'analisi"}
      </div>

      <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
        <ImageDisplay imageSrc={imageSrc} />
        
        <div className="mt-3">
          <PlantInfoCard
            plantInfo={plantInfo}
            analysisDetails={analysisDetails}
            standardizedData={diagnosedDisease}
          />
        </div>
      </div>

      {diagnosedDisease && (
        <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold">Dettagli della malattia</h2>
          <p><strong>Nome:</strong> {diagnosedDisease.name}</p>
          <p><strong>Descrizione:</strong> {diagnosedDisease.description}</p>
          <p><strong>Cause:</strong> {diagnosedDisease.causes}</p>

          {diagnosedDisease.symptoms && diagnosedDisease.symptoms.length > 0 && (
            <div>
              <p className="font-semibold mt-2">Sintomi:</p>
              <ul>
                {diagnosedDisease.symptoms.map((symptom: string, index: number) => (
                  <li key={index}>{symptom}</li>
                ))}
              </ul>
            </div>
          )}

          {diagnosedDisease.treatments && diagnosedDisease.treatments.length > 0 && (
            <div>
              <p className="font-semibold mt-2">Trattamenti:</p>
              <ul>
                {diagnosedDisease.treatments.map((treatment: string, index: number) => (
                  <li key={index}>{treatment}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {analysisDetails && (
        <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold">Dettagli dell'analisi</h2>
          {analysisDetails.multiServiceInsights && (
            <>
              <p><strong>Specie:</strong> {analysisDetails.multiServiceInsights.plantSpecies}</p>
              <p><strong>Nome comune:</strong> {analysisDetails.multiServiceInsights.commonNames?.join(', ') || 'N/A'}</p>
            </>
          )}

          {analysisDetails.sources && analysisDetails.sources.length > 0 && (
            <div>
              <p className="font-semibold mt-2">Fonti:</p>
              <ul>
                {analysisDetails.sources.map((source: string, index: number) => (
                  <li key={index}>{source}</li>
                ))}
              </ul>
            </div>
          )}

          {analysisDetails.apiSources && analysisDetails.apiSources.length > 0 && (
            <div>
              <p className="font-semibold mt-2">Fonti API:</p>
              <ul>
                {analysisDetails.apiSources.map((source: string, index: number) => (
                  <li key={index}>{source}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="mt-4">
        <ActionButtons
          onStartNewAnalysis={onStartNewAnalysis}
          onSaveDiagnosis={onSaveDiagnosis}
          onChatWithExpert={handleChatWithExpert}
          saveLoading={saveLoading}
          hasValidAnalysis={!!diagnosedDisease}
          useAI={true}
          diagnosisData={diagnosisData}
        />
      </div>
    </div>
  );
};

export default DiagnosisResult;
