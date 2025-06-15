
import React from "react";
import { usePlantInfo } from "@/context/PlantInfoContext";
import { useAuth } from "@/context/AuthContext";

/**
 * Mostra sempre sia i dati della pianta sia i dati personali tra quelli inviati in automatico.
 */
const UserPlantSummary: React.FC = () => {
  const { plantInfo } = usePlantInfo();
  const { userProfile } = useAuth();

  console.log('🌿 UserPlantSummary render:', { 
    hasPlantInfo: !!plantInfo, 
    hasUserProfile: !!userProfile,
    plantName: plantInfo?.name,
    userName: userProfile?.first_name,
    hasImage: !!plantInfo?.uploadedImageUrl,
    plantInfoComplete: plantInfo?.infoComplete,
    symptoms: plantInfo?.symptoms,
    wateringFrequency: plantInfo?.wateringFrequency,
    lightExposure: plantInfo?.lightExposure
  });

  // Mostra sempre il summary se c'è almeno una info della pianta o profilo utente
  if (!plantInfo && !userProfile) {
    console.log('⚠️ No plant info or user profile available');
    return null;
  }

  const firstName = userProfile?.first_name || userProfile?.firstName || "Non specificato";
  const lastName = userProfile?.last_name || userProfile?.lastName || "";
  const email = userProfile?.email || "Non specificato";
  const birthDate = userProfile?.birth_date || userProfile?.birthDate || "Non specificata";
  const birthPlace = userProfile?.birth_place || userProfile?.birthPlace || "Non specificato";

  // Dati della pianta con fallback migliori
  const plantName = plantInfo?.name || "Specie da identificare";
  const environment = plantInfo?.isIndoor !== undefined ? (plantInfo.isIndoor ? "Interno" : "Esterno") : "Non specificato";
  const lightExposure = plantInfo?.lightExposure || "Non specificata";
  const wateringFrequency = plantInfo?.wateringFrequency || "Non specificata";
  const symptoms = plantInfo?.symptoms || "Non specificati";

  // Mappe per rendere più leggibili i valori
  const wateringMap: { [key: string]: string } = {
    'quotidiana': 'Quotidiana (ogni giorno)',
    'ogni-2-giorni': 'Ogni 2 giorni',
    '2-volte-settimana': '2 volte a settimana',
    'settimanale': 'Settimanale',
    'ogni-2-settimane': 'Ogni 2 settimane',
    'mensile': 'Mensile',
    'quando-necessario': 'Quando il terreno è secco'
  };

  const exposureMap: { [key: string]: string } = {
    'sole-diretto': 'Sole diretto',
    'sole-parziale': 'Sole parziale',
    'ombra-parziale': 'Ombra parziale',
    'ombra-completa': 'Ombra completa',
    'luce-indiretta': 'Luce indiretta',
    'luce-artificiale': 'Luce artificiale'
  };

  const wateringText = wateringMap[wateringFrequency] || wateringFrequency;
  const exposureText = exposureMap[lightExposure] || lightExposure;

  return (
    <div className="bg-green-50 rounded-lg p-4 my-3 text-sm border border-green-200">
      <div className="mb-3 font-bold text-green-900 text-center flex items-center justify-center gap-2">
        <span>✅</span>
        <span>Dati inviati automaticamente all'esperto</span>
      </div>
      
      {/* Dati della pianta */}
      <div className="mb-4 p-3 bg-white rounded-lg border border-green-100">
        <div className="font-semibold text-green-800 mb-3 flex items-center gap-2">
          <span>🌱</span>
          <span>Informazioni della pianta:</span>
        </div>
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <span className="text-green-600 mt-0.5">🏷️</span> 
            <div>
              <span className="font-medium">Nome/Tipo pianta:</span>
              <div className="text-gray-700">{plantName}</div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-600 mt-0.5">🏠</span> 
            <div>
              <span className="font-medium">Ambiente:</span>
              <div className="text-gray-700">{environment}</div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-600 mt-0.5">☀️</span> 
            <div>
              <span className="font-medium">Esposizione alla luce:</span>
              <div className="text-gray-700">{exposureText}</div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-600 mt-0.5">💧</span> 
            <div>
              <span className="font-medium">Frequenza irrigazione:</span>
              <div className="text-gray-700">{wateringText}</div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-red-600 mt-0.5">🦠</span> 
            <div>
              <span className="font-medium">Sintomi osservati:</span>
              <div className="text-gray-700">{symptoms}</div>
            </div>
          </div>
          
          {plantInfo?.uploadedImageUrl && (
            <div className="mt-3 pt-2 border-t border-green-100">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-green-600">📸</span>
                <span className="font-medium">Foto della pianta allegata:</span>
              </div>
              <img 
                src={plantInfo.uploadedImageUrl} 
                alt="Immagine pianta" 
                className="rounded border max-w-full h-40 object-cover shadow-sm cursor-pointer hover:shadow-md transition-shadow" 
                onClick={() => window.open(plantInfo.uploadedImageUrl, '_blank')}
              />
            </div>
          )}
        </div>
      </div>

      {/* Dati personali */}
      {userProfile && (
        <div className="p-3 bg-white rounded-lg border border-green-100">
          <div className="font-semibold text-green-800 mb-3 flex items-center gap-2">
            <span>👤</span>
            <span>I tuoi dati personali:</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">👤</span> 
              <div>
                <span className="font-medium">Nome completo:</span>
                <div className="text-gray-700">{firstName} {lastName}</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">✉️</span> 
              <div>
                <span className="font-medium">Email:</span>
                <div className="text-gray-700">{email}</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">🎂</span> 
              <div>
                <span className="font-medium">Data di nascita:</span>
                <div className="text-gray-700">{birthDate}</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">📍</span> 
              <div>
                <span className="font-medium">Luogo di nascita:</span>
                <div className="text-gray-700">{birthPlace}</div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200 text-xs text-blue-800 flex items-center gap-2">
        <span>ℹ️</span>
        <span>Tutti questi dati sono stati inviati automaticamente a Marco Nigro per una consulenza completa</span>
      </div>
    </div>
  );
};

export default UserPlantSummary;
