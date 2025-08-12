
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  User, 
  Calendar, 
  MapPin, 
  Mail, 
  Droplets, 
  Sun, 
  Home,
  Leaf,
  Camera,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { usePlantInfo } from '@/context/PlantInfoContext';
import { useState } from 'react';

interface ComprehensiveDataDisplayProps {
  isVisible: boolean;
  onToggle: () => void;
}

export const ComprehensiveDataDisplay: React.FC<ComprehensiveDataDisplayProps> = ({
  isVisible,
  onToggle
}) => {
  const { userProfile } = useAuth();
  const { plantInfo } = usePlantInfo();
  const [expandedSection, setExpandedSection] = useState<'user' | 'plant' | 'image' | null>('plant');

  // Mostra una barra compatta quando è collassato, in modo da poterlo riaprire
  if (!isVisible) {
    return (
      <div className="border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 z-10 sticky top-0">
        <div className="p-3 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">📋 Dati Inviati all'Esperto</h3>
          <Button variant="ghost" size="sm" onClick={onToggle}>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-gray-200 bg-gray-50">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">📋 Dati Inviati all'Esperto</h3>
          <Button variant="ghost" size="sm" onClick={onToggle}>
            <ChevronUp className="h-4 w-4" />
          </Button>
        </div>

        {/* Dati Personali */}
        <Card className="border-blue-200 bg-blue-50/50">
          <div className="p-3">
            <div 
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setExpandedSection(expandedSection === 'user' ? null : 'user')}
            >
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-800">Dati Personali</span>
                <Badge variant="secondary" className="text-xs">Completo</Badge>
              </div>
              {expandedSection === 'user' ? 
                <ChevronUp className="h-4 w-4 text-blue-600" /> : 
                <ChevronDown className="h-4 w-4 text-blue-600" />
              }
            </div>
            
            {expandedSection === 'user' && userProfile && (
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center space-x-2">
                  <User className="h-3 w-3 text-gray-500" />
                  <span className="text-gray-600">Nome:</span>
                  <span className="font-medium">
                    {userProfile.first_name} {userProfile.last_name}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="h-3 w-3 text-gray-500" />
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium">{userProfile.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-3 w-3 text-gray-500" />
                  <span className="text-gray-600">Data nascita:</span>
                  <span className="font-medium">{userProfile.birth_date || 'Non specificata'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-3 w-3 text-gray-500" />
                  <span className="text-gray-600">Luogo nascita:</span>
                  <span className="font-medium">{userProfile.birth_place || 'Non specificato'}</span>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Dati Pianta */}
        <Card className="border-green-200 bg-green-50/50">
          <div className="p-3">
            <div 
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setExpandedSection(expandedSection === 'plant' ? null : 'plant')}
            >
              <div className="flex items-center space-x-2">
                <Leaf className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-800">Informazioni Pianta</span>
                <Badge variant="secondary" className="text-xs">
                  {plantInfo?.infoComplete ? 'Completo' : 'Parziale'}
                </Badge>
              </div>
              {expandedSection === 'plant' ? 
                <ChevronUp className="h-4 w-4 text-green-600" /> : 
                <ChevronDown className="h-4 w-4 text-green-600" />
              }
            </div>
            
            {expandedSection === 'plant' && plantInfo && (
              <div className="mt-3 space-y-3 text-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2">
                    <Leaf className="h-3 w-3 text-gray-500" />
                    <span className="text-gray-600">Nome/Tipo:</span>
                    <span className="font-medium">
                      {plantInfo.name || 'Specie da identificare'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Home className="h-3 w-3 text-gray-500" />
                    <span className="text-gray-600">Ambiente:</span>
                    <span className="font-medium">
                      {plantInfo.isIndoor ? 'Interno' : 'Esterno'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Droplets className="h-3 w-3 text-gray-500" />
                    <span className="text-gray-600">Irrigazione:</span>
                    <span className="font-medium">
                      {plantInfo.wateringFrequency || 'Da specificare'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Sun className="h-3 w-3 text-gray-500" />
                    <span className="text-gray-600">Esposizione:</span>
                    <span className="font-medium">
                      {plantInfo.lightExposure || 'Da specificare'}
                    </span>
                  </div>
                </div>
                
                {plantInfo.symptoms && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                    <span className="text-gray-600 text-xs">Sintomi osservati:</span>
                    <p className="font-medium text-yellow-800 mt-1">
                      {plantInfo.symptoms}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Immagine */}
        {plantInfo?.uploadedImageUrl && (
          <Card className="border-purple-200 bg-purple-50/50">
            <div className="p-3">
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setExpandedSection(expandedSection === 'image' ? null : 'image')}
              >
                <div className="flex items-center space-x-2">
                  <Camera className="h-4 w-4 text-purple-600" />
                  <span className="font-medium text-purple-800">Foto della Pianta</span>
                  <Badge variant="secondary" className="text-xs">Allegata</Badge>
                </div>
                {expandedSection === 'image' ? 
                  <ChevronUp className="h-4 w-4 text-purple-600" /> : 
                  <ChevronDown className="h-4 w-4 text-purple-600" />
                }
              </div>
              
              {expandedSection === 'image' && (
                <div className="mt-3">
                  <div className="w-full max-w-xs mx-auto">
                    <img 
                      src={plantInfo.uploadedImageUrl} 
                      alt="Pianta in consulenza" 
                      className="w-full h-auto rounded-lg border border-purple-200 shadow-sm"
                    />
                  </div>
                  <p className="text-xs text-purple-700 text-center mt-2">
                    Immagine inviata per la diagnosi
                  </p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Status Invio */}
        <div className="bg-green-100 border border-green-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-green-800 font-medium text-sm">
              ✅ Tutti i dati sono stati inviati a Marco Nigro
            </span>
          </div>
          <p className="text-green-700 text-xs mt-1">
            L'esperto ha ricevuto tutte le informazioni necessarie per la diagnosi
          </p>
        </div>
      </div>
    </div>
  );
};
