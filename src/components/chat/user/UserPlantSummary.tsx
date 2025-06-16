
import React from "react";
import { usePlantInfo } from "@/context/PlantInfoContext";
import { useAuth } from "@/context/AuthContext";
import { Info, User, Leaf } from "lucide-react";
import UserProfileDetails from "./UserProfileDetails";
import PlantDataDetails from "./PlantDataDetails";

const UserPlantSummary: React.FC = () => {
  const { plantInfo } = usePlantInfo();
  const { userProfile } = useAuth();

  // User data
  const firstName = userProfile?.first_name || userProfile?.firstName || "";
  const lastName = userProfile?.last_name || userProfile?.lastName || "";
  const email = userProfile?.email || "";
  const birthDate = userProfile?.birth_date || userProfile?.birthDate || "";
  const birthPlace = userProfile?.birth_place || userProfile?.birthPlace || "";

  // Plant data
  const symptoms = plantInfo?.symptoms ?? "";
  const watering = plantInfo?.wateringFrequency ?? "";
  const exposure = plantInfo?.lightExposure ?? "";
  const environment =
    plantInfo?.isIndoor === undefined
      ? ""
      : plantInfo.isIndoor
      ? "Interno"
      : "Esterno";
  const imgUploaded = !!plantInfo?.uploadedImageUrl;

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

  // Check if we have any significant data to show
  const hasUserData = firstName || lastName || email;
  const hasPlantData = symptoms || watering || exposure || imgUploaded;
  
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
        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
          <Info className="text-white w-4 h-4" />
        </div>
        <div className="flex-1">
          <span className="font-bold text-blue-800 text-sm tracking-tight">
            Dati Diagnosi Inseriti
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
              <User className="w-4 h-4 text-blue-500" />
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
              <Leaf className="w-4 h-4 text-green-500" />
              <span>Dati Pianta</span>
            </div>
            <PlantDataDetails
              symptoms={symptoms}
              wateringText={wateringText}
              environment={environment}
              exposureText={exposureText}
              imgUploaded={imgUploaded}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default UserPlantSummary;
