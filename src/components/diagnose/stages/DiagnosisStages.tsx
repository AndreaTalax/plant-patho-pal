import React from 'react';
import { getSymptomsAsString, convertPlantInfoToString } from '@/utils/plantInfoUtils';
import { usePlantInfo } from '@/context/PlantInfoContext';
import { usePremiumStatus } from '@/services/premiumService';
import PlantInfoForm from '../PlantInfoForm';
import PlantInfoSummary from '../PlantInfoSummary';
import DiagnosisOptions from '../DiagnosisOptions';
import ScanLayout from '../scan/ScanLayout';
import DiagnosisResult from '../result/DiagnosisResult';
import CameraCapture from '../CameraCapture';
import { DiagnosedDisease } from '../types';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { PlantDataSyncService } from '@/services/chat/plantDataSyncService';
import { AutoExpertNotificationService } from '@/components/chat/AutoExpertNotificationService';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface DiagnosisStagesProps {
  stage: 'info' | 'capture' | 'options' | 'result';
  showCamera: boolean;
  uploadedImage: string | null;
  isAnalyzing: boolean;
  diagnosedDisease: DiagnosedDisease | null;
  analysisDetails: any;
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  onPlantInfoComplete: (data: any) => void;
  onPlantInfoEdit: () => void;
  onSelectAI: () => void;
  onSelectExpert: () => void;
  onTakePhoto: () => void;
  onUploadPhoto: () => void;
  onCapture: (imageDataUrl: string) => void;
  onCancelCamera: () => void;
  onStartNewAnalysis: () => void;
  onChatWithExpert?: () => void;
}

const DiagnosisStages: React.FC<DiagnosisStagesProps> = ({
  stage,
  showCamera,
  uploadedImage,
  isAnalyzing,
  diagnosedDisease,
  analysisDetails,
  videoRef,
  canvasRef,
  onPlantInfoComplete,
  onPlantInfoEdit,
  onSelectAI,
  onSelectExpert,
  onTakePhoto,
  onUploadPhoto,
  onCapture,
  onCancelCamera,
  onStartNewAnalysis,
  onChatWithExpert
}) => {
  const { plantInfo } = usePlantInfo();
  const { hasAIAccess, hasExpertChatAccess } = usePremiumStatus();
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  // Enhanced function to handle expert consultation with automatic data sending
  const handleExpertConsultation = async () => {
    if (!userProfile?.id) {
      toast.error('Devi essere autenticato per contattare l\'esperto');
      return;
    }

    // Controlla se l'utente ha accesso premium alla chat esperto
    if (!hasExpertChatAccess) {
      toast.error('La chat con l\'esperto richiede un abbonamento Premium');
      return;
    }

    console.log("🩺 Avvio consulenza esperto con invio automatico dati...");
    
    try {
      // Se ci sono risultati dell'analisi AI, usa il servizio di notifica esperto
      if (diagnosedDisease && uploadedImage) {
        console.log('📨 Invio diagnosi AI all\'esperto...');
        
        const diagnosisData = {
          plantType: plantInfo.name || 'Pianta non identificata',
          plantVariety: '',
          symptoms: plantInfo.symptoms.join(', '),
          imageUrl: uploadedImage,
          analysisResult: {
            plantName: diagnosedDisease.name,
            scientificName: diagnosedDisease.scientificName,
            diseases: diagnosedDisease.disease ? [diagnosedDisease.disease] : [],
            recommendations: diagnosedDisease.treatments || []
          },
          confidence: diagnosedDisease.confidence || 0,
          isHealthy: diagnosedDisease.healthy || false
        };

        const success = await AutoExpertNotificationService.sendDiagnosisToExpert(
          userProfile.id,
          diagnosisData
        );

        if (!success) {
          throw new Error('Errore nell\'invio della diagnosi');
        }
      } else {
        // Altrimenti, usa il servizio di sincronizzazione dati base
        console.log('📤 Invio dati pianta all\'esperto...');
        
        const result = await PlantDataSyncService.syncPlantDataToChat(
          userProfile.id,
          plantInfo,
          uploadedImage || undefined
        );

        if (!result.success) {
          throw new Error('Errore nella sincronizzazione dati');
        }
      }

      toast.success('Consultazione avviata!', {
        description: 'I dati della pianta sono stati inviati all\'esperto',
        duration: 3000
      });

      navigate('/', { replace: true });
      setTimeout(() => {
        const event = new CustomEvent('switchTab', { detail: 'chat' });
        window.dispatchEvent(event);
      }, 100);
    } catch (error) {
      console.error('❌ Errore nella consulenza esperto:', error);
      toast.error('Errore nell\'invio dei dati all\'esperto');
    }
  };

  const handleNavigateToChat = () => {
    console.log("🔄 Navigating to chat with data sync...");
    
    if (onChatWithExpert) {
      onChatWithExpert();
    } else {
      // Navigate to homepage and switch to chat tab
      navigate('/');
      setTimeout(() => {
        console.log("🔄 Triggering chat tab switch...");
        const event = new CustomEvent('switchTab', { detail: 'chat' });
        window.dispatchEvent(event);
        
        // Also refresh the chat to ensure latest data is shown
        setTimeout(() => {
          const refreshEvent = new CustomEvent('refreshChat');
          window.dispatchEvent(refreshEvent);
        }, 200);
      }, 100);
    }
  };

  if (showCamera) {
    return (
      <CameraCapture 
        onCapture={onCapture} 
        onCancel={onCancelCamera}
      />
    );
  }

  if (stage === 'info') {
    return <PlantInfoForm onComplete={onPlantInfoComplete} />;
  }

  if (stage === 'capture') {
    return (
      <>
        <PlantInfoSummary 
          plantInfo={convertPlantInfoToString(plantInfo)}
          onEdit={onPlantInfoEdit}
        />

        <ScanLayout
          isAnalyzing={false}
          plantInfo={convertPlantInfoToString(plantInfo)}
          uploadedImage={null}
        />
      </>
    );
  }

  if (stage === 'options') {
    return (
      <>
        <PlantInfoSummary 
          plantInfo={convertPlantInfoToString(plantInfo)}
          onEdit={onPlantInfoEdit}
        />

        {uploadedImage && (
          <div className="w-full max-w-md mx-auto mb-6">
            <div className="aspect-square overflow-hidden rounded-xl border">
              <img 
                src={uploadedImage} 
                alt="Immagine caricata" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        <DiagnosisOptions
          onSelectAI={onSelectAI}
          onSelectExpert={onSelectExpert}
          hasAIAccess={hasAIAccess}
        />
      </>
    );
  }

  if (stage === 'result') {
    // Enhanced expert consultation result display with automatic data sending confirmation
    if (plantInfo.sendToExpert && !plantInfo.useAI) {
      return (
        <div className="space-y-4">
          <PlantInfoSummary 
            plantInfo={convertPlantInfoToString(plantInfo)}
            onEdit={onPlantInfoEdit}
          />
          
          <div className="border rounded-lg p-4 bg-white shadow">
            <h3 className="font-medium text-lg mb-3 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                <path d="M20 6 9 17l-5-5"></path>
              </svg>
              Dati inviati automaticamente al fitopatologo
            </h3>
            
            {uploadedImage && (
              <div className="aspect-square w-full max-w-xs mx-auto overflow-hidden rounded-xl mb-4 border-2 border-green-200">
                <img 
                  src={uploadedImage} 
                  alt="Immagine inviata automaticamente" 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 my-4">
              <div className="flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600 mt-0.5 flex-shrink-0">
                  <path d="M20 6 9 17l-5-5"></path>
                </svg>
                <div>
                  <p className="text-green-800 font-medium">
                    Tutti i dati sono stati inviati con successo!
                  </p>
                  <p className="text-green-700 text-sm mt-1">
                    Il fitopatologo ha ricevuto: informazioni della pianta, sintomi, foto e analisi AI (se disponibile).
                  </p>
                </div>
              </div>
            </div>
            
            {/* Show what was sent automatically */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <h4 className="font-medium text-blue-800 mb-2 text-sm">📋 Dati inviati automaticamente:</h4>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>✅ Informazioni della pianta (ambiente, irrigazione, luce)</li>
                <li>✅ Descrizione dettagliata dei sintomi</li>
                <li>✅ Fotografia della pianta</li>
                {diagnosedDisease && <li>✅ Risultati dell'analisi AI preliminare</li>}
                <li>✅ Richiesta di consulenza professionale</li>
              </ul>
            </div>
            
            <div className="space-y-3 mt-4">
              <button 
                onClick={handleNavigateToChat}
                className="w-full bg-drplant-blue hover:bg-drplant-blue-dark text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                <span>Vai alla chat con il fitopatologo</span>
              </button>
              
              <button 
                onClick={onStartNewAnalysis} 
                className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                </svg>
                <span>Inizia nuova analisi</span>
              </button>
            </div>
          </div>
        </div>
      );
    }
    
    // Regular AI diagnosis result with enhanced expert chat integration
    return (
      <>
        <PlantInfoSummary 
          plantInfo={convertPlantInfoToString(plantInfo)}
          onEdit={onPlantInfoEdit}
        />
        
        <DiagnosisResult
          imageSrc={uploadedImage || ''}
          plantInfo={convertPlantInfoToString(plantInfo)}
          analysisData={diagnosedDisease}
          isAnalyzing={isAnalyzing}
          onStartNewAnalysis={onStartNewAnalysis}
          onChatWithExpert={handleExpertConsultation}
          analysisDetails={analysisDetails}
        />
      </>
    );
  }

  return null;
};

export default DiagnosisStages;
