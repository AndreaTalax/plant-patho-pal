
import React from "react";
import { usePlantInfo } from "@/context/PlantInfoContext";
import { useAuth } from "@/context/AuthContext";

/**
 * Mostra SEMPRE sia i dati della pianta sia i dati personali tra quelli inviati in automatico.
 */
const UserPlantSummary: React.FC = () => {
  const { plantInfo } = usePlantInfo();
  const { userProfile } = useAuth();

  // Mostra il summary SE c'è info della pianta o profilo (basta almeno uno dei due)
  if (!(plantInfo || userProfile)) return null;

  const firstName = userProfile?.first_name || userProfile?.firstName || "Non specificato";
  const lastName = userProfile?.last_name || userProfile?.lastName || "Non specificato";
  const email = userProfile?.email || "Non specificato";
  const birthDate = userProfile?.birth_date || userProfile?.birthDate || "Non specificata";
  const birthPlace = userProfile?.birth_place || userProfile?.birthPlace || "Non specificato";

  return (
    <div className="bg-blue-100 rounded-lg p-3 my-2 text-sm font-mono">
      <div className="mb-2 font-bold text-blue-900">**Dati della pianta e personali inviati automaticamente**</div>
      <div>
        <span className="inline-flex gap-1 items-center mr-2"><span role="img" aria-label="nome">🌱</span> <b>Nome pianta:</b> {plantInfo?.name || "Non identificata"}</span><br />
        <span className="inline-flex gap-1 items-center mr-2"><span role="img" aria-label="ambiente">🏠</span> <b>Ambiente:</b> {plantInfo?.isIndoor ? "Interno" : "Esterno"}</span><br />
        <span className="inline-flex gap-1 items-center mr-2"><span role="img" aria-label="luce">☀️</span> <b>Luce:</b> {plantInfo?.lightExposure ?? "Non specificata"}</span><br />
        <span className="inline-flex gap-1 items-center mr-2"><span role="img" aria-label="acqua">💧</span> <b>Irrigazione:</b> {plantInfo?.wateringFrequency ?? "Non specificata"}</span><br />
        <span className="inline-flex gap-1 items-center mr-2"><span role="img" aria-label="sintomi">🦠</span> <b>Sintomi:</b> {plantInfo?.symptoms ?? "Non specificato"}</span>
        {plantInfo?.uploadedImageUrl && (
          <div className="mt-1">
            <span className="block font-bold">📸 Foto allegata</span>
            <img src={plantInfo.uploadedImageUrl} alt="Immagine pianta" className="rounded border max-w-xs mt-1" />
          </div>
        )}
      </div>
      <div className="mt-3 font-medium text-blue-800 border-t pt-2">
        <span className="block mb-1">**I tuoi dati personali inviati automaticamente:**</span>
        <span className="inline-flex gap-1 items-center mr-2"><span role="img" aria-label="nome">👤</span> <b>Nome:</b> {firstName} {lastName}</span><br />
        <span className="inline-flex gap-1 items-center mr-2"><span role="img" aria-label="email">✉️</span> <b>Email:</b> {email}</span><br />
        <span className="inline-flex gap-1 items-center mr-2"><span role="img" aria-label="nascita">🎂</span> <b>Data di nascita:</b> {birthDate}</span><br />
        <span className="inline-flex gap-1 items-center mr-2"><span role="img" aria-label="luogonascita">📍</span> <b>Luogo di nascita:</b> {birthPlace}</span>
      </div>
    </div>
  );
};

export default UserPlantSummary;

