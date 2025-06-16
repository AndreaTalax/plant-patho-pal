
import React from "react";
import { usePlantInfo } from "@/context/PlantInfoContext";
import { useAuth } from "@/context/AuthContext";
import { Info, User, Leaf, Camera, MapPin, Calendar, Mail, Droplet, Sun, Home } from "lucide-react";

const UserPlantSummary: React.FC = () => {
  const { plantInfo } = usePlantInfo();
  const { userProfile } = useAuth();

  console.log('🔍 UserPlantSummary - PlantInfo:', plantInfo);
  console.log('🔍 UserPlantSummary - UserProfile:', userProfile);

  // User data - comprehensive extraction with multiple fallbacks
  const firstName = userProfile?.first_name || userProfile?.firstName || "";
  const lastName = userProfile?.last_name || userProfile?.lastName || "";
  const email = userProfile?.email || "";
  const birthDate = userProfile?.birth_date || userProfile?.birthDate || "";
  const birthPlace = userProfile?.birth_place || userProfile?.birthPlace || "";

  // Plant data - comprehensive extraction with detailed mapping
  const symptoms = plantInfo?.symptoms || "";
  const watering = plantInfo?.wateringFrequency || "";
  const exposure = plantInfo?.lightExposure || "";
  const plantName = plantInfo?.name || "";
  const environment = plantInfo?.isIndoor === undefined 
    ? "" 
    : plantInfo.isIndoor 
      ? "Interno" 
      : "Esterno";
  
  // Check for all possible image sources
  const plantImageUrl = plantInfo?.uploadedImageUrl || 
                       plantInfo?.uploadedFile || 
                       plantInfo?.imageUrl ||
                       (plantInfo as any)?.image ||
                       (plantInfo as any)?.plantImage;
  
  const hasAiDiagnosis = !!(plantInfo as any)?.aiDiagnosis || 
                        !!(plantInfo as any)?.diagnosis ||
                        !!(plantInfo as any)?.analysisResult;

  console.log('🖼️ Image URL found:', plantImageUrl);

  // Enhanced mapping for display
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
  const hasPlantData = !!(symptoms || watering || exposure || plantName || plantImageUrl || hasAiDiagnosis);
  
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
          <div className="bg-gray-50 rounded-lg p-3 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-blue-700 border-b border-blue-100 pb-2">
              <User className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <span>Profilo Utente</span>
            </div>
            <div className="space-y-2">
              {(firstName || lastName) && (
                <div className="flex items-center gap-2">
                  <User className="w-3 h-3 text-gray-500 flex-shrink-0" />
                  <span className="text-xs font-medium text-gray-600">Nome:</span>
                  <span className="text-xs text-gray-800 font-semibold uppercase">
                    {`${firstName} ${lastName}`.trim()}
                  </span>
                </div>
              )}
              
              {email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-3 h-3 text-gray-500 flex-shrink-0" />
                  <span className="text-xs font-medium text-gray-600">Email:</span>
                  <span className="text-xs text-gray-800">{email}</span>
                </div>
              )}
              
              {birthDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-3 h-3 text-gray-500 flex-shrink-0" />
                  <span className="text-xs font-medium text-gray-600">Data di nascita:</span>
                  <span className="text-xs text-gray-800">{birthDate}</span>
                </div>
              )}
              
              {birthPlace && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-3 h-3 text-gray-500 flex-shrink-0" />
                  <span className="text-xs font-medium text-gray-600">Luogo di nascita:</span>
                  <span className="text-xs text-gray-800">{birthPlace}</span>
                </div>
              )}
            </div>
          </div>
        )}
        
        {hasPlantData && (
          <div className="bg-green-50 rounded-lg p-3 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-green-700 border-b border-green-100 pb-2">
              <Leaf className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span>Dati della Pianta</span>
            </div>
            <div className="space-y-2">
              {plantName && (
                <div className="flex items-center gap-2">
                  <Leaf className="w-3 h-3 text-gray-500 flex-shrink-0" />
                  <span className="text-xs font-medium text-gray-600">Nome pianta:</span>
                  <span className="text-xs text-green-700 font-semibold">{plantName}</span>
                </div>
              )}
              
              {symptoms && (
                <div className="flex items-start gap-2">
                  <Info className="w-3 h-3 text-gray-500 flex-shrink-0 mt-0.5" />
                  <span className="text-xs font-medium text-gray-600">Sintomi:</span>
                  <span className="text-xs text-gray-800 flex-1">{symptoms}</span>
                </div>
              )}
              
              {wateringText && (
                <div className="flex items-center gap-2">
                  <Droplet className="w-3 h-3 text-gray-500 flex-shrink-0" />
                  <span className="text-xs font-medium text-gray-600">Irrigazione:</span>
                  <span className="text-xs text-gray-800">{wateringText}</span>
                </div>
              )}
              
              {environment && (
                <div className="flex items-center gap-2">
                  <Home className="w-3 h-3 text-gray-500 flex-shrink-0" />
                  <span className="text-xs font-medium text-gray-600">Ambiente:</span>
                  <span className="text-xs text-gray-800">{environment}</span>
                </div>
              )}
              
              {exposureText && (
                <div className="flex items-center gap-2">
                  <Sun className="w-3 h-3 text-gray-500 flex-shrink-0" />
                  <span className="text-xs font-medium text-gray-600">Esposizione:</span>
                  <span className="text-xs text-gray-800">{exposureText}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <Camera className="w-3 h-3 text-gray-500 flex-shrink-0" />
                <span className="text-xs font-medium text-gray-600">Immagine:</span>
                <span className={`text-xs font-semibold ${plantImageUrl ? 'text-green-700' : 'text-red-500'}`}>
                  {plantImageUrl ? "Caricata ✓" : "Non caricata ✗"}
                </span>
              </div>
              
              {hasAiDiagnosis && (
                <div className="flex items-center gap-2">
                  <Info className="w-3 h-3 text-gray-500 flex-shrink-0" />
                  <span className="text-xs font-medium text-gray-600">Diagnosi AI:</span>
                  <span className="text-xs text-blue-700 font-semibold">Disponibile ✓</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sezione Immagine Separata e Prominente */}
        {plantImageUrl && (
          <div className="bg-purple-50 rounded-lg p-3 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-purple-700 border-b border-purple-100 pb-2">
              <Camera className="w-4 h-4 text-purple-500 flex-shrink-0" />
              <span>Immagine della Pianta</span>
            </div>
            <div className="text-center">
              <img 
                src={plantImageUrl} 
                alt="Immagine della pianta analizzata" 
                className="w-full max-w-sm mx-auto rounded-lg shadow-md border border-gray-200 cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => window.open(plantImageUrl, '_blank')}
                onError={(e) => {
                  console.error('❌ Errore caricamento immagine:', plantImageUrl);
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
                onLoad={() => {
                  console.log('✅ Immagine caricata con successo:', plantImageUrl);
                }}
              />
              <p className="text-xs text-purple-600 mt-2 font-medium">
                📸 Clicca per ingrandire • Condivisa con l'esperto
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserPlantSummary;
