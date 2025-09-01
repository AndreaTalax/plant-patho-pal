
import React from 'react';
import { usePlantInfo } from '@/context/PlantInfoContext';
import { usePlantDiagnosis } from '@/hooks/usePlantDiagnosis';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Leaf, Camera, Droplets, Sun, Home, MapPin } from 'lucide-react';

export const PlantDataDetails = () => {
  const { plantInfo } = usePlantInfo();
  const { uploadedImage } = usePlantDiagnosis();

  console.log('🌿 PlantDataDetails - Checking for plant photo:', {
    plantInfoImage: plantInfo.uploadedImageUrl,
    diagnosisImage: uploadedImage,
    plantInfo: plantInfo
  });

  // Priorità: plantInfo.uploadedImageUrl -> uploadedImage -> null
  const displayImage = plantInfo.uploadedImageUrl || uploadedImage;

  if (!plantInfo.infoComplete && !displayImage) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6 text-center text-gray-500">
          <Leaf className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Nessun dato della pianta disponibile</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Leaf className="w-5 h-5 text-drplant-green" />
          Informazioni Pianta
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Immagine della pianta */}
        {displayImage && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Camera className="w-4 h-4" />
              Foto della pianta
            </div>
            <div className="w-full max-w-sm mx-auto">
              <img 
                src={displayImage}
                alt="Pianta caricata"
                className="w-full h-48 object-cover rounded-lg border shadow-sm"
                onError={(e) => {
                  console.error('Error loading plant image:', displayImage);
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          </div>
        )}

        {/* Nome pianta */}
        {plantInfo.name && plantInfo.name !== 'Pianta non identificata' && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Leaf className="w-4 h-4" />
              Nome
            </div>
            <p className="text-gray-900 pl-6">{plantInfo.name}</p>
          </div>
        )}

        {/* Ambiente */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Home className="w-4 h-4" />
            Ambiente
          </div>
          <p className="text-gray-900 pl-6">
            {plantInfo.isIndoor ? 'Interno' : 'Esterno'}
          </p>
        </div>

        {/* Irrigazione */}
        {plantInfo.wateringFrequency && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Droplets className="w-4 h-4" />
              Frequenza irrigazione
            </div>
            <p className="text-gray-900 pl-6">{plantInfo.wateringFrequency}</p>
          </div>
        )}

        {/* Esposizione alla luce */}
        {plantInfo.lightExposure && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Sun className="w-4 h-4" />
              Esposizione alla luce
            </div>
            <p className="text-gray-900 pl-6">{plantInfo.lightExposure}</p>
          </div>
        )}

        {/* Sintomi */}
        {plantInfo.symptoms && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <MapPin className="w-4 h-4" />
              Sintomi osservati
            </div>
            <p className="text-gray-900 pl-6">{plantInfo.symptoms}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
