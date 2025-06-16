
import React from "react";
import { usePlantInfo } from "@/context/PlantInfoContext";
import { useAuth } from "@/context/AuthContext";
import { Info } from "lucide-react";
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

  // Plant data - sempre mostrare box anche se non ci sono sintomi!
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

  // Se non ci sono dati significativi, non mostrare il box
  if (!firstName && !symptoms && !watering && !exposure && !imgUploaded) {
    return null;
  }

  return (
    <div className="my-4">
      <div className="rounded-t-xl border border-blue-200 bg-blue-50 px-5 py-3 flex items-center gap-2 shadow-sm">
        <Info className="text-blue-700 w-5 h-5" />
        <span className="font-bold text-blue-700 text-base tracking-tight">
          Dati Diagnosi Inseriti
        </span>
        <span className="ml-auto text-xs text-blue-500">
          Visibili solo a te e all&apos;esperto
        </span>
      </div>
      <div className="border-x border-b border-blue-200 bg-blue-50 rounded-b-xl p-4 min-h-40">
        <div className="space-y-4">
          <UserProfileDetails
            firstName={firstName}
            lastName={lastName}
            email={email}
            birthDate={birthDate}
            birthPlace={birthPlace}
          />
          <PlantDataDetails
            symptoms={symptoms}
            wateringText={wateringText}
            environment={environment}
            exposureText={exposureText}
            imgUploaded={imgUploaded}
          />
        </div>
      </div>
    </div>
  );
};

export default UserPlantSummary;
