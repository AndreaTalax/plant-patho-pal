import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    setIsLoadingGBIF(true);
    setGbifInfo(null);
    try {
      const info = await GBIFService.searchSpecies(scientificName);
      setGbifInfo(info);
    } catch (error) {
      console.error('Errore GBIF:', error);
      toast.error('Impossibile recuperare dati geografici');
    } finally {
      setIsLoadingGBIF(false);
    }
  };

  const fetchPlantariumInfo = async (scientificName: string) => {
    setIsLoadingPlantarium(true);
    setPlantariumInfo(null);
    try {
      const info = await PlantariumService.getPlantInfo(scientificName);
      setPlantariumInfo(info);
    } catch (error) {
      console.error('Errore Plantarium:', error);
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
    if (!isValid) return;

    setGbifInfo(null);
    setPlantariumInfo(null);
    
    const result = await identifyPlant(file);
    if (result?.scientificName) {
      await Promise.all([
        fetchGBIFInfo(result.scientificName),
        fetchPlantariumInfo(result.scientificName)
      ]);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) await handleFileSelect(files[0]);
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) await handleFileSelect(files[0]);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const resetIdentification = () => {
    originalResetIdentification();
    setGbifInfo(null);
    setPlantariumInfo(null);
    setIsLoadingGBIF(false);
    setIsLoadingPlantarium(false);
  };

  const remainingIdentifications = getRemainingIdentifications();
  const showUpgradePrompt = !usage.has_premium_plan && !canUseIdentification();

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-drplant-green/5 to-drplant-blue-light/10 border-drplant-green/20">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-drplant-blue-dark flex items-center justify-center gap-2">
            <Leaf className="h-6 w-6 text-drplant-green" />
            Identificazione Pianta
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Carica una foto della tua pianta per scoprire di che specie si tratta
          </p>
          {user && !usage.has_premium_plan && (
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="text-sm text-gray-500">
                Identificazioni rimaste: <Badge variant="outline">{remainingIdentifications}</Badge>
              </span>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Upload Area */}
      {!identificationResult && !isIdentifying && (
        <Card className="border-2 border-dashed border-drplant-green/30 hover:border-drplant-green/50 transition-colors">
          <CardContent className="p-8">
            <div
              className={`text-center space-y-4 ${dragOver ? 'bg-drplant-green/5 rounded-lg p-4' : ''}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <div className="flex justify-center space-x-4">
                <Button
                  onClick={() => setIsCameraOpen(true)}
                  className="flex items-center gap-2"
                  size="lg"
                >
                  <Camera className="h-5 w-5" />
                  Usa Fotocamera
                </Button>
                <Button
                  onClick={triggerFileInput}
                  variant="outline"
                  size="lg"
                  className="flex items-center gap-2"
                >
                  <Upload className="h-5 w-5" />
                  Carica Foto
                </Button>
              </div>
              <p className="text-gray-500 text-sm">
                Oppure trascina qui la tua immagine
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isIdentifying && (
        <Card className="border-drplant-blue/20">
          <CardContent className="p-8 text-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-drplant-green"></div>
              <h3 className="text-lg font-semibold text-drplant-blue-dark">
                Identificazione in corso...
              </h3>
              <p className="text-gray-600">
                Sto analizzando la tua pianta e raccogliendo informazioni dettagliate
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upgrade Prompt */}
      {showUpgradePrompt && (
        <Alert className="border-amber-200 bg-amber-50">
          <Crown className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <div className="flex items-center justify-between">
              <span>Hai esaurito le identificazioni gratuite. Passa al piano Premium per identificazioni illimitate!</span>
              <Button onClick={onUpgrade} size="sm" className="ml-4">
                Upgrade
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Camera Modal */}
      {isCameraOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 max-w-md w-full mx-4">
            <CameraCapture
              onCapture={handleCameraCapture}
              onCancel={handleCameraCancel}
            />
          </div>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept="image/*"
        className="hidden"
      />

      {/* Risultati */}
      {identificationResult && !isIdentifying && (
        <Card className="border-drplant-green/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-drplant-blue-dark flex items-center gap-2">
                <Leaf className="h-5 w-5 text-drplant-green" />
                Risultato Identificazione
              </CardTitle>
              <Button variant="outline" size="sm" onClick={resetIdentification}>
                Nuova Identificazione
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              
              {/* COLONNA SINISTRA: distribuzione */}
              <div>
                <h3 className="font-semibold text-lg text-drplant-blue-dark mb-2">
                  {identificationResult.plantName}
                </h3>
                <p className="text-gray-600 italic mb-2">
                  {identificationResult.scientificName}
                </p>

                {gbifInfo || plantariumInfo ? (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Distribuzione Geografica
                    </h4>
                    <div className="space-y-2 text-sm text-blue-700">
                      {gbifInfo?.nativeCountries?.length > 0 && (
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-green-600 mt-0.5" />
                          <div>
                            <span className="font-medium">Habitat nativo (GBIF): </span>
                            {gbifInfo.nativeCountries.slice(0, 5).join(', ')}
                          </div>
                        </div>
                      )}
                      {gbifInfo?.introducedCountries?.length > 0 && (
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-blue-600 mt-0.5" />
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
                      {plantariumInfo?.distribution && (
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-purple-600 mt-0.5" />
                          <div>
                            <span className="font-medium">Distribuzione (Plantarium): </span>
                            {plantariumInfo.distribution}
                          </div>
                        </div>
                      )}
                      {plantariumInfo?.habitat && (
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-orange-600 mt-0.5" />
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

              {/* COLONNA DESTRA: caratteristiche enciclopediche */}
              <div>
                <div className="mb-4">
                  <h4 className="font-medium text-gray-700 mb-2">Caratteristiche specifiche:</h4>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    {isLoadingPlantarium ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                        <span className="text-sm text-gray-600">Caricamento informazioni enciclopediche...</span>
                      </div>
                    ) : plantariumInfo ? (
                      <div className="prose prose-sm max-w-none space-y-3">
                        <div 
                          className="text-gray-700 text-sm leading-relaxed whitespace-pre-line"
                          dangerouslySetInnerHTML={{ 
                            __html: PlantariumService.formatEncyclopedicText(plantariumInfo)
                              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
                          }}
                        />
                        {plantariumInfo.distribution && (
                          <p className="text-sm text-purple-700">
                            <strong>Distribuzione:</strong> {plantariumInfo.distribution}
                          </p>
                        )}
                        {plantariumInfo.habitat && (
                          <p className="text-sm text-orange-700">
                            <strong>Habitat:</strong> {plantariumInfo.habitat}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-700 text-sm leading-relaxed">
                        Informazioni enciclopediche non disponibili per questa specie.
                      </p>
                    )}

                    {/* Classificazione tassonomica */}
                    {gbifInfo && (
                      <div className="bg-gray-50 p-3 rounded-lg mt-3">
                        <p className="font-medium text-gray-800 mb-1">🌿 Classificazione tassonomica:</p>
                        <div className="text-gray-700 text-sm space-y-1">
                          {gbifInfo.kingdom && <div><span className="font-medium">Regno:</span> {gbifInfo.kingdom}</div>}
                          {gbifInfo.phylum && <div><span className="font-medium">Phylum:</span> {gbifInfo.phylum}</div>}
                          {gbifInfo.class && <div><span className="font-medium">Classe:</span> {gbifInfo.class}</div>}
                          {gbifInfo.order && <div><span className="font-medium">Ordine:</span> {gbifInfo.order}</div>}
                          {gbifInfo.family && <div><span className="font-medium">Famiglia:</span> {gbifInfo.family}</div>}
                          {gbifInfo.genus && <div><span className="font-medium">Genere:</span> {gbifInfo.genus}</div>}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PlantIdentificationComponent;
