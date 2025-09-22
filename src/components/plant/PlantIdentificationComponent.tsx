import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Camera, Upload, Leaf, Info, Star, Crown, MapPin, Globe } from 'lucide-react';
import { usePlantIdentification } from '@/hooks/usePlantIdentification';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import CameraCapture from '@/components/diagnose/CameraCapture';
import { PlantImageValidator } from '@/services/plantImageValidation';
import { GBIFService, type GBIFSpeciesInfo } from '@/services/gbifService';
import { PlantariumService, type PlantariumPlantInfo } from '@/services/plantariumService';

interface PlantIdentificationComponentProps {
  onUpgrade?: () => void;
}

const PlantIdentificationComponent: React.FC<PlantIdentificationComponentProps> = ({ onUpgrade }) => {
  const { user } = useAuth();
  const [dragOver, setDragOver] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [gbifInfo, setGbifInfo] = useState<GBIFSpeciesInfo | null>(null);
  const [isLoadingGBIF, setIsLoadingGBIF] = useState(false);
  const [plantariumInfo, setPlantariumInfo] = useState<PlantariumPlantInfo | null>(null);
  const [isLoadingPlantarium, setIsLoadingPlantarium] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const {
    isIdentifying,
    identificationResult,
    usage,
    canUseIdentification,
    identifyPlant,
    resetIdentification: originalResetIdentification,
    loadIdentificationUsage,
    getRemainingIdentifications
  } = usePlantIdentification();

  React.useEffect(() => {
    if (user) {
      loadIdentificationUsage();
    }
  }, [user, loadIdentificationUsage]);

  const fetchGBIFInfo = async (scientificName: string) => {
    console.log('🔍 Avvio ricerca GBIF per:', scientificName);
    setIsLoadingGBIF(true);
    setGbifInfo(null);
    
    try {
      const info = await GBIFService.searchSpecies(scientificName);
      console.log('📊 Dati GBIF ricevuti:', info);
      setGbifInfo(info);
    } catch (error) {
      console.error('❌ Errore nel recupero informazioni GBIF:', error);
      toast.error('Impossibile recuperare dati geografici');
    } finally {
      setIsLoadingGBIF(false);
    }
  };

  const fetchPlantariumInfo = async (scientificName: string) => {
    console.log('📖 Avvio ricerca Plantarium per:', scientificName);
    setIsLoadingPlantarium(true);
    setPlantariumInfo(null);
    
    try {
      const info = await PlantariumService.getPlantInfo(scientificName);
      console.log('📚 Dati Plantarium ricevuti:', info);
      setPlantariumInfo(info);
    } catch (error) {
      console.error('❌ Errore nel recupero informazioni Plantarium:', error);
      toast.error('Impossibile recuperare informazioni enciclopediche');
    } finally {
      setIsLoadingPlantarium(false);
    }
  };

  const handleCameraCapture = async (imageDataUrl: string) => {
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

    if (!file.type.startsWith('image/')) {
      toast.error('Per favore seleziona un file immagine valido');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("L'immagine è troppo grande. Massimo 10MB");
      return;
    }

    const validationResult = await PlantImageValidator.validatePlantImage(file);
    const isValid = PlantImageValidator.handleValidationResult(validationResult);
    
    if (!isValid) {
      return;
    }

    setGbifInfo(null);
    setPlantariumInfo(null);
    
    const result = await identifyPlant(file);
    
    if (result?.scientificName) {
      console.log('🌍 Recupero dati esterni per:', result.scientificName);
      await Promise.all([
        fetchGBIFInfo(result.scientificName),
        fetchPlantariumInfo(result.scientificName)
      ]);
    } else {
      console.log('❌ Nessun nome scientifico disponibile per ricerche esterne');
    }
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

  const resetIdentification = () => {
    originalResetIdentification();
    setGbifInfo(null);
    setIsLoadingGBIF(false);
    setPlantariumInfo(null);
    setIsLoadingPlantarium(false);
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

      {/* Upload Area */}
      {/* ... resto invariato ... */}

      {/* Risultati */}
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
                
                {/* Sezione Distribuzione aggiornata */}
                {gbifInfo || plantariumInfo ? (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Distribuzione Geografica
                    </h4>
                    <div className="space-y-2 text-sm text-blue-700">
                      {/* Dati GBIF */}
                      {gbifInfo?.nativeCountries?.length > 0 && (
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="font-medium">Habitat nativo (GBIF): </span>
                            {gbifInfo.nativeCountries.slice(0, 5).join(', ')}
                          </div>
                        </div>
                      )}
                      {gbifInfo?.introducedCountries?.length > 0 && (
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="font-medium">Coltivata in (GBIF): </span>
                            {gbifInfo.introducedCountries.slice(0, 3).join(', ')}
                          </div>
                        </div>
                      )}
                      {gbifInfo?.totalOccurrences && (
                        <div className="text-xs text-blue-600 mt-2">
                          📊 {gbifInfo.totalOccurrences.toLocaleString()} osservazioni registrate in GBIF
                        </div>
                      )}
                      {/* Dati Plantarium */}
                      {plantariumInfo?.distribution && (
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="font-medium">Distribuzione (Plantarium): </span>
                            {plantariumInfo.distribution}
                          </div>
                        </div>
                      )}
                      {plantariumInfo?.habitat && (
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="font-medium">Habitat (Plantarium): </span>
                            {plantariumInfo.habitat}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-600 mb-2 flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      Informazioni Geografiche
                    </h4>
                    <p className="text-sm text-gray-600">
                      Dati geografici specifici non disponibili per questa specie.
                    </p>
                  </div>
                )}
              </div>

              {/* Colonna caratteristiche Plantarium */}
              <div>
                {/* ... resto invariato ... */}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PlantIdentificationComponent;
