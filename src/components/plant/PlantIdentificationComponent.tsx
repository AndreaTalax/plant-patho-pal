import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Camera, Upload, Leaf, Info, Star, Crown } from 'lucide-react';
import { usePlantIdentification } from '@/hooks/usePlantIdentification';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import CameraCapture from '@/components/diagnose/CameraCapture';

interface PlantIdentificationComponentProps {
  onUpgrade?: () => void;
}

const PlantIdentificationComponent: React.FC<PlantIdentificationComponentProps> = ({ onUpgrade }) => {
  const { user } = useAuth();
  const [dragOver, setDragOver] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const {
    isIdentifying,
    identificationResult,
    usage,
    canUseIdentification,
    identifyPlant,
    resetIdentification,
    loadIdentificationUsage,
    getRemainingIdentifications
  } = usePlantIdentification();

  React.useEffect(() => {
    if (user) {
      loadIdentificationUsage();
    }
  }, [user, loadIdentificationUsage]);

  const handleCameraCapture = async (imageDataUrl: string) => {
    // Convert data URL to File
    const response = await fetch(imageDataUrl);
    const blob = await response.blob();
    const file = new File([blob], 'camera-photo.jpg', { type: 'image/jpeg' });
    setIsCameraOpen(false);
    await handleFileSelect(file);
  };

  const handleCameraCancel = () => {
    setIsCameraOpen(false);
  };

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    // Validazione del tipo di file
    if (!file.type.startsWith('image/')) {
      toast.error('Per favore seleziona un file immagine valido');
      return;
    }

    // Validazione della dimensione del file (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('L\'immagine è troppo grande. Massimo 10MB');
      return;
    }

    await identifyPlant(file);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await handleFileSelect(files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const remainingIdentifications = getRemainingIdentifications();
  const showUpgradePrompt = !usage.has_premium_plan && !canUseIdentification();

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Leaf className="h-8 w-8 text-drplant-green" />
          <h2 className="text-3xl font-bold text-drplant-blue-dark">
            Identificazione Piante
          </h2>
        </div>
        <p className="text-gray-600">
          Identifica qualsiasi pianta caricando una foto con la tecnologia Plant.ID
        </p>
      </div>

      {/* Usage Status */}
      <Card className="border-drplant-green/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {usage.has_premium_plan ? (
                <Crown className="h-5 w-5 text-yellow-500" />
              ) : (
                <Star className="h-5 w-5 text-drplant-green" />
              )}
              <div>
                <p className="font-medium">
                  {usage.has_premium_plan ? 'Piano Premium' : 'Piano Gratuito'}
                </p>
                <p className="text-sm text-gray-600">
                  {usage.has_premium_plan 
                    ? 'Identificazioni illimitate' 
                    : `${remainingIdentifications} identificazioni rimanenti`
                  }
                </p>
              </div>
            </div>
            {!usage.has_premium_plan && (
              <Badge variant="outline" className="border-drplant-green text-drplant-green">
                3 prove gratuite
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Prompt */}
      {showUpgradePrompt && (
        <Alert className="border-amber-200 bg-amber-50">
          <Info className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            Hai esaurito le 3 identificazioni gratuite. 
            <Button 
              variant="link" 
              className="p-0 h-auto text-amber-800 underline ml-1"
              onClick={onUpgrade}
            >
              Abbonati per identificazioni illimitate
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Upload Area */}
      <Card 
        className={`border-2 border-dashed transition-all duration-300 cursor-pointer ${
          dragOver 
            ? 'border-drplant-green bg-drplant-green/5' 
            : canUseIdentification() 
              ? 'border-gray-300 hover:border-drplant-green hover:bg-drplant-green/5' 
              : 'border-gray-200 bg-gray-50 cursor-not-allowed'
        }`}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          if (canUseIdentification()) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onClick={canUseIdentification() ? triggerFileInput : undefined}
      >
        <CardContent className="p-8 text-center">
          <div className="space-y-4">
            <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${
              canUseIdentification() 
                ? 'bg-drplant-green/10' 
                : 'bg-gray-100'
            }`}>
              <Upload className={`h-8 w-8 ${
                canUseIdentification() ? 'text-drplant-green' : 'text-gray-400'
              }`} />
            </div>
            
            <div>
              <h3 className={`text-lg font-semibold mb-2 ${
                canUseIdentification() ? 'text-gray-900' : 'text-gray-400'
              }`}>
                Carica una foto della pianta
              </h3>
              <p className={`text-sm ${
                canUseIdentification() ? 'text-gray-600' : 'text-gray-400'
              }`}>
                Trascina e rilascia un'immagine qui, oppure usa i pulsanti qui sotto
              </p>
              <p className={`text-xs mt-2 ${
                canUseIdentification() ? 'text-gray-500' : 'text-gray-400'
              }`}>
                Formati supportati: JPG, PNG, WEBP (max 10MB)
              </p>
            </div>

            {canUseIdentification() && (
              <div className="flex gap-3 justify-center">
                <Button 
                  onClick={() => setIsCameraOpen(true)}
                  className="bg-drplant-green hover:bg-drplant-green-dark"
                  disabled={isIdentifying}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Fotocamera
                </Button>
                
                <Button 
                  onClick={triggerFileInput}
                  variant="outline"
                  className="border-drplant-green text-drplant-green hover:bg-drplant-green hover:text-white"
                  disabled={isIdentifying}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isIdentifying ? 'Identificazione...' : 'Seleziona File'}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
        disabled={!canUseIdentification()}
      />

      {/* Loading State */}
      {isIdentifying && (
        <Card className="border-drplant-green/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-drplant-green"></div>
              <span className="text-drplant-green font-medium">
                Identificazione in corso con Plant.ID...
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {identificationResult && !isIdentifying && (
        <Card className="border-drplant-green/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-drplant-blue-dark flex items-center gap-2">
                <Leaf className="h-5 w-5 text-drplant-green" />
                Risultato Identificazione
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={resetIdentification}
              >
                Nuova Identificazione
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-lg text-drplant-blue-dark mb-2">
                  {identificationResult.plantName}
                </h3>
                <p className="text-gray-600 italic mb-2">
                  {identificationResult.scientificName}
                </p>
                
                <div className="flex items-center gap-2 mb-3">
                  <Badge className="bg-drplant-green/10 text-drplant-green border-drplant-green/20">
                    Confidenza: {identificationResult.confidence}%
                  </Badge>
                </div>

                {identificationResult.familyName && (
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">Famiglia:</span> {identificationResult.familyName}
                  </p>
                )}

                {identificationResult.commonNames.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700 mb-1">Nomi comuni:</p>
                    <div className="flex flex-wrap gap-1">
                      {identificationResult.commonNames.slice(0, 3).map((name, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {identificationResult.description && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Descrizione:</h4>
                  <p className="text-sm text-gray-600 line-clamp-4">
                    {identificationResult.description}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Camera Modal */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50">
          <CameraCapture
            onCapture={handleCameraCapture}
            onCancel={handleCameraCancel}
          />
        </div>
      )}
    </div>
  );
};

export default PlantIdentificationComponent;