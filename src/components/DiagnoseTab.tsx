import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { modelInfo } from '@/utils/aiDiagnosisUtils';
import { usePlantInfo } from '@/context/PlantInfoContext';
import { usePlantDiagnosis } from '@/hooks/usePlantDiagnosis';
import { PlantInfoFormValues } from './diagnose/PlantInfoForm';
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/context/AuthContext';
import { AuthRequiredDialog } from './auth/AuthRequiredDialog';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { EXPERT } from '@/components/chat/types';

// Importing our components
import DiagnoseHeader from './diagnose/DiagnoseHeader';
import DiagnosisStages from './diagnose/stages/DiagnosisStages';
import ModelInfoPanel from './diagnose/ModelInfoPanel';

const DiagnoseTab = () => {
  const { plantInfo, setPlantInfo } = usePlantInfo();
  const { userProfile, isAuthenticated } = useAuth();
  const [showCamera, setShowCamera] = useState(false);
  const [showModelInfo, setShowModelInfo] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [authDialogConfig, setAuthDialogConfig] = useState({
    title: "You must log in",
    description: "To use this feature, you need to log in to your account."
  });
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();
  
  // Dismiss any stuck toast notifications when component mounts
  useEffect(() => {
    toast.dismiss();
    
    // Clean up function to dismiss toasts when unmounting
    return () => {
      toast.dismiss();
    };
  }, []);
  
  const {
    isAnalyzing,
    uploadedImage,
    diagnosedDisease,
    analysisDetails,
    resetDiagnosis,
    captureImage,
    handleImageUpload,
    stopCameraStream,
    setUploadedImage
  } = usePlantDiagnosis();

  // Enhanced function to send comprehensive plant info to expert chat
  const sendComprehensivePlantInfoToExpertChat = async (
    plantData: PlantInfoFormValues, 
    imageUrl?: string,
    diagnosisResult?: any
  ) => {
    if (!isAuthenticated || !userProfile) return;

    try {
      console.log("Sending comprehensive plant info to expert chat:", { plantData, diagnosisResult });
      
      // Find or create conversation with expert
      const { data: existingConversation } = await supabase
        .from('conversations')
        .select('id')
        .eq('user_id', userProfile.id)
        .eq('expert_id', EXPERT.id)
        .single();

      let conversationId;
      if (!existingConversation) {
        const { data: newConversation, error: convError } = await supabase
          .from('conversations')
          .insert({
            user_id: userProfile.id,
            expert_id: EXPERT.id,
            title: `Consulenza per ${plantData.name || 'pianta'}`,
            status: 'active'
          })
          .select()
          .single();

        if (convError) {
          console.error("Error creating conversation:", convError);
          return;
        }
        conversationId = newConversation.id;
      } else {
        conversationId = existingConversation.id;
      }

      // Prepare comprehensive message with all available information
      let messageText = "🌿 **NUOVA CONSULENZA FITOSANITARIA**\n\n";
      
      // Basic plant information
      messageText += "📋 **INFORMAZIONI PIANTA:**\n";
      if (plantData.name) {
        messageText += `• **Nome:** ${plantData.name}\n`;
      }
      messageText += `• **Ambiente:** ${plantData.isIndoor ? 'Interno' : 'Esterno'}\n`;
      messageText += `• **Irrigazione:** ${plantData.wateringFrequency} volte/settimana\n`;
      messageText += `• **Esposizione luce:** ${plantData.lightExposure}\n`;
      messageText += `• **Sintomi osservati:** ${plantData.symptoms}\n\n`;

      // Add diagnosis results if available
      if (diagnosisResult && diagnosisResult.diseaseId) {
        messageText += "🔬 **RISULTATI ANALISI AI:**\n";
        messageText += `• **Malattia identificata:** ${diagnosisResult.diseaseId.replace('-', ' ')}\n`;
        messageText += `• **Confidenza:** ${Math.round(diagnosisResult.confidence * 100)}%\n`;
        
        if (diagnosisResult.analysisDetails?.identifiedFeatures) {
          messageText += `• **Caratteristiche identificate:**\n`;
          diagnosisResult.analysisDetails.identifiedFeatures.forEach((feature: string) => {
            messageText += `  - ${feature}\n`;
          });
        }

        if (diagnosisResult.analysisDetails?.multiServiceInsights) {
          const insights = diagnosisResult.analysisDetails.multiServiceInsights;
          messageText += `• **Specie identificata:** ${insights.plantName || 'Non identificata'}\n`;
          messageText += `• **Parte della pianta:** ${insights.plantPart || 'Non specificata'}\n`;
          messageText += `• **Stato di salute:** ${insights.isHealthy ? 'Sana' : 'Problematica'}\n`;
        }

        if (diagnosisResult.analysisDetails?.plantixInsights) {
          const plantix = diagnosisResult.analysisDetails.plantixInsights;
          messageText += `• **Severità:** ${plantix.severity}\n`;
          messageText += `• **Rischio diffusione:** ${plantix.spreadRisk}\n`;
          
          if (plantix.environmentalFactors && plantix.environmentalFactors.length > 0) {
            messageText += `• **Fattori ambientali:**\n`;
            plantix.environmentalFactors.forEach((factor: string) => {
              messageText += `  - ${factor}\n`;
            });
          }
        }

        // Add EPPO warning if present
        if (diagnosisResult.analysisDetails?.eppoData) {
          messageText += "\n⚠️ **ATTENZIONE - ORGANISMO REGOLAMENTATO EPPO**\n";
          messageText += `• **Status:** ${diagnosisResult.analysisDetails.eppoData.regulationStatus}\n`;
          messageText += `• **Livello di allerta:** ${diagnosisResult.analysisDetails.eppoData.warningLevel}\n`;
          if (diagnosisResult.analysisDetails.eppoData.reportAdvised) {
            messageText += "• **Raccomandazione:** Segnalazione alle autorità fitosanitarie consigliata\n";
          }
        }

        messageText += "\n";
      }

      // Add request for expert opinion
      messageText += "💬 **RICHIESTA:**\n";
      messageText += "Ciao Marco, ho bisogno della tua consulenza professionale per questa pianta. ";
      
      if (diagnosisResult) {
        messageText += "Ho già effettuato un'analisi AI, ma vorrei il tuo parere esperto per confermare la diagnosi e ricevere consigli specifici per il trattamento.";
      } else {
        messageText += "Potresti aiutarmi a identificare il problema e suggerirmi il trattamento più appropriato?";
      }

      messageText += "\n\nGrazie per il tuo tempo e la tua expertise! 🙏";

      // Send the comprehensive message
      const { error: msgError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: userProfile.id,
          recipient_id: EXPERT.id,
          text: messageText
        });

      if (msgError) {
        console.error("Error sending comprehensive plant information:", msgError);
        return;
      }

      // Send image as separate message if available
      if (imageUrl) {
        const { error: imageMessageError } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            sender_id: userProfile.id,
            recipient_id: EXPERT.id,
            text: imageUrl
          });

        if (imageMessageError) {
          console.error("Error sending image message:", imageMessageError);
          // Don't throw for image, continue
        }
      }

      console.log("Comprehensive plant information sent successfully");
      toast.success("Informazioni complete inviate automaticamente all'esperto");
      
      return conversationId;
    } catch (error) {
      console.error("Error sending comprehensive plant info to chat:", error);
      toast.error("Errore nell'invio automatico delle informazioni");
    }
  };

  // Function to automatically send plant info to expert chat (basic version)
  const sendPlantInfoToExpertChat = async (plantData: PlantInfoFormValues) => {
    if (!isAuthenticated || !userProfile) return;
    
    try {
      console.log("Sending basic plant info to expert chat:", plantData);
      
      // Find or create conversation with expert
      const { data: existingConversation } = await supabase
        .from('conversations')
        .select('id')
        .eq('user_id', userProfile.id)
        .eq('expert_id', EXPERT.id)
        .single();

      let conversationId;
      if (!existingConversation) {
        const { data: newConversation, error: convError } = await supabase
          .from('conversations')
          .insert({
            user_id: userProfile.id,
            expert_id: EXPERT.id,
            title: `Consulenza per ${plantData.name || 'pianta'}`,
            status: 'active'
          })
          .select()
          .single();

        if (convError) {
          console.error("Error creating conversation:", convError);
          return;
        }
        conversationId = newConversation.id;
      } else {
        conversationId = existingConversation.id;
      }

      // Prepare message with plant information
      let messageText = "🌿 Nuove informazioni sulla pianta:\n\n";
      if (plantData.name) {
        messageText += `📝 **Nome:** ${plantData.name}\n`;
      }
      messageText += `🏠 **Ambiente:** ${plantData.isIndoor ? 'Interno' : 'Esterno'}\n`;
      messageText += `💧 **Frequenza irrigazione:** ${plantData.wateringFrequency} volte/settimana\n`;
      messageText += `☀️ **Esposizione luce:** ${plantData.lightExposure}\n`;
      messageText += `🔍 **Sintomi:** ${plantData.symptoms}\n`;

      // Send message with plant information
      const { error: msgError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: userProfile.id,
          recipient_id: EXPERT.id,
          text: messageText
        });

      if (msgError) {
        console.error("Error sending plant information:", msgError);
        return;
      }

      console.log("Plant information sent successfully");
      toast.success("Informazioni pianta inviate automaticamente all'esperto");
    } catch (error) {
      console.error("Error sending plant info to chat:", error);
    }
  };

  const handleImageUploadEvent = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!plantInfo.infoComplete) {
      toast.warning("Inserisci prima le informazioni sulla pianta", {
        dismissible: true,
        duration: 3000
      });
      return;
    }
    
    const file = e.target.files?.[0];
    if (file) {
      // Verifica che il file sia un'immagine
      if (!file.type.startsWith('image/')) {
        toast.error("Seleziona un file immagine valido");
        return;
      }
      // Verifica dimensioni del file (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Il file è troppo grande. Dimensione massima: 10MB");
        return;
      }
      
      // Pulisci l'immagine precedente se esiste
      if (uploadedImage && uploadedImage.startsWith('blob:')) {
        URL.revokeObjectURL(uploadedImage);
      }
      
      // Create a temporary URL for the uploaded image
      const tempUrl = URL.createObjectURL(file);
      setUploadedImage(tempUrl);
      
      // Store the file for later use when user chooses diagnosis method
      setPlantInfo({ ...plantInfo, uploadedFile: file, uploadedImageUrl: tempUrl });
    }
    
    // Reset dell'input file per permettere di selezionare lo stesso file di nuovo
    e.target.value = '';
  };

  const takePicture = () => {
    if (!plantInfo.infoComplete) {
      toast.warning("Inserisci prima le informazioni sulla pianta", {
        dismissible: true,
        duration: 3000
      });
      return;
    }
    
    console.log("Activating camera...");
    setShowCamera(true);
  };

  async function handlePlantInfoSubmit(data: PlantInfoFormValues) {
    const updatedPlantInfo = {
      isIndoor: data.isIndoor,
      wateringFrequency: data.wateringFrequency,
      lightExposure: data.lightExposure,
      symptoms: data.symptoms,
      useAI: false, // Reset useAI, will be set when user selects option
      sendToExpert: false, // Reset sendToExpert, will be set when user selects option
      name: data.name || "Pianta sconosciuta",
      infoComplete: true,
      uploadedFile: null,
      uploadedImageUrl: null
    };
    
    setPlantInfo(updatedPlantInfo);
    
    // Automatically send plant info to expert chat if user is authenticated
    if (isAuthenticated && userProfile) {
      await sendPlantInfoToExpertChat(data);
    }
    
    setTimeout(() => {
      window.scrollTo({
        top: window.scrollY + 200,
        behavior: 'smooth'
      });
    }, 300);
  }

  function handleSelectAI() {
    // Check if user has uploaded an image
    if (!uploadedImage) {
      toast.warning("Carica prima un'immagine della pianta", {
        dismissible: true,
        duration: 3000
      });
      return;
    }
    
    setPlantInfo({ ...plantInfo, useAI: true, sendToExpert: false });
    
    // If user uploaded a file, process with AI
    if (plantInfo.uploadedFile) {
      console.log("Starting AI analysis with uploaded file...");
      handleImageUpload(plantInfo.uploadedFile, plantInfo);
    }
  }

  const handleSelectExpert = async () => {
    if (!isAuthenticated) {
      setAuthDialogConfig({
        title: "Accesso richiesto",
        description: "Per contattare il fitopatologo devi prima accedere al tuo account."
      });
      setShowAuthDialog(true);
      return;
    }

    if (!uploadedImage) {
      toast.warning("Carica prima un'immagine della pianta", {
        dismissible: true,
        duration: 3000
      });
      return;
    }
    
    try {
      console.log("Sending to expert...", { uploadedImage, plantInfo });
      
      // Prepare expert consultation data
      setPlantInfo({ ...plantInfo, sendToExpert: true, useAI: false });
      
      // Create conversation and send comprehensive info
      await sendComprehensivePlantInfoToExpertChat(
        {
          name: plantInfo.name,
          isIndoor: plantInfo.isIndoor,
          wateringFrequency: plantInfo.wateringFrequency,
          lightExposure: plantInfo.lightExposure,
          symptoms: plantInfo.symptoms
        },
        uploadedImage
      );
      
      // Navigate to chat after successful send
      toast.success("Richiesta inviata con successo al fitopatologo!");
      
      setTimeout(() => {
        navigate('/');
        setTimeout(() => {
          const event = new CustomEvent('switchTab', { detail: 'chat' });
          window.dispatchEvent(event);
        }, 100);
      }, 1000);
      
    } catch (error) {
      console.error("Error notifying expert:", error);
      toast.error("Errore nell'invio della richiesta all'esperto");
    }
  };

  // Determine current stage based on plant info and uploaded image
  const getCurrentStage = () => {
    if (!plantInfo.infoComplete) return 'info';
    if (!uploadedImage) return 'capture';
    if (!plantInfo.useAI && !plantInfo.sendToExpert) return 'options';
    return 'result';
  };

  const currentStage = getCurrentStage();

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-green-50 to-blue-50 pt-4 pb-24">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header Component */}
        <DiagnoseHeader 
          showModelInfo={showModelInfo}
          onToggleModelInfo={() => setShowModelInfo(!showModelInfo)}
        />
        
        {/* Model Info Panel */}
        {showModelInfo && (
          <ModelInfoPanel 
            modelInfo={modelInfo}
            onClose={() => setShowModelInfo(false)}
          />
        )}

        {/* Main Content */}
        <div className="space-y-6">
          <DiagnosisStages
            stage={currentStage}
            showCamera={showCamera}
            uploadedImage={uploadedImage}
            isAnalyzing={isAnalyzing}
            diagnosedDisease={diagnosedDisease}
            analysisDetails={analysisDetails}
            videoRef={videoRef}
            canvasRef={canvasRef}
            onPlantInfoComplete={handlePlantInfoSubmit}
            onPlantInfoEdit={() => setPlantInfo({ ...plantInfo, infoComplete: false })}
            onSelectAI={handleSelectAI}
            onSelectExpert={handleSelectExpert}
            onTakePhoto={takePicture}
            onUploadPhoto={() => document.getElementById('image-upload')?.click()}
            onCapture={captureImage}
            onCancelCamera={() => {
              setShowCamera(false);
              stopCameraStream();
            }}
            onStartNewAnalysis={resetDiagnosis}
          />
        </div>

        {/* Hidden file input */}
        <input
          id="image-upload"
          type="file"
          accept="image/*"
          onChange={handleImageUploadEvent}
          className="hidden"
        />

        {/* Auth Dialog */}
        <AuthRequiredDialog 
          isOpen={showAuthDialog}
          onClose={() => setShowAuthDialog(false)}
          title={authDialogConfig.title}
          description={authDialogConfig.description}
        />
      </div>
    </div>
  );
};

export default DiagnoseTab;
