
import React from "react";
import { usePlantInfo } from "@/context/PlantInfoContext";
import { useAuth } from "@/context/AuthContext";
import { Info } from "lucide-react";

const UserPlantSummary: React.FC = () => {
  const { plantInfo } = usePlantInfo();
  const { userProfile } = useAuth();

  // Estrai dati utente
  const firstName = userProfile?.first_name || userProfile?.firstName || "";
  const lastName = userProfile?.last_name || userProfile?.lastName || "";
  const email = userProfile?.email || "";
  const birthDate = userProfile?.birth_date || userProfile?.birthDate || "";
  const birthPlace = userProfile?.birth_place || userProfile?.birthPlace || "";

  // Estrai dati pianta
  const symptoms = plantInfo?.symptoms || "";
  const watering = plantInfo?.wateringFrequency || "";
  const exposure = plantInfo?.lightExposure || "";
  const environment = plantInfo?.isIndoor === undefined ? "" : plantInfo.isIndoor ? "Interno" : "Esterno";
  const imgUploaded = !!plantInfo?.uploadedImageUrl;

  // Traduzioni migliorate per watering ed exposure
  const wateringMap: { [key: string]: string } = {
    'quotidiana': 'Ogni giorno',
    'ogni-2-giorni': 'Ogni 2 giorni',
    '2-volte-settimana': '2 volte a settimana',
    'settimanale': '1 volta a settimana',
    'ogni-2-settimane': 'Ogni 2 settimane',
    'mensile': 'Mensile',
    'quando-necessario': "Quando necessario"
  };
  const exposureMap: { [key: string]: string } = {
    'sole-diretto': 'Sole diretto',
    'sole-parziale': 'Sole parziale',
    'ombra-parziale': 'Ombra parziale',
    'ombra-completa': 'Ombra completa',
    'luce-indiretta': 'Luce indiretta',
    'luce-artificiale': 'Luce artificiale'
  };

  const wateringText = wateringMap[watering] || watering;
  const exposureText = exposureMap[exposure] || exposure;

  // Mostra solo se ci sono dati principali
  if (!firstName && !symptoms) return null;

  return (
    <div className="my-4">

      {/* Titolo + info */}
      <div className="rounded-t-xl border border-blue-200 bg-blue-50 px-5 py-3 flex items-center gap-2 shadow-sm">
        <Info className="text-blue-700 w-5 h-5" />
        <span className="font-bold text-blue-700 text-base tracking-tight">
          Dati Diagnosi Inseriti
        </span>
        <span className="ml-auto text-xs text-blue-500">Visibili solo a te e all'esperto</span>
      </div>

      {/* Dettaglio box */}
      <div className="border-x border-b border-blue-200 bg-blue-50 rounded-b-xl p-4">
        <div className="space-y-4">

          {/* Dati User */}
          <div>
            <span className="block font-semibold text-blue-900 mb-1">{"\u{1F464}"} Profilo Utente:</span>
            <ul className="space-y-1 text-sm ml-2">
              <li>
                <span className="font-medium">• Nome:</span> <span className="uppercase">{firstName + (lastName ? " " + lastName : "")}</span>
              </li>
              <li>
                <span className="font-medium">• Data di nascita:</span>{" "}
                {birthDate || <span className="italic text-gray-400">-</span>}
              </li>
              <li>
                <span className="font-medium">• Luogo di nascita:</span>{" "}
                {birthPlace || <span className="italic text-gray-400">-</span>}
              </li>
              <li>
                <span className="font-medium">• Email:</span>{" "}
                {email || <span className="italic text-gray-400">-</span>}
              </li>
            </ul>
          </div>

          {/* Dati Pianta */}
          <div>
            <span className="block font-semibold text-green-900 mb-1">{"\u{1F331}"} Dati della Pianta:</span>
            <ul className="space-y-1 text-sm ml-2">
              <li>
                <span className="font-medium">• Sintomi:</span>{" "}
                {symptoms || <span className="italic text-gray-400">-</span>}
              </li>
              <li>
                <span className="font-medium">• Irrigazione:</span>{" "}
                {wateringText || <span className="italic text-gray-400">-</span>}
              </li>
              <li>
                <span className="font-medium">• Esposizione:</span>{" "}
                {environment
                  ? (environment + (exposureText ? ` ${exposureText}` : ""))
                  : (exposureText || <span className="italic text-gray-400">-</span>)}
              </li>
              <li>
                <span className="font-medium">• Immagine:</span>{" "}
                {imgUploaded ? (
                  <span className="text-green-700 font-semibold">Caricata {"\u2714"}</span>
                ) : (
                  <span className="text-gray-400 font-medium">Non caricata {"\u2716"}</span>
                )}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserPlantSummary;
