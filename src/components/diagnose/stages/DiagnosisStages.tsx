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

/**
 * Renders the current diagnostic stage including camera views, plant information forms, 
 * capture options, and result displays, with tailored actions based on the provided stage and inputs.
 * @example
 * DiagnosisStages({
 *   stage: 'info',
 *   showCamera: false,
 *   uploadedImage: 'image_url',
 *   isAnalyzing: false,
 *   diagnosedDisease: { disease: 'example' },
 *   analysisDetails: { additionalInfo: 'details' },
 *   videoRef: videoElementReference,
 *   canvasRef: canvasElementReference,
 *   onPlantInfoComplete: () => {},
 *   onPlantInfoEdit: () => {},
 *   onSelectAI: () => {},
 *   onSelectExpert: () => {},
 *   onTakePhoto: () => {},
 *   onUploadPhoto: () => {},
 *   onCapture: () => {},
 *   onCancelCamera: () => {},
 *   onStartNewAnalysis: () => {},
 *   onChatWithExpert: () => {}
 * })
 * // Return value will vary depending on current stage, may render components 
 * // like <CameraCapture />, <PlantInfoForm />, <PlantInfoSummary />, etc.
 * 
 * @param {Object} params - Input parameters for rendering the diagnosis stage.
 * @param {string} params.stage - Current stage of the diagnosis process.
 * @param {boolean} params.showCamera - Flag to show the camera view.
 * @param {string} params.uploadedImage - URL of the uploaded image.
 * @param {boolean} params.isAnalyzing - Whether the analysis is currently in progress.
 * @param {Object} params.diagnosedDisease - Details about the diagnosed disease.
 * @param {Object} params.analysisDetails - Additional analysis information.
 * @param {HTMLVideoElement} params.videoRef - Reference to the video element.
 * @param {HTMLCanvasElement} params.canvasRef - Reference to the canvas element.
 * @param {Function} params.onPlantInfoComplete - Callback when plant info entry is completed.
 * @param {Function} params.onPlantInfoEdit - Callback to edit the plant information.
 * @param {Function} params.onSelectAI - Callback to select AI option.
 * @param {Function} params.onSelectExpert - Callback to select expert consultation option.
 * @param {Function} params.onTakePhoto - Callback to handle photo capture.
 * @param {Function} params.onUploadPhoto - Callback to handle photo upload.
 * @param {Function} params.onCapture - Callback when photo capturing is done.
 * @param {Function} params.onCancelCamera - Callback to cancel camera view.
 * @param {Function} params.onStartNewAnalysis - Callback to start a new analysis.
 * @param {Function} params.onChatWithExpert - Callback to initiate chat with an expert.
 * @returns {JSX.Element|null} Returns a JSX element corresponding to the current stage 
 * or null if stage is not recognized.
 * @description
 *   - Utilizes conditional rendering based on 'stage' to determine the component to display.
 *   - Relies on plant information and captured/uploaded images to guide diagnosis steps.
 *   - Includes enhanced handling of expert chat navigation with automatic data synchronization.
 */
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

  // Enhanced function to navigate to chat with automatic data sync
  /**
   * Navigates to the chat interface, either with an expert or switches the application tab to chat.
   * @example
   * navigateToChat(onChatWithExpert)
   * No explicit return value; performs actions based on the `onChatWithExpert` condition.
   * @param {Function} onChatWithExpert - Callback function to initiate chat with an expert.
   * @returns {void} No return value; performs navigation and dispatches events.
   * @description
   *   - If `onChatWithExpert` is not provided, the function navigates to the homepage and switches the tab to chat.
   *   - Dispatches a custom event `switchTab` to change the application tab to chat.
   *   - Refreshes the chat to ensure displaying the latest data by dispatching a `refreshChat` event.
   */
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
        videoRef={videoRef}
        canvasRef={canvasRef}
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
    // Enhanced expert consultation result display
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
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
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
    
    // Regular AI diagnosis result
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
          onChatWithExpert={handleNavigateToChat}
          analysisDetails={analysisDetails}
        />
      </>
    );
  }

  return null;
};

export default DiagnosisStages;
