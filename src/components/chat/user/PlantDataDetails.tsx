
import React from "react";
import { usePlantInfo } from "@/context/PlantInfoContext";

interface PlantDataDetailsProps {
  plantName?: string;
  symptoms: string;
  wateringText: string;
  environment: string;
  exposureText: string;
  imgUploaded: boolean;
  hasAiDiagnosis?: boolean;
  imageUrl?: string; // opzionale: se non passato, usiamo il valore dal contesto
}

const PlantDataDetails: React.FC<PlantDataDetailsProps> = ({
  plantName,
  symptoms,
  wateringText,
  environment,
  exposureText,
  imgUploaded,
  hasAiDiagnosis,
  imageUrl,
}) => {
  const { plantInfo } = usePlantInfo();
  const previewUrl = imageUrl || plantInfo?.uploadedImageUrl || null;

  return (
    <div className="space-y-2">
      {plantName && (
        <div className="flex flex-wrap">
          <span className="font-medium text-sm">• Nome pianta:</span>
          <span className="text-sm ml-1 text-green-700 font-medium">{plantName}</span>
        </div>
      )}
      
      {symptoms && (
        <div className="flex flex-wrap">
          <span className="font-medium text-sm">• Sintomi:</span>
          <span className="text-sm ml-1">{symptoms}</span>
        </div>
      )}
      
      {wateringText && (
        <div className="flex flex-wrap">
          <span className="font-medium text-sm">• Irrigazione:</span>
          <span className="text-sm ml-1">{wateringText}</span>
        </div>
      )}
      
      {(environment || exposureText) && (
        <div className="flex flex-wrap">
          <span className="font-medium text-sm">• Esposizione:</span>
          <span className="text-sm ml-1">
            {environment && exposureText ? `${environment}, ${exposureText}` : environment || exposureText}
          </span>
        </div>
      )}
      
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap">
          <span className="font-medium text-sm">• Immagine:</span>
          <span className={`text-sm ml-1 font-medium ${imgUploaded ? 'text-green-700' : 'text-gray-400'}`}>
            {imgUploaded ? "Caricata ✓" : "Non caricata ✗"}
          </span>
        </div>

        {previewUrl && (
          <div className="mt-1">
            <img
              src={previewUrl}
              alt="Foto pianta caricata"
              className="w-full max-w-xs rounded-md border shadow-sm"
            />
          </div>
        )}
      </div>
      
      {hasAiDiagnosis && (
        <div className="flex flex-wrap">
          <span className="font-medium text-sm">• Diagnosi AI:</span>
          <span className="text-sm ml-1 text-blue-700 font-medium">Disponibile ✓</span>
        </div>
      )}
    </div>
  );
};

export default PlantDataDetails;

