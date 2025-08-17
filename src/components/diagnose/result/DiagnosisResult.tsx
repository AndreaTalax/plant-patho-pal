import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlantIdentificationDisplay } from '../PlantIdentificationDisplay';
import { 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  MessageCircle,
  Users,
  Clock,
  Lightbulb,
  Shield,
  Database
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { PlantDataSyncService } from '@/services/chat/plantDataSyncService';
import { AutoExpertNotificationService } from '@/components/chat/AutoExpertNotificationService';
import { PaymentRequiredModal } from '@/components/subscription/PaymentRequiredModal';
import { toast } from 'sonner';
import ImageDisplay from './ImageDisplay';
import PlantInfoCard from './PlantInfoCard';
import EppoDataPanel from './EppoDataPanel';
import ProductSuggestions from './ProductSuggestions';

interface DiagnosisResultProps {
  imageSrc: string;
  plantInfo: any;
  analysisData: any;
  isAnalyzing: boolean;
  onStartNewAnalysis: () => void;
  onChatWithExpert?: () => void;
  analysisDetails?: any;
}

const DiagnosisResult: React.FC<DiagnosisResultProps> = ({
  imageSrc,
  plantInfo,
  analysisData,
  isAnalyzing,
  onStartNewAnalysis,
  onChatWithExpert,
  analysisDetails
}) => {
  const { userProfile, hasActiveSubscription } = useAuth();
  const [dataSentToExpert, setDataSentToExpert] = useState(false);
  const [sendingToExpert, setSendingToExpert] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Function to safely display probability percentages
  const getProbabilityDisplay = (probability: number | undefined | null): string => {
    if (probability === undefined || probability === null || isNaN(probability)) {
      return "N/A";
    }
    // Handle both 0-1 range and 0-100 range
    const percent = probability <= 1 ? probability * 100 : probability;
    return `${Math.round(percent)}%`;
  };

  const handleSendToExpert = async () => {
    if (!userProfile?.id || dataSentToExpert) {
      return;
    }

    // Controllo ruolo amministratore (accesso libero)
    const isAdmin = userProfile?.role === 'admin';
    
    // Controllo abbonamento per utenti non-admin
    if (!isAdmin && !hasActiveSubscription()) {
      setShowPaymentModal(true);
      return;
    }

    setSendingToExpert(true);
    
    try {
      console.log('📨 Invio dati completi all\'esperto...');
      
      // Sincronizza i dati della pianta
      const synced = await PlantDataSyncService.syncPlantDataToChat(
        userProfile.id,
        plantInfo,
        imageSrc
      );

      if (synced) {
        // Se ci sono risultati AI, inviali anche
        if (analysisData) {
          const diagnosisData = {
            plantType: analysisData.plantName || analysisData.name || 'Pianta non identificata',
            plantVariety: analysisData.scientificName || analysisData.variety,
            symptoms: plantInfo.symptoms || 'Risultati analisi AI',
            imageUrl: imageSrc,
            analysisResult: analysisData,
            confidence: analysisData.confidence || analysisDetails?.confidence || 0,
            isHealthy: analysisData.isHealthy || analysisData.healthy || false,
            plantInfo: {
              environment: plantInfo.isIndoor ? 'Interno' : 'Esterno',
              watering: plantInfo.wateringFrequency,
              lightExposure: plantInfo.lightExposure,
              symptoms: plantInfo.symptoms
            }
          };

          await AutoExpertNotificationService.sendDiagnosisToExpert(
            userProfile.id,
            diagnosisData
          );
        }

        setDataSentToExpert(true);
        toast.success('Tutti i dati inviati all\'esperto!', {
          description: 'Analisi AI + dati pianta + foto inviati a Marco Nigro'
        });

        // Naviga alla chat immediatamente
        if (onChatWithExpert) {
          onChatWithExpert();
        } else {
          if (userProfile?.role === 'expert' || userProfile?.role === 'admin') {
            window.dispatchEvent(new CustomEvent('switchTab', { detail: 'expert' }));
          } else {
            window.dispatchEvent(new CustomEvent('switchTab', { detail: 'chat' }));
          }
        }
      } else {
        toast.error('Errore nell\'invio all\'esperto');
      }
    } catch (error) {
      console.error('❌ Errore invio all\'esperto:', error);
      toast.error('Errore nell\'invio all\'esperto');
    } finally {
      setSendingToExpert(false);
    }
  };

  const handleNavigateToChat = () => {
    console.log("🔄 Navigating from DiagnosisResult to chat...");
    console.log("🔄 User profile:", userProfile);
    console.log("🔄 User profile role:", userProfile?.role);
    console.log("🔄 onChatWithExpert function:", typeof onChatWithExpert);
    console.log("🔄 Window object available:", typeof window);
    
    try {
      if (onChatWithExpert && typeof onChatWithExpert === 'function') {
        console.log("🎯 Using onChatWithExpert callback");
        onChatWithExpert();
      } else {
        console.log("🎯 Using window event dispatch");
        // Navigazione diretta senza delay con più logging
        if (userProfile?.role === 'expert' || userProfile?.role === 'admin') {
          console.log("🎯 Master account - switching to expert tab");
          console.log("🎯 Creating event: switchTab with detail: expert");
          const event = new CustomEvent('switchTab', { detail: 'expert' });
          console.log("🎯 Event created:", event);
          console.log("🎯 Event detail:", event.detail);
          window.dispatchEvent(event);
          console.log("🎯 Event dispatched successfully to window");
        } else {
          console.log("🎯 Regular user - switching to chat tab");
          console.log("🎯 Creating event: switchTab with detail: chat");
          const event = new CustomEvent('switchTab', { detail: 'chat' });
          console.log("🎯 Event created:", event);
          console.log("🎯 Event detail:", event.detail);
          window.dispatchEvent(event);
          console.log("🎯 Event dispatched successfully to window");
        }
        
        // Aggiungi un toast per confermare e delay per debug
        console.log("🎯 Adding success toast");
        toast.success("Navigazione in corso...", {
          description: "Apertura chat con l'esperto"
        });
        
        // Aggiungi un console log aggiuntivo dopo un delay per verificare
        setTimeout(() => {
          console.log("🎯 Navigation attempt completed after 1 second");
        }, 1000);
      }
    } catch (error) {
      console.error("❌ Navigation error:", error);
      toast.error("Errore nella navigazione alla chat");
    }
  };

  if (isAnalyzing) {
    return (
      <div className="text-center space-y-4 py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-drplant-blue mx-auto"></div>
        <p className="text-gray-600">Analisi avanzata in corso con database EPPO...</p>
      </div>
    );
  }

  // Prima definisco le variabili base con correzione accuratezza
  const rawConfidence = analysisData?.confidence || analysisDetails?.confidence || 0.5;
  // Assicurati che l'accuratezza sia sempre tra 0-70% (cap richiesto)
  const computedPercent = Math.min(100, Math.max(0, 
    rawConfidence > 1 ? Math.round(rawConfidence) : Math.round(rawConfidence * 100)
  ));
  const confidencePercent = Math.min(70, computedPercent);

  const isHealthy = analysisData?.isHealthy || analysisData?.healthy || false;
  const isHighConfidence = rawConfidence >= 0.7;
  const isLowConfidence = rawConfidence < 0.5;
  const hasEppoData = analysisDetails?.eppoResultsCount > 0;

  // Poi definisco le funzioni helper che usano le variabili sopra
  const getPlantInfo = () => {
    const sources = [
      analysisData?.plant?.name,
      analysisData?.plantName,
      analysisData?.name,
      analysisDetails?.plantIdentification,
      analysisDetails?.multiServiceInsights?.plantName,
      analysisDetails?.eppoPlantIdentification?.preferredName,
      analysisData?.species,
      analysisData?.label
    ];
    
    // Filtra i placeholder generici e cerca nomi più specifici
    const filteredSources = sources.filter(name => 
      name && 
      name.trim() && 
      name !== 'Unknown' && 
      name !== 'Pianta identificata tramite Multi-AI' &&
      name !== 'Plant' &&
      name !== 'plant' &&
      !name.toLowerCase().includes('identified') &&
      !name.toLowerCase().includes('tramite') &&
      !name.toLowerCase().includes('multi-ai')
    );
    
    let plantName = filteredSources[0] || 'Specie da identificare';
    
    // Se il nome contiene codici o è troppo tecnico, prova a pulirlo
    if (plantName && typeof plantName === 'string') {
      // Rimuovi codici tra parentesi tipo "(EPPO: ABCDE)"
      plantName = plantName.replace(/\(EPPO:.*?\)/gi, '').trim();
      // Capitalizza la prima lettera
      plantName = plantName.charAt(0).toUpperCase() + plantName.slice(1);
    }
    
    const scientificSources = [
      analysisData?.plant?.scientific_name,
      analysisData?.scientificName,
      analysisDetails?.scientificName,
      analysisDetails?.multiServiceInsights?.plantSpecies,
      analysisData?.variety,
      analysisDetails?.eppoPlantIdentification?.scientificName
    ];
    
    const scientificName = scientificSources.find(name => name && name.trim());
    
    return { plantName, scientificName };
  };

  const getDiseaseInfo = () => {
    let diseases: any[] = [];
    
    // Cerca malattie in vari formati
    if (analysisData?.diseases && Array.isArray(analysisData.diseases)) {
      diseases = analysisData.diseases;
    } else if (analysisData?.disease) {
      diseases = [analysisData.disease];
    } else if (analysisDetails?.risultatiCompleti?.detectedDiseases) {
      diseases = analysisDetails.risultatiCompleti.detectedDiseases;
    } else if (analysisData?.predictions && Array.isArray(analysisData.predictions)) {
      diseases = analysisData.predictions.map(pred => ({ name: pred.class || pred.label, probability: pred.probability || pred.confidence }));
    } else if (analysisData?.label && !analysisData.isHealthy) {
      diseases = [{ name: analysisData.label, probability: analysisData.confidence || 0.5 }];
    }
    
    // Se non trova malattie specifiche ma la pianta non è sana, crea una diagnosi generica
    if (diseases.length === 0 && analysisData && !isHealthy) {
      diseases = [{ 
        name: 'Possibile problema rilevato', 
        probability: analysisData.confidence || 0.5,
        description: "L'analisi AI ha rilevato possibili anomalie che richiedono ulteriore valutazione"
      }];
    }
    
    return diseases;
  };

  // Stima area colpita dalla lista sintomi o da campi dedicati
  const getAffectedAreaFromSymptoms = (d: any): string => {
    if (d?.affectedArea) return d.affectedArea;
    const text = [
      ...(Array.isArray(d?.symptoms) ? d.symptoms : []),
      d?.description || '',
    ].join(' ').toLowerCase();
    if (/margini|bord/i.test(text)) return 'Margini fogliari';
    if (/macchi|chiazze|necrosi|foglia|foglie/i.test(text)) return 'Foglie';
    if (/punta|apice/i.test(text)) return 'Punte foglie';
    if (/stelo|fusto|tronco/i.test(text)) return 'Fusto/Stelo';
    if (/radic/i.test(text)) return 'Radici';
    if (/frutt|bacca/i.test(text)) return 'Frutti';
    return 'Intera pianta';
  };
  // Infine chiamo le funzioni
  const { plantName, scientificName } = getPlantInfo();
  const diseaseList = getDiseaseInfo();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Enhanced Header risultati */}
      <Card className={`border-2 ${isHealthy && isHighConfidence ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3">
              {isHealthy ? (
                <CheckCircle className="h-6 w-6 text-green-600" />
              ) : (
                <AlertTriangle className="h-6 w-6 text-amber-600" />
              )}
              <span>Diagnosi Avanzata Completata</span>
              {hasEppoData && (
                <Badge className="bg-blue-100 text-blue-800 border border-blue-300">
                  <Database className="h-3 w-3 mr-1" />
                  EPPO Enhanced
                </Badge>
              )}
            </CardTitle>
            {confidencePercent > 0 && (
              <Badge variant={isHighConfidence ? "default" : isLowConfidence ? "destructive" : "secondary"}>
                {confidencePercent}% accuratezza
              </Badge>
            )}
          </div>
          {hasEppoData && (
            <p className="text-sm text-blue-700 mt-2">
              Diagnosi potenziata con database europeo EPPO per maggiore precisione
            </p>
          )}
        </CardHeader>
      </Card>

      {/* EPPO Data Panel - Show if enhanced analysis was performed */}
      {hasEppoData && (
        <EppoDataPanel 
          analysisDetails={analysisDetails}
          userInput={plantInfo?.symptoms}
          eppoData={analysisData?.diseases?.filter(d => d.eppoCode) || []}
        />
      )}

      {/* SEZIONE IDENTIFICAZIONE PIANTA - Nuova sezione */}
      {analysisDetails?.plantIdentification && (
        <PlantIdentificationDisplay 
          identification={analysisDetails.plantIdentification}
          className="mb-6"
        />
      )}

      {/* Immagine e info pianta */}
      <div className="grid md:grid-cols-2 gap-6">
        <ImageDisplay imageSrc={imageSrc} isHealthy={isHealthy} />
        <PlantInfoCard plantInfo={plantInfo} analysisDetails={analysisDetails} />
      </div>

      {/* SEZIONE RISULTATI PRINCIPALI - BEN VISIBILE */}
      <Card className="border-2 border-green-500 bg-gradient-to-r from-green-50 to-blue-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl font-bold text-center text-gray-800">
            🔬 Risultati Diagnosi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Nome pianta - Molto visibile */}
          <div className="text-center p-4 bg-white rounded-lg border-2 border-green-300 shadow-sm">
            <h2 className="text-2xl font-bold text-green-800 mb-2">
              🌱 {plantName}
            </h2>
            {scientificName && scientificName !== plantName && (
              <p className="text-lg italic text-green-700 font-medium">
                {scientificName}
              </p>
            )}
            {/* Mostra famiglia se disponibile */}
            {analysisDetails?.multiServiceInsights?.family && (
              <p className="text-sm text-green-600 mt-1">
                Famiglia: {analysisDetails.multiServiceInsights.family}
              </p>
            )}
          </div>

          {/* Problemi rilevati - Sezione migliorata con dettagli malattia */}
          {diseaseList && diseaseList.length > 0 && !isHealthy && (
            <div className="text-center p-4 bg-white rounded-lg border-2 border-red-300 shadow-sm">
              <h3 className="text-xl font-bold text-red-800 mb-3">
                🔬 Diagnosi Dettagliata
              </h3>
              <div className="space-y-4">
                {diseaseList.slice(0, 3).map((disease: any, index: number) => (
                  <div key={index} className="border border-red-200 rounded-lg p-4 bg-red-50 text-left">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-bold text-red-900 text-lg flex-1">{disease.name}</h4>
                      <Badge variant="destructive" className="text-sm px-2 py-1 ml-2">
                        {getProbabilityDisplay(disease.probability)}
                      </Badge>
                    </div>
                    
                    {/* Descrizione malattia */}
                    {disease.description && (
                      <div className="mb-3">
                        <h5 className="font-semibold text-red-800 text-sm mb-1">📋 Descrizione:</h5>
                        <p className="text-red-700 text-sm">{disease.description}</p>
                      </div>
                    )}
                    
                    {/* Zona colpita */}
                    <div className="mb-3">
                      <h5 className="font-semibold text-amber-800 text-sm mb-1">🗺️ Zona colpita:</h5>
                      <p className="text-amber-800 text-sm">{getAffectedAreaFromSymptoms(disease)}</p>
                    </div>
                    
                    {/* Sintomi */}
                    {disease.symptoms && Array.isArray(disease.symptoms) && disease.symptoms.length > 0 && (
                      <div className="mb-3">
                        <h5 className="font-semibold text-red-800 text-sm mb-1">⚠️ Sintomi:</h5>
                        <ul className="text-red-700 text-sm list-disc list-inside">
                          {disease.symptoms.slice(0, 4).map((symptom: string, idx: number) => (
                            <li key={idx}>{symptom}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Trattamenti */}
                    {disease.treatments && Array.isArray(disease.treatments) && disease.treatments.length > 0 && (
                      <div className="mb-3">
                        <h5 className="font-semibold text-green-800 text-sm mb-1">💊 Trattamenti raccomandati:</h5>
                        <ul className="text-green-700 text-sm list-disc list-inside">
                          {disease.treatments.slice(0, 3).map((treatment: string, idx: number) => (
                            <li key={idx}>{treatment}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Trattamento singolo (fallback) */}
                    {disease.treatment && !Array.isArray(disease.treatments) && (
                      <div className="mb-3">
                        <h5 className="font-semibold text-green-800 text-sm mb-1">💡 Trattamento:</h5>
                        <p className="text-green-700 text-sm">{disease.treatment}</p>
                      </div>
                    )}

                    {/* Prodotti consigliati */}
                    <div className="mt-3">
                      <h5 className="font-semibold text-green-900 text-sm mb-2">🧴 Prodotti consigliati:</h5>
                      <ProductSuggestions diseaseName={disease.name} />
                    </div>

                    {/* Disclaimer se malattia è seria */}
                    {disease.disclaimer && (
                      <div className="mt-3 p-2 bg-yellow-100 border border-yellow-300 rounded text-xs text-yellow-800">
                        <strong>⚠️ Importante:</strong> {disease.disclaimer}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pianta sana - Messaggio ottimizzato */}
          {isHealthy && (
            <div className="text-center p-4 bg-white rounded-lg border-2 border-green-300 shadow-sm">
              <h3 className="text-xl font-bold text-green-800 mb-2">
                ✅ Pianta in Ottima Salute
              </h3>
              <p className="text-green-700">
                L'analisi non ha rilevato problemi significativi. Continua con le cure attuali.
              </p>
            </div>
          )}

          {/* Stato salute generale */}
          <div className={`text-center p-3 rounded-lg ${isHealthy ? 'bg-green-100 border-2 border-green-300' : 'bg-amber-100 border-2 border-amber-300'}`}>
            <div className="flex justify-center items-center gap-2">
              {isHealthy ? (
                <CheckCircle className="h-6 w-6 text-green-600" />
              ) : (
                <AlertTriangle className="h-6 w-6 text-amber-600" />
              )}
              <span className={`text-lg font-semibold ${isHealthy ? 'text-green-800' : 'text-amber-800'}`}>
                {isHealthy ? '✅ Pianta in salute' : '⚠️ Attenzione richiesta'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sezione Istruzioni di Cura Specifiche */}
      {analysisData?.careInstructions && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🌱 Istruzioni di Cura Specifiche
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysisData.careInstructions.watering && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-800 mb-2">💧 Irrigazione</h4>
                  <p className="text-sm text-blue-700">{analysisData.careInstructions.watering}</p>
                </div>
              )}
              {analysisData.careInstructions.light && (
                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <h4 className="font-medium text-yellow-800 mb-2">☀️ Luce</h4>
                  <p className="text-sm text-yellow-700">{analysisData.careInstructions.light}</p>
                </div>
              )}
              {analysisData.careInstructions.temperature && (
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <h4 className="font-medium text-purple-800 mb-2">🌡️ Temperatura</h4>
                  <p className="text-sm text-purple-700">{analysisData.careInstructions.temperature}</p>
                </div>
              )}
              {analysisData.careInstructions.fertilization && (
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="font-medium text-green-800 mb-2">🌿 Fertilizzazione</h4>
                  <p className="text-sm text-green-700">{analysisData.careInstructions.fertilization}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sezione Raccomandazioni Dettagliate */}
      {(analysisData?.recommendations?.immediate?.length > 0 || analysisData?.recommendations?.longTerm?.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-600" />
              Raccomandazioni Dettagliate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {analysisData.recommendations.immediate && analysisData.recommendations.immediate.length > 0 && (
                <div>
                  <h4 className="font-medium text-orange-800 mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Azioni Immediate
                  </h4>
                  <ul className="space-y-2">
                    {analysisData.recommendations.immediate.map((rec: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></span>
                        <span className="text-sm text-gray-700">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {analysisData.recommendations.longTerm && analysisData.recommendations.longTerm.length > 0 && (
                <div>
                  <h4 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Cura Lungo Termine
                  </h4>
                  <ul className="space-y-2">
                    {analysisData.recommendations.longTerm.map((rec: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                        <span className="text-sm text-gray-700">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sezione Problemi Specifici con Dettagli */}
      {analysisData?.healthAnalysis?.issues && analysisData.healthAnalysis.issues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Analisi Problemi Specifici
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analysisData.healthAnalysis.issues.map((issue: any, index: number) => (
                <div key={index} className="border rounded-lg p-4 bg-gradient-to-r from-amber-50 to-red-50">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-amber-900">{issue.name}</h4>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-xs">
                        {issue.type}
                      </Badge>
                      <Badge 
                        variant={issue.severity === 'high' ? 'destructive' : issue.severity === 'medium' ? 'secondary' : 'default'}
                        className="text-xs"
                      >
                        {issue.severity === 'high' ? 'Alta' : issue.severity === 'medium' ? 'Media' : 'Bassa'}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {Math.round((issue.confidence || 0) * 100)}%
                      </Badge>
                    </div>
                  </div>
                  
                  {issue.description && (
                    <p className="text-sm text-gray-700 mb-3">{issue.description}</p>
                  )}
                  
                  {issue.symptoms && issue.symptoms.length > 0 && (
                    <div className="mb-3">
                      <h5 className="font-medium text-sm text-gray-800 mb-1">Sintomi:</h5>
                      <div className="flex flex-wrap gap-1">
                        {issue.symptoms.map((symptom: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {symptom}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {issue.treatment && issue.treatment.length > 0 && (
                    <div>
                      <h5 className="font-medium text-sm text-green-800 mb-2">Trattamenti Consigliati:</h5>
                      <ul className="space-y-1">
                        {issue.treatment.map((treatment: string, idx: number) => (
                          <li key={idx} className="text-sm text-green-700 flex items-start gap-2">
                            <span className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 flex-shrink-0"></span>
                            {treatment}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}



      {/* Pulsanti azione */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Invia all'Esperto - SEMPRE PRESENTE */}
        <Card className="border-2 border-drplant-green">
          <CardContent className="p-4">
            <div className="flex items-start gap-3 mb-3">
              <Users className="h-5 w-5 text-drplant-green mt-0.5" />
              <div>
                <h3 className="font-semibold text-drplant-green">Consulenza Esperto</h3>
                <p className="text-sm text-gray-600">
                  {analysisData ? 'Invia risultati AI + dati al fitopatologo' : 'Invia dati al fitopatologo'}
                </p>
              </div>
            </div>
            
            {dataSentToExpert ? (
              <div className="text-center py-2">
                <div className="flex items-center justify-center gap-2 text-green-600 mb-2">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Dati inviati!</span>
                </div>
                <Button 
                  onClick={handleNavigateToChat}
                  className="w-full bg-drplant-green hover:bg-drplant-green-dark"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Vai alla Chat
                </Button>
              </div>
            ) : (
              <Button 
                onClick={handleSendToExpert}
                disabled={sendingToExpert}
                className="w-full bg-drplant-green hover:bg-drplant-green-dark"
              >
                {sendingToExpert ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Invio...
                  </>
                ) : (
                  <>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Invia all'Esperto
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Nuova Analisi */}
        <Card className="border-2 border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3 mb-3">
              <RefreshCw className="h-5 w-5 text-gray-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-800">Nuova Analisi</h3>
                <p className="text-sm text-gray-600">Analizza un'altra pianta</p>
              </div>
            </div>
            
            <Button 
              onClick={onStartNewAnalysis}
              variant="outline"
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Analizza Altra Pianta
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced warning for low confidence or regulated organisms */}
      {(isLowConfidence || analysisData?.diseases?.some((d: any) => d.isRegulated)) && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-800">
                  {analysisData?.diseases?.some((d: any) => d.isRegulated) 
                    ? 'Organismi Regolamentati Rilevati - Consulenza Urgente' 
                    : 'Consulenza Esperto Raccomandata'}
                </h3>
                <p className="text-sm text-amber-700">
                  {analysisData?.diseases?.some((d: any) => d.isRegulated)
                    ? 'Sono stati rilevati possibili organismi regolamentati EPPO. È necessaria una consulenza fitopatologo urgente e possibile notifica alle autorità competenti.'
                    : `L'analisi AI ha una accuratezza del ${confidencePercent}%. Ti consigliamo di consultare il nostro fitopatologo per una diagnosi più precisa.`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Required Modal */}
      <PaymentRequiredModal 
        open={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSubscribed={() => {
          setShowPaymentModal(false);
          toast.success('Abbonamento attivato! Invio dati all\'esperto...');
          // Dopo il pagamento, invia automaticamente i dati all'esperto
          setTimeout(() => {
            handleSendToExpert();
          }, 1500);
        }}
      />
    </div>
  );
};

export default DiagnosisResult;
