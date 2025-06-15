
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
    hasImage: !!plantInfo?.uploadedImageUrl
  });

  // Mostra il summary SE c'è info della pianta o profilo (basta almeno uno dei due)
  if (!(plantInfo || userProfile)) {
    console.log('⚠️ No plant info or user profile available');
    return null;
  }

  const firstName = userProfile?.first_name || userProfile?.firstName || "Non specificato";
  const lastName = userProfile?.last_name || userProfile?.lastName || "Non specificato";
  const email = userProfile?.email || "Non specificato";
  const birthDate = userProfile?.birth_date || userProfile?.birthDate || "Non specificata";
  const birthPlace = userProfile?.birth_place || userProfile?.birthPlace || "Non specificato";

  return (
    <div className="bg-blue-50 rounded-lg p-4 my-3 text-sm border border-blue-200">
      <div className="mb-3 font-bold text-blue-900 text-center">
        **Dati della pianta e personali inviati automaticamente**
      </div>
      
      {/* Dati della pianta */}
      {plantInfo && (
        <div className="mb-4 p-3 bg-white rounded-lg border border-blue-100">
          <div className="font-semibold text-blue-800 mb-2">🌱 Dati della Pianta:</div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span role="img" aria-label="nome">🏷️</span> 
              <b>Nome pianta:</b> {plantInfo.name || "Non identificata"}
            </div>
            <div className="flex items-center gap-2">
              <span role="img" aria-label="ambiente">🏠</span> 
              <b>Ambiente:</b> {plantInfo.isIndoor ? "Interno" : "Esterno"}
            </div>
            <div className="flex items-center gap-2">
              <span role="img" aria-label="luce">☀️</span> 
              <b>Luce:</b> {plantInfo.lightExposure ?? "Non specificata"}
            </div>
            <div className="flex items-center gap-2">
              <span role="img" aria-label="acqua">💧</span> 
              <b>Irrigazione:</b> {plantInfo.wateringFrequency ?? "Non specificata"}
            </div>
            <div className="flex items-center gap-2">
              <span role="img" aria-label="sintomi">🦠</span> 
              <b>Sintomi:</b> {plantInfo.symptoms ?? "Non specificato"}
            </div>
            {plantInfo.uploadedImageUrl && (
              <div className="mt-2">
                <div className="flex items-center gap-2 mb-2">
                  <span role="img" aria-label="foto">📸</span>
                  <span className="font-bold">Foto allegata:</span>
                </div>
                <img 
                  src={plantInfo.uploadedImageUrl} 
                  alt="Immagine pianta" 
                  className="rounded border max-w-full h-32 object-cover shadow-sm" 
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dati personali */}
      {userProfile && (
        <div className="p-3 bg-white rounded-lg border border-blue-100">
          <div className="font-semibold text-blue-800 mb-2">👤 I tuoi Dati Personali:</div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span role="img" aria-label="nome">👤</span> 
              <b>Nome:</b> {firstName} {lastName}
            </div>
            <div className="flex items-center gap-2">
              <span role="img" aria-label="email">✉️</span> 
              <b>Email:</b> {email}
            </div>
            <div className="flex items-center gap-2">
              <span role="img" aria-label="nascita">🎂</span> 
              <b>Data di nascita:</b> {birthDate}
            </div>
            <div className="flex items-center gap-2">
              <span role="img" aria-label="luogonascita">📍</span> 
              <b>Luogo di nascita:</b> {birthPlace}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserPlantSummary;
