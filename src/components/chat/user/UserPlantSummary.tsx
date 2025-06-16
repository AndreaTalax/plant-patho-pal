
import React from "react";
import { usePlantInfo } from "@/context/PlantInfoContext";
import { useAuth } from "@/context/AuthContext";
import { Info, User, Leaf, Camera } from "lucide-react";
import UserProfileDetails from "./UserProfileDetails";
import PlantDataDetails from "./PlantDataDetails";

const UserPlantSummary: React.FC = () => {
  const { plantInfo } = usePlantInfo();
  const { userProfile } = useAuth();

  // User data - comprehensive extraction
  const firstName = userProfile?.first_name || userProfile?.firstName || "";
  const lastName = userProfile?.last_name || userProfile?.lastName || "";
  const email = userProfile?.email || "";
  const birthDate = userProfile?.birth_date || userProfile?.birthDate || "";
  const birthPlace = userProfile?.birth_place || userProfile?.birthPlace || "";

  // Plant data - comprehensive extraction
  const symptoms = plantInfo?.symptoms ?? "";
  const watering = plantInfo?.wateringFrequency ?? "";
  const exposure = plantInfo?.lightExposure ?? "";
  const plantName = plantInfo?.name ?? "";
  const environment = plantInfo?.isIndoor === undefined 
    ? "" 
    : plantInfo.isIndoor 
      ? "Interno" 
      : "Esterno";
  const imgUploaded = !!(plantInfo?.uploadedImageUrl || plantInfo?.uploadedFile);
  const hasAiDiagnosis = !!(plantInfo as any)?.aiDiagnosis;

  // Mapping for display
  const wateringMap: { [key: string]: string } = {
    quotidiana: "Ogni giorno",
    "ogni-2-giorni": "Ogni 2 giorni",
    "2-volte-settimana": "2 volte a settimana",
    settimanale: "1 volta a settimana",
    "ogni-2-settimane": "Ogni 2 settimane",
    mensile: "Mensile",
    "quando-necessario": "Quando necessario",
  };
  
  const exposureMap: { [key: string]: string } = {
    "sole-diretto": "Sole diretto",
    "sole-parziale": "Sole parziale",
    "ombra-parziale": "Ombra parziale",
    "ombra-completa": "Ombra completa",
    "luce-indiretta": "Luce indiretta",
    "luce-artificiale": "Luce artificiale",
  };
  
  const wateringText = wateringMap[watering] || watering;
  const exposureText = exposureMap[exposure] || exposure;

  // Enhanced data availability check
  const hasUserData = !!(firstName || lastName || email || birthDate || birthPlace);
  const hasPlantData = !!(symptoms || watering || exposure || plantName || imgUploaded || hasAiDiagnosis);
  
  // Show summary if we have ANY data
  if (!hasUserData && !hasPlantData) {
    return (
      <div className="mx-4 my-3">
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-center gap-3 shadow-sm">
          <Info className="text-amber-600 w-5 h-5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-amber-800 font-medium">
              Nessun dato disponibile per la diagnosi
            </p>
            <p className="text-xs text-amber-600 mt-1">
              Completa la diagnosi per condividere i dati con l'esperto
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-4 my-3">
      <div className="rounded-t-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-3 flex items-center gap-3 shadow-sm">
        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
          <Info className="text-white w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="font-bold text-blue-800 text-sm tracking-tight">
            Dati Diagnosi Condivisi
          </span>
          <p className="text-xs text-blue-600 mt-0.5">
            Visibili solo a te e all'esperto
          </p>
        </div>
      </div>
      
      <div className="border-x border-b border-blue-200 bg-white rounded-b-xl p-4 space-y-4">
        {hasUserData && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 border-b border-gray-100 pb-2">
              <User className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <span>Profilo Utente</span>
            </div>
            <UserProfileDetails
              firstName={firstName}
              lastName={lastName}
              email={email}
              birthDate={birthDate}
              birthPlace={birthPlace}
            />
          </div>
        )}
        
        {hasPlantData && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 border-b border-gray-100 pb-2">
              <Leaf className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span>Dati della Pianta</span>
            </div>
            <PlantDataDetails
              plantName={plantName}
              symptoms={symptoms}
              wateringText={wateringText}
              environment={environment}
              exposureText={exposureText}
              imgUploaded={imgUploaded}
              hasAiDiagnosis={hasAiDiagnosis}
            />
          </div>
        )}

        {imgUploaded && plantInfo?.uploadedImageUrl && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 border-b border-gray-100 pb-2">
              <Camera className="w-4 h-4 text-purple-500 flex-shrink-0" />
              <span>Immagine Caricata</span>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <img 
                src={plantInfo.uploadedImageUrl} 
                alt="Pianta analizzata" 
                className="w-full max-w-xs mx-auto rounded-lg shadow-sm"
              />
              <p className="text-xs text-gray-600 text-center mt-2">
                Immagine condivisa con l'esperto
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserPlantSummary;
