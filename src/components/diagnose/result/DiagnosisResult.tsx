
import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePremiumStatus } from '@/services/premiumService';
import ImageDisplay from './ImageDisplay';
import PlantInfoCard from './PlantInfoCard';
import ActionButtons from './ActionButtons';
import { AutoExpertNotificationService } from '@/components/chat/AutoExpertNotificationService';
import ProductSuggestions from './ProductSuggestions'; // Aggiunta: sezione prodotti consigliati
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

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
  const { hasExpertChatAccess: premiumAccess } = usePremiumStatus();

  // Default sicuri per props opzionali
  const resolvedConfidence = confidence ?? 0;
  const resolvedIsHealthy = !!isHealthy;
  const resolvedSaveLoading = !!saveLoading;
  
  // Usa sempre il valore dal premiumService per evitare problemi con test@gmail.com
  const resolvedHasExpertChatAccess = premiumAccess;
  
  const handleSaveDiagnosis: () => void = onSaveDiagnosis ?? (() => {
    console.log('[DiagnosisResult] onSaveDiagnosis non fornito');
    toast.info('Funzione salvataggio non implementata');
  });

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

  // Rimosso invio automatico - la diagnosi viene inviata solo quando l'utente clicca "Chat con l'esperto"

  // Funzione per gestire il pagamento e l'invio della diagnosi
  const handlePayAndSendDiagnosis = async () => {
    console.log('💳 Iniziando processo di pagamento per diagnosi AI...');
    
    if (!user) {
      console.error('❌ Utente non autenticato');
      toast.error('Devi essere autenticato per procedere');
      return;
    }

    try {
      // Crea sessione checkout per la diagnosi premium
      console.log('🔄 Creando sessione Stripe checkout...');
      const { data, error } = await supabase.functions.invoke('create-checkout', {});
      
      if (error) {
        console.error('❌ Errore creazione checkout:', error);
        toast.error('Errore durante il processo di pagamento');
        return;
      }

      if (data?.url) {
        console.log('✅ Sessione checkout creata, reindirizzamento a Stripe...');
        toast.success('Reindirizzamento al pagamento...', {
          description: 'Dopo il pagamento, la diagnosi sarà inviata automaticamente all\'esperto'
        });
        
        // Salva la diagnosi nel localStorage per inviarla dopo il pagamento
        localStorage.setItem('pendingDiagnosis', JSON.stringify({
          userId: user.id,
          diagnosisData,
          timestamp: Date.now()
        }));
        
        // Apri Stripe checkout in una nuova tab
        window.open(data.url, '_blank');
      } else {
        throw new Error('URL checkout non ricevuto');
      }
    } catch (error) {
      console.error('❌ Errore nel processo di pagamento:', error);
      toast.error('Errore durante il processo di pagamento. Riprova più tardi.');
    }
  };

  // Funzione per gestire il click su "Chat con l'esperto" - ora richiede pagamento premium
  const handleChatWithExpert = async () => {
    console.log('🗣️ Click su Chat con l\'esperto...');
    
    if (!user) {
      console.error('❌ Utente non autenticato');
      return;
    }

    // Controlla se l'utente ha accesso premium
    if (!resolvedHasExpertChatAccess) {
      console.log('⚠️ Utente senza accesso premium, mostrando modal di pagamento');
      toast.error('Accesso Premium richiesto', {
        description: 'Acquista l\'abbonamento Premium per chattare con l\'esperto'
      });
      return;
    }

    try {
      // Se ha accesso premium, invia la diagnosi e apri la chat
      console.log('📤 Invio dati diagnosi all\'esperto (utente premium)...');
      
      await AutoExpertNotificationService.sendDiagnosisToExpert(
        user.id,
        diagnosisData
      );
      
      console.log('✅ Dati diagnosi inviati all\'esperto con successo');
      toast.success('Diagnosi inviata all\'esperto!');
      
      // Poi chiama la funzione originale per aprire la chat
      if (onChatWithExpert) {
        await onChatWithExpert();
      }
    } catch (error) {
      console.error('❌ Errore nell\'invio dati all\'esperto:', error);
      toast.error('Errore nell\'invio della diagnosi');
      
      // Anche in caso di errore, prova ad aprire la chat
      if (onChatWithExpert) {
        await onChatWithExpert();
      }
    }
  };

  return (
    <div className="space-y-4 px-2 max-w-4xl mx-auto">
      {/* Header migliorato */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-100 to-blue-100 rounded-full mb-3">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-green-700 to-blue-700 bg-clip-text text-transparent">
            {resolvedIsHealthy ? "✅ Pianta Sana!" : "🔬 Risultati Analisi"}
          </h1>
        </div>
        <p className="text-gray-600">Analisi completata con successo usando AI multipla e database EPPO</p>
      </div>

      {/* Sezione immagine e info base */}
      <div className="bg-gradient-to-br from-white to-gray-50 p-4 rounded-xl shadow-lg border border-gray-200">
        <ImageDisplay imageSrc={imageSrc} />
        
        <div className="mt-4">
          <PlantInfoCard
            plantInfo={plantInfo}
            analysisDetails={analysisDetails}
            standardizedData={effectiveDiagnosis}
          />
        </div>
      </div>

      {/* Sezione possibili nomi della pianta - stile migliorato */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl shadow-lg border border-green-200">
        <h2 className="text-xl font-bold flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
            🌿
          </div>
          Identificazione Pianta
        </h2>
        <div className="grid gap-3">
          {plantInfo?.name && (
            <div className="p-4 bg-white rounded-lg border-l-4 border-green-500 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-green-800 text-lg">{plantInfo.name}</p>
                  <p className="text-sm text-green-600 flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Identificazione principale
                  </p>
                </div>
                <div className="text-green-600 text-2xl">🏆</div>
              </div>
            </div>
          )}
          
          {analysisDetails?.multiServiceInsights?.plantSpecies && 
           analysisDetails.multiServiceInsights.plantSpecies !== plantInfo?.name && (
            <div className="p-4 bg-white rounded-lg border-l-4 border-blue-500 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-blue-800 text-lg">{analysisDetails.multiServiceInsights.plantSpecies}</p>
                  <p className="text-sm text-blue-600 flex items-center gap-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    Nome scientifico/alternativo
                  </p>
                </div>
                <div className="text-blue-600 text-2xl">🔬</div>
              </div>
            </div>
          )}
          
          {analysisDetails?.multiServiceInsights?.eppoPlantIdentification && (
            <div className="p-4 bg-white rounded-lg border-l-4 border-purple-500 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-purple-800 text-lg">{analysisDetails.multiServiceInsights.eppoPlantIdentification.preferredName}</p>
                  <p className="text-sm text-purple-600">{analysisDetails.multiServiceInsights.eppoPlantIdentification.scientificName}</p>
                  <p className="text-xs text-purple-500 flex items-center gap-1 mt-1">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    Database EPPO Ufficiale
                  </p>
                </div>
                <div className="text-purple-600 text-2xl">🗃️</div>
              </div>
            </div>
          )}

          {/* Nomi alternativi da altre fonti */}
          {analysisDetails?.risultatiCompleti?.plantIdResult?.suggestions?.slice(1, 4).map((suggestion: any, index: number) => (
            <div key={index} className="p-3 bg-white/70 rounded-lg border-l-4 border-gray-400 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-700">{suggestion.plant_name}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    Possibile alternativa ({Math.round(suggestion.probability * 100)}%)
                  </p>
                </div>
                <div className="text-gray-500 text-xl">🔍</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sezione malattie e problemi - stile migliorato con più alternative */}
      {(effectiveDiagnosis || analysisDetails?.risultatiCompleti?.detectedDiseases?.length) && (
        <div className="bg-gradient-to-br from-red-50 to-pink-50 p-4 rounded-xl shadow-lg border border-red-200">
          <h2 className="text-xl font-bold flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
              🦠
            </div>
            Analisi Problemi e Malattie
          </h2>
          
          <div className="grid gap-4">
            {/* Malattia principale */}
            {effectiveDiagnosis && (
              <div className="p-4 bg-white rounded-lg border-l-4 border-red-500 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-red-800 text-lg flex items-center gap-2">
                      🚨 {effectiveDiagnosis.name}
                      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Principale</span>
                    </h3>
                    {effectiveDiagnosis.description && (
                      <p className="text-red-600 mt-2">{effectiveDiagnosis.description}</p>
                    )}
                  </div>
                </div>
                
                <div className="grid md:grid-cols-3 gap-4 mt-4">
                  {effectiveDiagnosis.causes && (
                    <div className="bg-red-50 p-3 rounded-lg">
                      <h4 className="font-semibold text-red-700 mb-2 flex items-center gap-1">
                        🔍 Cause
                      </h4>
                      <p className="text-sm text-red-600">{effectiveDiagnosis.causes}</p>
                    </div>
                  )}

                  {effectiveDiagnosis.symptoms && effectiveDiagnosis.symptoms.length > 0 && (
                    <div className="bg-orange-50 p-3 rounded-lg">
                      <h4 className="font-semibold text-orange-700 mb-2 flex items-center gap-1">
                        📋 Sintomi
                      </h4>
                      <ul className="text-sm text-orange-600 space-y-1">
                        {effectiveDiagnosis.symptoms.map((symptom: string, index: number) => (
                          <li key={index} className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                            {symptom}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {effectiveDiagnosis.treatments && effectiveDiagnosis.treatments.length > 0 && (
                    <div className="bg-green-50 p-3 rounded-lg">
                      <h4 className="font-semibold text-green-700 mb-2 flex items-center gap-1">
                        💊 Trattamenti
                      </h4>
                      <ul className="text-sm text-green-600 space-y-1">
                        {effectiveDiagnosis.treatments.map((treatment: string, index: number) => (
                          <li key={index} className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                            {treatment}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Problemi secondari da EPPO */}
            {analysisDetails?.eppoData?.diseaseMatches?.slice(0, 3).map((disease: any, index: number) => (
              <div key={index} className="p-4 bg-white rounded-lg border-l-4 border-orange-400 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-orange-800 text-lg flex items-center gap-2">
                      ⚠️ {disease.name}
                      <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">EPPO DB</span>
                    </h3>
                    <p className="text-sm text-orange-600 mt-1">Possibile problema secondario identificato nel database EPPO</p>
                    {disease.symptoms && (
                      <div className="mt-3 p-2 bg-orange-50 rounded">
                        <p className="text-sm text-orange-700"><strong>Sintomi:</strong> {disease.symptoms.join(', ')}</p>
                      </div>
                    )}
                  </div>
                  <div className="text-orange-500 text-2xl">🗃️</div>
                </div>
              </div>
            ))}

            {/* Altre malattie rilevate */}
            {analysisDetails?.risultatiCompleti?.detectedDiseases?.slice(0, 4).map((d: any, idx: number) => 
              d !== effectiveDiagnosis && (
                <div key={idx} className="p-4 bg-white rounded-lg border-l-4 border-yellow-400 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-yellow-800 text-lg flex items-center gap-2">
                        🔍 {d.disease || d.name}
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                          {Math.round((d.confidence || 50))}%
                        </span>
                      </h3>
                      <div className="grid md:grid-cols-2 gap-3 mt-3">
                        {d.additionalInfo?.cause && (
                          <div className="p-2 bg-yellow-50 rounded">
                            <p className="text-sm text-yellow-700"><strong>Causa:</strong> {d.additionalInfo.cause}</p>
                          </div>
                        )}
                        {Array.isArray(d.symptoms) && d.symptoms.length > 0 && (
                          <div className="p-2 bg-yellow-50 rounded">
                            <p className="text-sm text-yellow-700"><strong>Sintomi:</strong> {d.symptoms.join(', ')}</p>
                          </div>
                        )}
                      </div>
                      {Array.isArray(d.treatments) && d.treatments.length > 0 && (
                        <div className="mt-2 p-2 bg-green-50 rounded">
                          <p className="text-sm text-green-700"><strong>Trattamenti:</strong> {d.treatments.join(', ')}</p>
                        </div>
                      )}
                    </div>
                    <div className="text-yellow-500 text-2xl">🔬</div>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* Sezione prodotti consigliati - stile migliorato */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl shadow-lg border border-blue-200">
        <h2 className="text-xl font-bold flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
            🛒
          </div>
          Prodotti Consigliati
        </h2>
        <div className="bg-white/70 p-3 rounded-lg mb-3">
          <p className="text-sm text-blue-700 flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            {resolvedIsHealthy
              ? 'Prodotti per manutenzione e prevenzione della salute della pianta'
              : 'Prodotti specifici per trattare i problemi identificati'}
          </p>
        </div>
        <ProductSuggestions
          diseaseName={effectiveDiagnosis?.name || plantInfo?.name || ''}
          maxItems={6}
        />
      </div>

      {/* Sezione dettagli analisi e fonti - migliorata */}
      {analysisDetails && (
        <div className="bg-gradient-to-br from-gray-50 to-slate-50 p-4 rounded-xl shadow-lg border border-gray-200">
          <h2 className="text-xl font-bold flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
              📊
            </div>
            Dettagli Analisi e Fonti
          </h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            {/* Informazioni tecniche */}
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                🔬 Dati Tecnici
              </h3>
              {analysisDetails.multiServiceInsights && (
                <div className="space-y-2">
                  {analysisDetails.multiServiceInsights.plantSpecies && (
                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-sm font-medium text-gray-600">Specie:</span>
                      <span className="text-sm text-gray-800">{analysisDetails.multiServiceInsights.plantSpecies}</span>
                    </div>
                  )}
                  {analysisDetails.multiServiceInsights.agreementScore && (
                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-sm font-medium text-gray-600">Accordo fonti:</span>
                      <span className="text-sm text-gray-800">{analysisDetails.multiServiceInsights.agreementScore}%</span>
                    </div>
                  )}
                  {analysisDetails.multiServiceInsights.eppoDiseasesFound !== undefined && (
                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-sm font-medium text-gray-600">Problemi EPPO:</span>
                      <span className="text-sm text-gray-800">{analysisDetails.multiServiceInsights.eppoDiseasesFound}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Fonti utilizzate */}
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                🌐 Fonti Utilizzate
              </h3>
              <div className="space-y-2">
                {analysisDetails.multiServiceInsights?.primaryService && (
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded border-l-4 border-green-400">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-green-800">
                      {analysisDetails.multiServiceInsights.primaryService} (Principale)
                    </span>
                  </div>
                )}
                
                {analysisDetails.sources?.map((source: string, index: number) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-blue-800">{source}</span>
                  </div>
                ))}

                {analysisDetails.apiSources?.map((source: string, index: number) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-purple-50 rounded">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-sm text-purple-800">{source} API</span>
                  </div>
                ))}

                {/* Tecnologia utilizzata */}
                <div className="mt-3 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border">
                  <h4 className="text-sm font-semibold text-indigo-800 mb-1">Tecnologia Utilizzata</h4>
                  <p className="text-xs text-indigo-600">{analysisDetails.analysisTechnology || 'Analisi AI Avanzata'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4">
        <ActionButtons
          onStartNewAnalysis={onStartNewAnalysis}
          onSaveDiagnosis={handleSaveDiagnosis}
          onChatWithExpert={handleChatWithExpert}
          onPayAndSendDiagnosis={handlePayAndSendDiagnosis}
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
