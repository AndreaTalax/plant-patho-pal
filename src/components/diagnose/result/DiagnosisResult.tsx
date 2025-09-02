
import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import ImageDisplay from './ImageDisplay';
import PlantInfoCard from './PlantInfoCard';
import ActionButtons from './ActionButtons';
import { AutoExpertNotificationService } from '@/components/chat/AutoExpertNotificationService';
import ProductSuggestions from './ProductSuggestions'; // Aggiunta: sezione prodotti consigliati

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
  diagnosedDisease?: any;
  confidence?: number;
  isHealthy?: boolean;
  plantInfo: any;
  analysisDetails?: any;
  imageSrc: string;
  onStartNewAnalysis: () => void;
  onSaveDiagnosis?: () => void;
  onChatWithExpert?: () => void;
  saveLoading?: boolean;
  isAnalyzing: boolean;
  hasExpertChatAccess?: boolean;
  // Consente compatibilità con chiamanti che usano "analysisData"
  analysisData?: any;
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
  analysisData, // nuova prop opzionale per compatibilità
}) => {
  const { user } = useAuth();

  // Default sicuri per props opzionali
  const resolvedConfidence = confidence ?? 0;
  const resolvedIsHealthy = !!isHealthy;
  const resolvedHasExpertChatAccess = !!hasExpertChatAccess;
  const resolvedSaveLoading = !!saveLoading;
  const handleSaveDiagnosis: () => void = onSaveDiagnosis ?? (() => console.log('[DiagnosisResult] onSaveDiagnosis non fornito'));

  // Usa diagnosedDisease se presente, altrimenti fallback su analysisData
  const effectiveDiagnosis = diagnosedDisease ?? analysisData;

  if (isAnalyzing) {
    return <div className="text-center">Analisi in corso...</div>;
  }

  if (!imageSrc) {
    return <div className="text-center">Nessuna immagine da mostrare.</div>;
  }

  // Prepara i dati della diagnosi per l'invio all'esperto con tutte le proprietà richieste
  const diagnosisData = {
    plantType: plantInfo?.name || effectiveDiagnosis?.name || 'Pianta non identificata',
    plantVariety: analysisDetails?.multiServiceInsights?.plantSpecies || '',
    symptoms: plantInfo?.symptoms || 'Nessun sintomo specificato',
    imageUrl: imageSrc || '',
    analysisResult: effectiveDiagnosis || null,
    confidence: resolvedConfidence,
    isHealthy: resolvedIsHealthy,
  };

  // Invio automatico dei dati AI all'esperto quando disponibili (solo per utenti premium)
  useEffect(() => {
    const sendAutomaticDiagnosis = async () => {
      // Invia solo se l'utente ha accesso premium e c'è una diagnosi valida
      if (!user || !resolvedHasExpertChatAccess || !effectiveDiagnosis || isAnalyzing) {
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
  }, [user, resolvedHasExpertChatAccess, effectiveDiagnosis, imageSrc, isAnalyzing, resolvedConfidence, resolvedIsHealthy]);

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
        {resolvedIsHealthy ? "La tua pianta è sana!" : "Risultati dell'analisi"}
      </div>

      <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
        <ImageDisplay imageSrc={imageSrc} />
        
        <div className="mt-3">
          <PlantInfoCard
            plantInfo={plantInfo}
            analysisDetails={analysisDetails}
            standardizedData={effectiveDiagnosis}
          />
        </div>
      </div>

      {/* Sezione possibili nomi della pianta */}
      <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          🌿 Possibili Nomi della Pianta
        </h2>
        <div className="mt-3 space-y-2">
          {plantInfo?.name && (
            <div className="p-2 bg-green-50 rounded border-l-4 border-green-400">
              <p className="font-medium text-green-800">{plantInfo.name}</p>
              <p className="text-sm text-green-600">Identificazione principale</p>
            </div>
          )}
          {analysisDetails?.multiServiceInsights?.plantSpecies && analysisDetails.multiServiceInsights.plantSpecies !== plantInfo?.name && (
            <div className="p-2 bg-blue-50 rounded border-l-4 border-blue-400">
              <p className="font-medium text-blue-800">{analysisDetails.multiServiceInsights.plantSpecies}</p>
              <p className="text-sm text-blue-600">Nome scientifico/alternativo</p>
            </div>
          )}
          {analysisDetails?.multiServiceInsights?.eppoPlantIdentification && (
            <div className="p-2 bg-purple-50 rounded border-l-4 border-purple-400">
              <p className="font-medium text-purple-800">{analysisDetails.multiServiceInsights.eppoPlantIdentification.preferredName}</p>
              <p className="text-sm text-purple-600">Database EPPO - {analysisDetails.multiServiceInsights.eppoPlantIdentification.scientificName}</p>
            </div>
          )}
        </div>
      </div>

      {/* Sezione possibili malattie */}
      {effectiveDiagnosis && (
        <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            🦠 Possibili Malattie
          </h2>
          <div className="mt-3 space-y-3">
            <div className="p-3 bg-red-50 rounded border-l-4 border-red-400">
              <p className="font-semibold text-red-800">{effectiveDiagnosis.name}</p>
              <p className="text-sm text-red-600 mt-1">{effectiveDiagnosis.description}</p>
              
              {effectiveDiagnosis.causes && (
                <div className="mt-2">
                  <p className="font-medium text-red-700">Cause:</p>
                  <p className="text-sm text-red-600">{effectiveDiagnosis.causes}</p>
                </div>
              )}

              {effectiveDiagnosis.symptoms && effectiveDiagnosis.symptoms.length > 0 && (
                <div className="mt-2">
                  <p className="font-medium text-red-700">Sintomi:</p>
                  <ul className="text-sm text-red-600 ml-4">
                    {effectiveDiagnosis.symptoms.map((symptom: string, index: number) => (
                      <li key={index} className="list-disc">{symptom}</li>
                    ))}
                  </ul>
                </div>
              )}

              {effectiveDiagnosis.treatments && effectiveDiagnosis.treatments.length > 0 && (
                <div className="mt-2">
                  <p className="font-medium text-red-700">Trattamenti consigliati:</p>
                  <ul className="text-sm text-red-600 ml-4">
                    {effectiveDiagnosis.treatments.map((treatment: string, index: number) => (
                      <li key={index} className="list-disc">{treatment}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Malattie aggiuntive da EPPO se disponibili */}
            {analysisDetails?.eppoData?.diseaseMatches && analysisDetails.eppoData.diseaseMatches.length > 0 && (
              <>
                {analysisDetails.eppoData.diseaseMatches.slice(0, 2).map((disease: any, index: number) => (
                  <div key={index} className="p-3 bg-orange-50 rounded border-l-4 border-orange-400">
                    <p className="font-semibold text-orange-800">{disease.name}</p>
                    <p className="text-sm text-orange-600">Possibile problema secondario - Database EPPO</p>
                    {disease.symptoms && (
                      <p className="text-sm text-orange-600 mt-1">Sintomi: {disease.symptoms.join(', ')}</p>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}

      {/* Sezione prodotti consigliati - reinserita */}
      <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold">Prodotti consigliati</h2>
        <p className="text-sm text-muted-foreground mb-2">
          {resolvedIsHealthy
            ? 'Prodotti per manutenzione e prevenzione'
            : 'Prodotti utili per trattare il problema rilevato'}
        </p>
        <ProductSuggestions
          diseaseName={effectiveDiagnosis?.name || plantInfo?.name || ''}
          maxItems={4}
        />
      </div>


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
          onSaveDiagnosis={handleSaveDiagnosis}
          onChatWithExpert={handleChatWithExpert}
          saveLoading={resolvedSaveLoading}
          hasValidAnalysis={!!effectiveDiagnosis}
          useAI={true}
          diagnosisData={diagnosisData}
        />
      </div>
    </div>
  );
};

export default DiagnosisResult;
