
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Leaf, MapPin, Calendar, Droplets, Sun, Home, Camera } from 'lucide-react';
import { usePlantInfo } from '@/context/PlantInfoContext';
import { useAuth } from '@/context/AuthContext';

interface UserDataDisplayProps {
  isVisible: boolean;
}

export const UserDataDisplay: React.FC<UserDataDisplayProps> = ({ isVisible }) => {
  const { plantInfo } = usePlantInfo();
  const { userProfile } = useAuth();

  if (!isVisible) return null;

  return (
    <div className="space-y-4 p-4 bg-blue-50/50 border-l-4 border-blue-400 rounded-lg">
      <div className="flex items-center gap-2 text-blue-700 font-semibold">
        <User className="h-4 w-4" />
        <span>Dati inviati automaticamente all'esperto</span>
      </div>

      {/* Dati Personali */}
      <Card className="bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <User className="h-4 w-4" />
            Dati Personali
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="font-medium text-gray-600">Nome:</span>
              <p className="text-gray-800">
                {userProfile?.first_name || userProfile?.firstName || 'Non specificato'} {' '}
                {userProfile?.last_name || userProfile?.lastName || ''}
              </p>
            </div>
            <div>
              <span className="font-medium text-gray-600">Email:</span>
              <p className="text-gray-800">{userProfile?.email || 'Non specificata'}</p>
            </div>
            <div>
              <span className="font-medium text-gray-600">Data di nascita:</span>
              <p className="text-gray-800 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {userProfile?.birth_date || userProfile?.birthDate || 'Non specificata'}
              </p>
            </div>
            <div>
              <span className="font-medium text-gray-600">Luogo di nascita:</span>
              <p className="text-gray-800 flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {userProfile?.birth_place || userProfile?.birthPlace || 'Non specificato'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dati Pianta */}
      <Card className="bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Leaf className="h-4 w-4" />
            Informazioni Pianta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {plantInfo?.name && (
            <div>
              <span className="font-medium text-gray-600 text-xs">Nome/Tipo:</span>
              <p className="text-gray-800 text-sm">{plantInfo.name}</p>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="font-medium text-gray-600">Ambiente:</span>
              <p className="text-gray-800 flex items-center gap-1 mt-1">
                <Home className="h-3 w-3" />
                {plantInfo?.isIndoor !== undefined 
                  ? (plantInfo.isIndoor ? 'Interno' : 'Esterno') 
                  : 'Da specificare'
                }
              </p>
            </div>
            <div>
              <span className="font-medium text-gray-600">Esposizione:</span>
              <p className="text-gray-800 flex items-center gap-1 mt-1">
                <Sun className="h-3 w-3" />
                {plantInfo?.lightExposure || 'Da specificare'}
              </p>
            </div>
            <div>
              <span className="font-medium text-gray-600">Irrigazione:</span>
              <p className="text-gray-800 flex items-center gap-1 mt-1">
                <Droplets className="h-3 w-3" />
                {plantInfo?.wateringFrequency || 'Da specificare'}
              </p>
            </div>
            <div>
              <span className="font-medium text-gray-600">IA Usata:</span>
              <Badge variant={plantInfo?.useAI ? "default" : "secondary"} className="text-xs">
                {plantInfo?.useAI ? 'Sì' : 'No'}
              </Badge>
            </div>
          </div>

          {plantInfo?.symptoms && (
            <div>
              <span className="font-medium text-gray-600 text-xs">Sintomi:</span>
              <p className="text-gray-800 text-sm mt-1 bg-yellow-50 p-2 rounded border-l-3 border-yellow-400">
                {plantInfo.symptoms}
              </p>
            </div>
          )}

          {plantInfo?.uploadedImageUrl && (
            <div>
              <span className="font-medium text-gray-600 text-xs flex items-center gap-1">
                <Camera className="h-3 w-3" />
                Immagine allegata:
              </span>
              <div className="mt-2">
                <img 
                  src={plantInfo.uploadedImageUrl} 
                  alt="Pianta" 
                  className="w-20 h-20 object-cover rounded-lg border-2 border-gray-200 cursor-pointer hover:border-blue-400 transition-colors"
                  onClick={() => window.open(plantInfo.uploadedImageUrl, '_blank')}
                />
              </div>
            </div>
          )}

          {(plantInfo as any)?.aiDiagnosis && (
            <div>
              <span className="font-medium text-gray-600 text-xs">Diagnosi IA:</span>
              <div className="mt-1 p-2 bg-green-50 rounded border-l-3 border-green-400">
                <p className="text-sm text-green-800">
                  {typeof (plantInfo as any).aiDiagnosis === 'string' 
                    ? (plantInfo as any).aiDiagnosis 
                    : JSON.stringify((plantInfo as any).aiDiagnosis, null, 2)
                  }
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
