
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
    lightExposure: plantInfo?.lightExposure,
    fullPlantInfo: plantInfo,
    uploadedImageUrl: plantInfo?.uploadedImageUrl
  });

  // Mostra sempre il summary se c'è almeno una info della pianta o profilo utente
  if (!plantInfo && !userProfile) {
    console.log('⚠️ No plant info or user profile available');
    return null;
  }

  // Forza la visualizzazione se abbiamo qualsiasi dato
  const hasAnyPlantData = plantInfo && (
    plantInfo.symptoms || 
    plantInfo.wateringFrequency || 
    plantInfo.lightExposure || 
    plantInfo.name || 
    plantInfo.uploadedImageUrl ||
    plantInfo.isIndoor !== undefined
  );

  const hasUserData = userProfile && (
    userProfile.first_name || 
    userProfile.firstName || 
    userProfile.email
  );

  if (!hasAnyPlantData && !hasUserData) {
    console.log('⚠️ No relevant data to display');
    return null;
  }

  const firstName = userProfile?.first_name || userProfile?.firstName || "Non specificato";
  const lastName = userProfile?.last_name || userProfile?.lastName || "";
  const email = userProfile?.email || "Non specificato";
  const birthDate = userProfile?.birth_date || userProfile?.birthDate || "Non specificata";
  const birthPlace = userProfile?.birth_place || userProfile?.birthPlace || "Non specificato";

  // Dati della pianta con fallback migliori
  const plantName = plantInfo?.name || "Specie da identificare durante la consulenza";
  const environment = plantInfo?.isIndoor !== undefined ? (plantInfo.isIndoor ? "Interno" : "Esterno") : "Da specificare durante la consulenza";
  const lightExposure = plantInfo?.lightExposure || "Da specificare durante la consulenza";
  const wateringFrequency = plantInfo?.wateringFrequency || "Da specificare durante la consulenza";
  const symptoms = plantInfo?.symptoms || "Da descrivere dettagliatamente durante la consulenza";

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
    'sole-diretto': 'Sole diretto (pieno sole per molte ore al giorno)',
    'sole-parziale': 'Sole parziale (alcune ore di sole diretto)',
    'ombra-parziale': 'Ombra parziale (luce filtrata)',
    'ombra-completa': 'Ombra completa (nessun sole diretto)',
    'luce-indiretta': 'Luce indiretta (luminoso ma senza sole diretto)',
    'luce-artificiale': 'Luce artificiale (illuminazione LED/neon)'
  };

  const wateringText = wateringMap[wateringFrequency] || wateringFrequency;
  const exposureText = exposureMap[lightExposure] || lightExposure;

  return (
    <div className="bg-green-50 rounded-lg p-4 my-3 text-sm border border-green-200">
      <div className="mb-3 font-bold text-green-900 text-center flex items-center justify-center gap-2">
        <span>✅</span>
        <span>Dati inviati automaticamente all'esperto</span>
      </div>
      
      {/* Foto della pianta - SEMPRE IN EVIDENZA SE PRESENTE */}
      {plantInfo?.uploadedImageUrl && (
        <div className="mb-4 p-3 bg-white rounded-lg border border-green-100">
          <div className="font-semibold text-green-800 mb-3 flex items-center gap-2">
            <span>📸</span>
            <span>Foto della tua pianta:</span>
          </div>
          <div className="flex justify-center">
            <img 
              src={plantInfo.uploadedImageUrl} 
              alt="Immagine pianta" 
              className="rounded border max-w-full max-h-64 object-cover shadow-md cursor-pointer hover:shadow-lg transition-shadow" 
              onClick={() => window.open(plantInfo.uploadedImageUrl, '_blank')}
            />
          </div>
          <p className="text-center text-xs text-gray-600 mt-2">Clicca per ingrandire</p>
        </div>
      )}
      
      {/* Dati della pianta */}
      {hasAnyPlantData && (
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
          </div>
        </div>
      )}

      {/* Dati personali */}
      {hasUserData && (
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
