
import React from 'react';
import { usePlantInfo } from '@/context/PlantInfoContext';
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
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  // Semplice navigazione alla chat - SENZA logica di invio
  const handleNavigateToChat = () => {
    console.log("🔄 Navigating to chat...");
    
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

  // Funzione per invio completo all'esperto - CON TUTTA LA LOGICA
  const handleSendToExpertWithData = async () => {
    if (!userProfile?.id) {
      toast.error('Devi essere autenticato per contattare l\'esperto');
      return;
    }

    console.log("🩺 Invio completo dati all'esperto...");
    
    try {
      // First sync plant data using PlantDataSyncService
      const synced = await PlantDataSyncService.syncPlantDataToChat(
        userProfile.id,
        plantInfo,
        uploadedImage || undefined
      );

      if (synced) {
        console.log('✅ Dati sincronizzati automaticamente alla chat');
        
        // If there's AI analysis results, send those too
        if (diagnosedDisease && analysisDetails) {
          const diagnosisData = {
            plantType: plantInfo.name || 'Pianta non identificata',
            plantVariety: plantInfo.name,
            symptoms: plantInfo.symptoms || 'Nessun sintomo specificato',
            imageUrl: uploadedImage || '',
            analysisResult: diagnosedDisease,
            confidence: analysisDetails?.confidence || 0,
            isHealthy: diagnosedDisease?.healthy || false,
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

        toast.success('Dati inviati automaticamente all\'esperto!', {
          description: 'Marco Nigro riceverà tutte le informazioni'
        });

        // Navigate to chat
        handleNavigateToChat();
      } else {
        toast.error('Errore nell\'invio automatico dei dati');
      }
    } catch (error) {
      console.error('❌ Errore nella consulenza esperto:', error);
      toast.error('Errore nell\'invio dei dati all\'esperto');
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
          plantInfo={plantInfo}
          onEdit={onPlantInfoEdit}
        />

        <ScanLayout
          onTakePhoto={onTakePhoto}
          onUploadPhoto={onUploadPhoto}
        />
      </>
    );
  }

  if (stage === 'options') {
    return (
      <>
        <PlantInfoSummary 
          plantInfo={plantInfo}
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
        />
      </>
    );
  }

  if (stage === 'result') {
    // Expert consultation result display
    if (plantInfo.sendToExpert && !plantInfo.useAI) {
      return (
        <div className="space-y-4">
          <PlantInfoSummary 
            plantInfo={plantInfo}
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
    
    // Regular AI diagnosis result - Chat with Expert button is NOW SIMPLE
    return (
      <>
        <PlantInfoSummary 
          plantInfo={plantInfo}
          onEdit={onPlantInfoEdit}
        />
        
        <DiagnosisResult
          imageSrc={uploadedImage || ''}
          plantInfo={plantInfo}
          analysisData={diagnosedDisease}
          isAnalyzing={isAnalyzing}
          onStartNewAnalysis={onStartNewAnalysis}
          onChatWithExpert={handleNavigateToChat} // SEMPLICE navigazione
          onSendToExpert={handleSendToExpertWithData} // LOGICA COMPLETA qui
          analysisDetails={analysisDetails}
        />
      </>
    );
  }

  return null;
};

export default DiagnosisStages;
