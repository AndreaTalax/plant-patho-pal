import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePremiumStatus } from '@/services/premiumService';
import { useSaveDiagnosis } from '@/hooks/useSaveDiagnosis';
import ImageDisplay from './ImageDisplay';
import PlantInfoCard from './PlantInfoCard';
import ActionButtons from './ActionButtons';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import ProductSuggestions from './ProductSuggestions';

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
  analysisData,
}) => {
  const { user } = useAuth();
  const { hasExpertChatAccess: premiumAccess } = usePremiumStatus();
  const { saveDiagnosis, isSaving: savingDiagnosis } = useSaveDiagnosis();

  const resolvedConfidence = confidence ?? 0;
  const resolvedIsHealthy = !!isHealthy;
  const resolvedSaveLoading = !!saveLoading || savingDiagnosis;
  const resolvedHasExpertChatAccess = premiumAccess;

  const effectiveDiagnosis = diagnosedDisease ?? analysisData;

  const handleSaveDiagnosis = async () => {
    if (!user) {
      toast.error('Devi essere autenticato per salvare la diagnosi');
      return;
    }

    try {
      const diagnosisToSave = {
        user_id: user.id,
        plant_type: plantInfo?.name || effectiveDiagnosis?.name || 'Pianta non identificata',
        plant_variety: analysisDetails?.multiServiceInsights?.plantSpecies || '',
        symptoms: JSON.stringify(
          Array.isArray(plantInfo?.symptoms)
            ? plantInfo.symptoms
            : plantInfo?.symptoms
            ? [plantInfo.symptoms]
            : ['Nessun sintomo specificato']
        ),
        image_url: imageSrc,
        diagnosis_result: effectiveDiagnosis || analysisDetails || {},
        status: 'completed',
      };

      const { data, error } = await supabase
        .from('diagnoses')
        .insert(diagnosisToSave)
        .select()
        .single();

      if (error) throw error;

      toast.success('Diagnosi salvata con successo!');
      return data;
    } catch (error: any) {
      toast.error('Errore nel salvataggio: ' + (error.message || 'Errore sconosciuto'));
    }
  };

  const finalSaveDiagnosis = onSaveDiagnosis || handleSaveDiagnosis;

  if (isAnalyzing) return <div className="text-center">Analisi in corso...</div>;
  if (!imageSrc) return <div className="text-center">Nessuna immagine da mostrare.</div>;

  const detectedDiseases =
    analysisDetails?.risultatiCompleti?.detectedDiseases ||
    plantInfo?.diagnosisResult?.diseases ||
    [];

  const diagnosisData = {
    plantType: plantInfo?.name || effectiveDiagnosis?.name || 'Pianta non identificata',
    plantVariety: analysisDetails?.multiServiceInsights?.plantSpecies || '',
    symptoms: plantInfo?.symptoms || 'Nessun sintomo specificato',
    imageUrl: imageSrc || '',
    analysisResult: effectiveDiagnosis || null,
    diagnosisResult: effectiveDiagnosis || null,
    confidence: resolvedConfidence,
    isHealthy: resolvedIsHealthy,
    plantInfo: plantInfo,
  };

  const handlePayAndSendDiagnosis = async () => {
    if (!user) {
      toast.error('Devi essere autenticato per procedere');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {});
      if (error) throw error;

      if (data?.url) {
        toast.success('Reindirizzamento al pagamento...', {
          description: 'Dopo il pagamento, la diagnosi sarà inviata automaticamente all\'esperto',
        });

        localStorage.setItem(
          'pendingDiagnosis',
          JSON.stringify({
            userId: user.id,
            diagnosisData,
            timestamp: Date.now(),
          })
        );

        window.open(data.url, '_blank');
      } else {
        throw new Error('URL checkout non ricevuto');
      }
    } catch (error) {
      toast.error('Errore durante il processo di pagamento.');
    }
  };

  const handleChatWithExpert = async () => {
    console.log('🗣️ Apertura chat con esperto (diagnosi AI già pronta)');
    if (!user) {
      toast.error('Devi essere autenticato per procedere');
      return;
    }

    if (!resolvedHasExpertChatAccess) {
      toast.error('Accesso Premium richiesto', {
        description: 'Acquista l\'abbonamento Premium per chattare con l\'esperto',
      });
      return;
    }

    try {
      // Nessun invio manuale: la diagnosi è già nel PlantInfoContext e verrà inviata automaticamente.
      toast.success('Apertura chat con l\'esperto...', {
        description: 'La diagnosi AI verrà inviata automaticamente in chat',
      });

      if (onChatWithExpert) await onChatWithExpert();
    } catch (error) {
      toast.error('Errore nell\'apertura della chat');
    }
  };

  // 👇 NUOVO: sincronizza automaticamente la diagnosi AI nel PlantInfoContext
  useEffect(() => {
    if (effectiveDiagnosis && plantInfo && !plantInfo.diagnosisResult) {
      plantInfo.diagnosisResult = { ...effectiveDiagnosis };
      console.log('✅ DiagnosisResult sincronizzato nel PlantInfoContext per invio automatico.');
    }
  }, [effectiveDiagnosis, plantInfo]);

  return (
    <div className="space-y-4 px-2 max-w-4xl mx-auto">
      {/* HEADER */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-100 to-blue-100 rounded-full mb-3">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-green-700 to-blue-700 bg-clip-text text-transparent">
            {resolvedIsHealthy ? '✅ Pianta Sana!' : '🔬 Risultati Analisi'}
          </h1>
        </div>
        <p className="text-gray-600">
          Analisi completata con successo usando AI multipla e database EPPO
        </p>
      </div>

      {/* IMMAGINE + INFO BASE */}
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

      {/* SEZIONE MALATTIE RILEVATE */}
      {detectedDiseases && detectedDiseases.length > 0 && (
        <div className="bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-xl shadow-lg border border-orange-200">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">⚠️</span>
            <h2 className="text-xl font-bold text-orange-800">
              Malattie Rilevate ({detectedDiseases.length})
            </h2>
          </div>
          
          <div className="space-y-4">
            {detectedDiseases.map((disease: any, index: number) => (
              <div key={index} className="bg-white p-4 rounded-lg border border-orange-200">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-lg text-red-700">{disease.name || disease.label}</h3>
                  {disease.confidence && (
                    <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                      {Math.round(disease.confidence * 100)}% confidenza
                    </span>
                  )}
                </div>
                
                {disease.description && (
                  <p className="text-sm text-gray-700 mb-3">{disease.description}</p>
                )}
                
                {disease.symptoms && disease.symptoms.length > 0 && (
                  <div className="mb-3">
                    <h4 className="font-semibold text-sm text-gray-800 mb-1">Sintomi:</h4>
                    <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                      {disease.symptoms.map((symptom: string, idx: number) => (
                        <li key={idx}>{symptom}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {disease.treatment && (
                  <div className="mb-3">
                    <h4 className="font-semibold text-sm text-gray-800 mb-1">Trattamento consigliato:</h4>
                    <p className="text-sm text-gray-700">{disease.treatment}</p>
                  </div>
                )}
                
                {/* Prodotti consigliati per questa malattia */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="font-semibold text-sm text-gray-800 mb-2">🛒 Prodotti consigliati:</h4>
                  <ProductSuggestions diseaseName={disease.name || disease.label} maxItems={3} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RESOCONTO FINALE - Incrocio tra foto e malattie */}
      {analysisDetails && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl shadow-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">📊</span>
            <h2 className="text-xl font-bold text-blue-800">Resoconto Finale Analisi</h2>
          </div>
          
          <div className="space-y-4">
            {/* Valutazione generale - Malattie specifiche rilevate */}
            <div className="bg-white p-4 rounded-lg border border-blue-200">
              <h3 className="font-bold text-lg text-blue-700 mb-3">Valutazione Generale - Possibili Malattie</h3>
              
              {/* Mostra prima i risultati EPPO se disponibili (database ufficiale) */}
              {analysisDetails?.risultatiCompleti?.eppoInfo?.diseases && 
               analysisDetails.risultatiCompleti.eppoInfo.diseases.length > 0 && (
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 mb-2 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                    <span className="text-lg">🔬</span>
                    <p className="text-sm font-semibold text-green-800">
                      Risultati dal Database EPPO (European Plant Protection Organization)
                    </p>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">
                    Basandosi sull'analisi visiva della foto e sul database EPPO, sono state identificate le seguenti malattie reali:
                  </p>
                  <ul className="space-y-3">
                    {analysisDetails.risultatiCompleti.eppoInfo.diseases.slice(0, 5).map((disease: any, index: number) => (
                      <li key={index} className="bg-gradient-to-r from-green-50 to-blue-50 p-3 rounded-lg border-l-4 border-green-500">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2 flex-1">
                            <span className="text-green-600 font-bold mt-0.5">{index + 1}.</span>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-gray-900">{disease.name}</span>
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                  {Math.round(disease.probability * 100)}% EPPO
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">Codice EPPO: {disease.eppoCode}</p>
                              {disease.description && (
                                <p className="text-sm text-gray-700 mt-2">{disease.description}</p>
                              )}
                              {disease.symptoms && disease.symptoms.length > 0 && (
                                <p className="text-xs text-gray-600 mt-2">
                                  <span className="font-semibold">Sintomi:</span> {disease.symptoms.slice(0, 3).join(', ')}
                                </p>
                              )}
                              {disease.regulatoryStatus && disease.regulatoryStatus.length > 0 && (
                                <div className="mt-2 flex items-center gap-1">
                                  <span className="text-xs font-semibold text-red-600">⚠️ Organismo regolamentato</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                  
                  {/* Mostra parassiti EPPO se presenti */}
                  {analysisDetails.risultatiCompleti.eppoInfo.pests && 
                   analysisDetails.risultatiCompleti.eppoInfo.pests.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm font-semibold text-orange-700 mb-2">🐛 Possibili parassiti identificati:</p>
                      <ul className="space-y-2">
                        {analysisDetails.risultatiCompleti.eppoInfo.pests.slice(0, 3).map((pest: any, index: number) => (
                          <li key={index} className="bg-orange-50 p-2 rounded-lg border border-orange-200 text-sm">
                            <span className="font-semibold">{pest.name}</span>
                            <span className="ml-2 text-gray-600">({Math.round(pest.probability * 100)}%)</span>
                            {pest.description && <p className="text-xs text-gray-600 mt-1">{pest.description}</p>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <div className="mt-3 pt-3 border-t border-gray-200 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="font-semibold">Affidabilità analisi:</span>
                      <span className="ml-1">{Math.round(resolvedConfidence)}%</span>
                    </div>
                    {analysisDetails.multiServiceInsights?.agreementScore && (
                      <div>
                        <span className="font-semibold">Concordanza AI:</span>
                        <span className="ml-1">{Math.round(analysisDetails.multiServiceInsights.agreementScore * 100)}%</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Se non ci sono risultati EPPO, mostra le malattie dall'AI */}
              {(!analysisDetails?.risultatiCompleti?.eppoInfo?.diseases || 
                analysisDetails.risultatiCompleti.eppoInfo.diseases.length === 0) && 
               detectedDiseases.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-700 mb-3">
                    Basandosi sull'analisi visiva della foto, sono state identificate le seguenti possibili malattie:
                  </p>
                  <ul className="space-y-2">
                    {detectedDiseases.map((disease: any, index: number) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <span className="text-red-600 font-bold mt-0.5">{index + 1}.</span>
                        <div className="flex-1">
                          <span className="font-semibold text-gray-900">{disease.name || disease.label}</span>
                          {disease.confidence && (
                            <span className="ml-2 text-gray-600">
                              (Confidenza: {Math.round(disease.confidence * 100)}%)
                            </span>
                          )}
                          {disease.symptoms && disease.symptoms.length > 0 && (
                            <p className="text-gray-600 mt-1 text-xs">
                              Sintomi principali: {disease.symptoms.slice(0, 2).join(', ')}
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 pt-3 border-t border-gray-200 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="font-semibold">Affidabilità analisi:</span>
                      <span className="ml-1">{Math.round(resolvedConfidence)}%</span>
                    </div>
                    {analysisDetails.multiServiceInsights?.agreementScore && (
                      <div>
                        <span className="font-semibold">Concordanza AI:</span>
                        <span className="ml-1">{Math.round(analysisDetails.multiServiceInsights.agreementScore * 100)}%</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {(!analysisDetails?.risultatiCompleti?.eppoInfo?.diseases || 
                analysisDetails.risultatiCompleti.eppoInfo.diseases.length === 0) && 
               detectedDiseases.length === 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-green-700">
                    ✅ Non sono state rilevate malattie evidenti nell'analisi della foto.
                  </p>
                  <p className="text-xs text-gray-600">
                    La pianta appare in buone condizioni di salute.
                  </p>
                </div>
              )}
            </div>

            {/* Analisi visiva */}
            {analysisDetails.multiServiceInsights && (
              <div className="bg-white p-4 rounded-lg border border-blue-200">
                <h3 className="font-bold text-lg text-blue-700 mb-2">🔍 Analisi Visiva dell'Immagine</h3>
                <div className="text-sm space-y-2">
                  {analysisDetails.multiServiceInsights.plantName && (
                    <p><span className="font-semibold">Pianta identificata:</span> {analysisDetails.multiServiceInsights.plantName}</p>
                  )}
                  {analysisDetails.multiServiceInsights.plantPart && (
                    <p><span className="font-semibold">Parte analizzata:</span> {analysisDetails.multiServiceInsights.plantPart}</p>
                  )}
                  {analysisDetails.multiServiceInsights.description && (
                    <p><span className="font-semibold">Osservazioni:</span> {analysisDetails.multiServiceInsights.description}</p>
                  )}
                </div>
              </div>
            )}

            {/* Raccomandazioni con prodotti */}
            <div className="bg-white p-4 rounded-lg border border-blue-200">
              <h3 className="font-bold text-lg text-blue-700 mb-3">💡 Raccomandazioni e Prodotti Utili</h3>
              {resolvedIsHealthy ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-700">
                    La pianta appare in buone condizioni. Continua con le cure attuali e monitora regolarmente per prevenire eventuali problemi.
                  </p>
                  <div className="pt-3 border-t border-gray-200">
                    <h4 className="font-semibold text-sm text-gray-800 mb-2">🛒 Prodotti per la manutenzione:</h4>
                    <ProductSuggestions 
                      diseaseName="manutenzione pianta sana" 
                      maxItems={4}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="font-semibold text-red-700 text-sm">La pianta richiede attenzione immediata:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                    {detectedDiseases.length > 0 && (
                      <li>Rilevate {detectedDiseases.length} possibile/i malattia/e</li>
                    )}
                    <li>Consulta i prodotti specifici consigliati qui sotto</li>
                    <li>Monitora l'evoluzione dei sintomi nei prossimi giorni</li>
                    <li>Per diagnosi approfondita, consulta un esperto</li>
                  </ul>
                  
                  <div className="pt-3 border-t border-gray-200">
                    <h4 className="font-semibold text-sm text-gray-800 mb-2">🛒 Prodotti consigliati per il trattamento:</h4>
                    
                    {/* Usa prima i risultati EPPO se disponibili */}
                    {analysisDetails?.risultatiCompleti?.eppoInfo?.diseases && 
                     analysisDetails.risultatiCompleti.eppoInfo.diseases.length > 0 ? (
                      <div className="space-y-3">
                        {analysisDetails.risultatiCompleti.eppoInfo.diseases.slice(0, 2).map((disease: any, index: number) => (
                          <div key={index} className="bg-gradient-to-br from-green-50 to-blue-50 p-3 rounded-lg border border-green-200">
                            <p className="text-xs font-semibold text-green-800 mb-2 flex items-center gap-1">
                              <span>🔬</span>
                              Per {disease.name} (EPPO):
                            </p>
                            <ProductSuggestions 
                              diseaseName={disease.name} 
                              maxItems={3}
                            />
                          </div>
                        ))}
                      </div>
                    ) : detectedDiseases.length > 0 ? (
                      <div className="space-y-3">
                        {detectedDiseases.slice(0, 2).map((disease: any, index: number) => (
                          <div key={index} className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-xs font-semibold text-gray-700 mb-2">
                              Per {disease.name || disease.label}:
                            </p>
                            <ProductSuggestions 
                              diseaseName={disease.name || disease.label}
                              maxItems={3}
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <ProductSuggestions 
                        diseaseName="trattamento generale piante"
                        maxItems={4}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mt-4">
        <ActionButtons
          onStartNewAnalysis={onStartNewAnalysis}
          onSaveDiagnosis={finalSaveDiagnosis}
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
