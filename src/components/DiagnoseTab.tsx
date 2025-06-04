import { supabase } from "@/integrations/supabase/supabaseClient";
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
      console.log("🚀 Sending comprehensive plant info to expert chat:", { plantData, diagnosisResult });
      
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
            title: `Consulenza automatica per ${plantData.name || 'pianta'}`,
            status: 'active'
          })
          .select()
          .single();

        if (convError) {
          console.error("❌ Error creating conversation:", convError);
          throw convError;
        }
        conversationId = newConversation.id;
        console.log("✅ Created new conversation:", conversationId);
      } else {
        conversationId = existingConversation.id;
        console.log("✅ Found existing conversation:", conversationId);
      }

      // Prepare comprehensive message with all available information
      let messageText = "🌿 **RICHIESTA AUTOMATICA DI CONSULENZA FITOSANITARIA**\n\n";
      
      // Basic plant information
      messageText += "📋 **INFORMAZIONI PIANTA:**\n";
      if (plantData.name) {
        messageText += `• **Nome:** ${plantData.name}\n`;
      }
      messageText += `• **Ambiente:** ${plantData.isIndoor ? 'Interno 🏠' : 'Esterno 🌳'}\n`;
      messageText += `• **Irrigazione:** ${plantData.wateringFrequency} volte/settimana 💧\n`;
      messageText += `• **Esposizione luce:** ${plantData.lightExposure} ☀️\n`;
      messageText += `• **Sintomi osservati:** ${plantData.symptoms} 🔍\n\n`;

      // Add AI diagnosis results if available
      if (diagnosisResult) {
        messageText += "🤖 **ANALISI AI PRELIMINARE:**\n";
        
        if (diagnosisResult.diseaseId) {
          messageText += `• **Malattia identificata:** ${diagnosisResult.diseaseId.replace('-', ' ')}\n`;
          messageText += `• **Confidenza AI:** ${Math.round(diagnosisResult.confidence * 100)}%\n`;
        }
        
        if (diagnosisResult.analysisDetails?.identifiedFeatures) {
          messageText += `• **Caratteristiche rilevate:**\n`;
          diagnosisResult.analysisDetails.identifiedFeatures.forEach((feature: string) => {
            messageText += `  - ${feature}\n`;
          });
        }

        if (diagnosisResult.analysisDetails?.multiServiceInsights) {
          const insights = diagnosisResult.analysisDetails.multiServiceInsights;
          messageText += `• **Specie AI:** ${insights.plantName || 'Non identificata'}\n`;
          messageText += `• **Parte pianta:** ${insights.plantPart || 'Non specificata'}\n`;
          messageText += `• **Stato salute AI:** ${insights.isHealthy ? 'Apparentemente sana ✅' : 'Problematica ⚠️'}\n`;
        }

        if (diagnosisResult.analysisDetails?.plantixInsights) {
          const plantix = diagnosisResult.analysisDetails.plantixInsights;
          messageText += `• **Severità stimata:** ${plantix.severity}\n`;
          messageText += `• **Rischio diffusione:** ${plantix.spreadRisk}\n`;
          
          if (plantix.environmentalFactors && plantix.environmentalFactors.length > 0) {
            messageText += `• **Fattori ambientali rilevati:**\n`;
            plantix.environmentalFactors.forEach((factor: string) => {
              messageText += `  - ${factor}\n`;
            });
          }
        }

        // Add EPPO regulatory warning if present
        if (diagnosisResult.analysisDetails?.eppoData) {
          messageText += "\n⚠️ **ALERT - ORGANISMO POTENZIALMENTE REGOLAMENTATO EPPO**\n";
          messageText += `• **Status normativo:** ${diagnosisResult.analysisDetails.eppoData.regulationStatus}\n`;
          messageText += `• **Livello allerta:** ${diagnosisResult.analysisDetails.eppoData.warningLevel}\n`;
          if (diagnosisResult.analysisDetails.eppoData.reportAdvised) {
            messageText += "• **⚠️ IMPORTANTE:** Possibile segnalazione alle autorità fitosanitarie\n";
          }
        }

        messageText += "\n";
      }

      // Add contextual request based on scenario
      messageText += "💬 **RICHIESTA SPECIFICA:**\n";
      if (diagnosisResult) {
        messageText += "Ciao Marco! Il sistema AI ha fornito una diagnosi preliminare, ma ho bisogno del tuo occhio esperto per:\n";
        messageText += "• Confermare o correggere la diagnosi AI\n";
        messageText += "• Ricevere un protocollo di trattamento specifico e professionale\n";
        messageText += "• Valutare la gravità reale della situazione\n";
        messageText += "• Consigli per prevenire recidive\n\n";
      } else {
        messageText += "Ciao Marco! Ho bisogno del tuo aiuto professionale per identificare il problema di questa pianta e ricevere consigli specifici per il trattamento.\n\n";
      }

      messageText += "Grazie per la tua expertise! 🙏\n";
      messageText += "_Messaggio inviato automaticamente dal sistema di diagnosi_";

      // Send the comprehensive message
      const { data: messageData, error: msgError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: userProfile.id,
          recipient_id: EXPERT.id,
          text: messageText
        })
        .select()
        .single();

      if (msgError) {
        console.error("❌ Error sending comprehensive plant information:", msgError);
        throw msgError;
      }

      console.log("✅ Comprehensive message sent:", messageData.id);

      // Send image as separate message if available
      if (imageUrl) {
        const { data: imageMessageData, error: imageMessageError } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            sender_id: userProfile.id,
            recipient_id: EXPERT.id,
            text: imageUrl
          })
          .select()
          .single();

        if (imageMessageError) {
          console.error("⚠️ Error sending image message:", imageMessageError);
          // Continue without throwing - image is optional
        } else {
          console.log("✅ Image message sent:", imageMessageData.id);
        }
      }

      console.log("🎉 All data sent successfully to expert");
      toast.success("Informazioni complete inviate automaticamente all'esperto!", {
        description: "Il fitopatologo ha ricevuto tutti i dettagli della tua pianta",
        duration: 4000
      });
      
      return conversationId;
    } catch (error) {
      console.error("❌ Error in comprehensive data sending:", error);
      toast.error("Errore nell'invio automatico delle informazioni", {
        description: "Riprova o contatta l'esperto manualmente",
        duration: 6000
      });
      throw error;
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
      messageText += `🏠 **Ambiente:** ${plantData.isIndoor ? 'Interno 🏠' : 'Esterno 🌳'}\n`;
      messageText += `💧 **Frequenza irrigazione:** ${plantData.wateringFrequency} volte/settimana 💧\n`;
      messageText += `☀️ **Esposizione luce:** ${plantData.lightExposure} ☀️\n`;
      messageText += `🔍 **Sintomi:** ${plantData.symptoms} 🔍\n`;

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

  // --- FUNZIONE DI UPLOAD SU SUPABASE STORAGE ---
async function uploadImageToStorage(file: File): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
  const filePath = `${fileName}`;
  // Carica sul bucket "plant-images"
  const { data, error } = await supabase.storage
    .from('plant-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (error) {
    throw error;
  }

  // Ottieni la URL pubblica del file
  const { data: publicUrlData } = supabase.storage
    .from('plant-images')
    .getPublicUrl(filePath);

  if (!publicUrlData?.publicUrl) {
    throw new Error("Impossibile ottenere la URL pubblica dell'immagine");
  }

  return publicUrlData.publicUrl;
}

  // --- FORZATURA INVIO AUTOMATICO SU UPLOAD FILE ---
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
    if (!file.type.startsWith('image/')) {
      toast.error("Seleziona un file immagine valido");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("L'immagine deve essere inferiore a 10MB");
      return;
    }

    try {
      const imageUrl = await uploadImageToStorage(file);
      setUploadedImage(imageUrl);

      // Invio automatico dati + immagine
      if (isAuthenticated && userProfile && plantInfo) {
        await sendComprehensivePlantInfoToExpertChat(plantInfo, imageUrl);
        toast.success("Dati e immagine inviati automaticamente al fitopatologo!");
      }
    } catch (error) {
      toast.error("Errore nell'upload dell'immagine");
      console.error(error);
    }
  }
};
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

// --- FORZATURA INVIO AUTOMATICO SU FOTO DA FOTOCAMERA ---
const handleCameraCapture = async (file: File) => {
  if (!plantInfo.infoComplete) {
    toast.warning("Inserisci prima le informazioni sulla pianta", {
      dismissible: true,
      duration: 3000
    });
    return;
  }

  if (!file.type.startsWith('image/')) {
    toast.error("Il file della fotocamera non è un'immagine valida");
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    toast.error("L'immagine deve essere inferiore a 10MB");
    return;
  }

  try {
    const imageUrl = await uploadImageToStorage(file);
    setUploadedImage(imageUrl);

    // Invio automatico dati + immagine
    if (isAuthenticated && userProfile && plantInfo) {
      await sendComprehensivePlantInfoToExpertChat(plantInfo, imageUrl);
      toast.success("Dati e foto inviati automaticamente al fitopatologo!");
    }
  } catch (error) {
    toast.error("Errore nell'upload dell'immagine dalla fotocamera");
    console.error(error);
  }
};
    
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
      console.log("🤖 Starting AI analysis with uploaded file...");
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
      console.log("🚀 Initiating expert consultation...", { uploadedImage, plantInfo });
      
      // Show immediate feedback
      toast.info("Preparazione dati per l'esperto...", { duration: 2000 });
      
      // Update plant info state
      setPlantInfo({ ...plantInfo, sendToExpert: true, useAI: false });
      
      // Prepare data for expert - include any AI analysis if available
      const consultationData = {
        name: plantInfo.name,
        isIndoor: plantInfo.isIndoor,
        wateringFrequency: plantInfo.wateringFrequency,
        lightExposure: plantInfo.lightExposure,
        symptoms: plantInfo.symptoms,
        useAI: false,
        sendToExpert: true
      };

      // Send comprehensive info including any AI diagnosis if available
      const conversationId = await sendComprehensivePlantInfoToExpertChat(
        consultationData,
        uploadedImage,
        diagnosedDisease // Include AI diagnosis if available
      );
      
      if (conversationId) {
        console.log("✅ Expert consultation initiated successfully");
        
        // Immediate navigation to chat with expert conversation
        setTimeout(() => {
          console.log("🔄 Switching to chat tab...");
          const event = new CustomEvent('switchTab', { detail: 'chat' });
          window.dispatchEvent(event);
          
          // Force refresh chat to show the new conversation
          setTimeout(() => {
            console.log("🔄 Refreshing chat view...");
            const refreshEvent = new CustomEvent('refreshChat');
            window.dispatchEvent(refreshEvent);
          }, 300);
        }, 800);
      }
      
    } catch (error) {
      console.error("❌ Error in expert consultation setup:", error);
      toast.error("Errore nell'invio della richiesta all'esperto", {
        description: "Riprova o contatta il supporto",
        duration: 6000
      });
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
