import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Camera, Upload, Leaf, Info, Star, Crown, MapPin, Globe } from 'lucide-react';
import { usePlantIdentification } from '@/hooks/usePlantIdentification';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import CameraCapture from '@/components/diagnose/CameraCapture';
import { PlantImageValidator } from '@/services/plantImageValidation';
import { GBIFService, type GBIFSpeciesInfo } from '@/services/gbifService';

interface PlantIdentificationComponentProps {
  onUpgrade?: () => void;
}

const PlantIdentificationComponent: React.FC<PlantIdentificationComponentProps> = ({ onUpgrade }) => {
  const { user } = useAuth();
  const [dragOver, setDragOver] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [gbifInfo, setGbifInfo] = useState<GBIFSpeciesInfo | null>(null);
  const [isLoadingGBIF, setIsLoadingGBIF] = useState(false);
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
      toast.error("L'immagine è troppo grande. Massimo 10MB");
      return;
    }

    // Validazione contenuto pianta
    const validationResult = await PlantImageValidator.validatePlantImage(file);
    const isValid = PlantImageValidator.handleValidationResult(validationResult);
    
    if (!isValid) {
      return; // Stop processing if validation fails
    }

    const result = await identifyPlant(file);
    
    // Se l'identificazione è riuscita, recupera informazioni GBIF
    if (result?.scientificName) {
      await fetchGBIFInfo(result.scientificName);
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

  const fetchGBIFInfo = async (scientificName: string) => {
    setIsLoadingGBIF(true);
    try {
      const info = await GBIFService.searchSpecies(scientificName);
      setGbifInfo(info);
    } catch (error) {
      console.error('Errore nel recupero informazioni GBIF:', error);
    } finally {
      setIsLoadingGBIF(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Funzione per ottenere informazioni specifiche sulla pianta
  const getSpecificPlantInfo = (scientificName: string, commonName: string) => {
    const lower = scientificName.toLowerCase();
    
    if (lower.includes('dieffenbachia')) {
      return (
        <div>
          <p className="mb-2">
            <strong>Dieffenbachia seguine</strong> è una pianta tropicale perenne della famiglia delle Araceae, 
            originaria dell'America centrale e meridionale. È caratterizzata da grandi foglie ovali con 
            variegature bianche o gialle lungo le nervature.
          </p>
          <div className="bg-red-50 p-2 rounded text-red-800 text-xs mb-2">
            ⚠️ <strong>ATTENZIONE:</strong> Tutte le parti della pianta sono tossiche se ingerite. 
            La linfa può causare irritazioni cutanee e oculari.
          </div>
          <p>Può raggiungere 1-2 metri di altezza in appartamento. Le foglie giovani emergono arrotolate 
          e si sviluppano gradualmente mostrando le caratteristiche variegature.</p>
        </div>
      );
    }
    
    if (lower.includes('monstera')) {
      return (
        <p>
          Pianta rampicante epifita originaria delle foreste tropicali del Messico e dell'America Centrale. 
          Le foglie giovani sono intere, ma sviluppano le caratteristiche fenestrazioni (buchi) 
          quando la pianta matura. In natura può raggiungere 20 metri di altezza.
        </p>
      );
    }
    
    if (lower.includes('ficus')) {
      return (
        <p>
          Genere che comprende oltre 800 specie, dalle piccole piante d'appartamento agli alberi giganti. 
          Caratterizzate da foglie coriacee e dalla presenza di lattice bianco. Molte specie sono 
          strangolatori che iniziano la vita come epifite.
        </p>
      );
    }
    
    return (
      <p>
        Informazioni specifiche sulla morfologia, dimensioni e caratteristiche distintive 
        di <em>{scientificName}</em> richiedono consulenza botanica specializzata.
      </p>
    );
  };

  const getSpecificCareInstructions = (scientificName: string, commonName: string) => {
    const lower = scientificName.toLowerCase();
    
    if (lower.includes('dieffenbachia')) {
      return (
        <div className="space-y-2">
          <div><strong>Luce:</strong> Luce brillante indiretta. Evitare sole diretto che può scottare le foglie.</div>
          <div><strong>Annaffiature:</strong> Mantenere il terreno umido ma non inzuppato. Ridurre in inverno.</div>
          <div><strong>Temperatura:</strong> 18-24°C ideale. Non tollerare temperature sotto i 15°C.</div>
          <div><strong>Umidità:</strong> 50-60%. Nebulizzare regolarmente o usare sottovaso con argilla espansa.</div>
          <div><strong>Concimazione:</strong> Ogni 2 settimane in primavera-estate con fertilizzante liquido diluito.</div>
          <div><strong>Rinvaso:</strong> Ogni 2-3 anni in primavera con terriccio ben drenante.</div>
        </div>
      );
    }
    
    if (lower.includes('monstera')) {
      return (
        <div className="space-y-2">
          <div><strong>Luce:</strong> Luce brillante indiretta. Le variegature richiedono più luce.</div>
          <div><strong>Supporto:</strong> Fornire tutore muschiato per sostenere la crescita rampicante.</div>
          <div><strong>Annaffiature:</strong> Quando i primi 2-3 cm di terreno sono asciutti.</div>
          <div><strong>Umidità:</strong> Alta (60-80%). Nebulizzare radici aeree regolarmente.</div>
        </div>
      );
    }
    
    return (
      <div>
        Consultare guide specialistiche per le specifiche esigenze colturali di <em>{scientificName}</em>.
      </div>
    );
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
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('🎥 Opening camera for plant identification');
                    setIsCameraOpen(true);
                  }}
                  className="bg-drplant-green hover:bg-drplant-green-dark"
                  disabled={isIdentifying}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Scatta Foto
                </Button>
                
                <Button 
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerFileInput();
                  }}
                  variant="outline"
                  className="border-drplant-green text-drplant-green hover:bg-drplant-green hover:text-white"
                  disabled={isIdentifying}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isIdentifying ? 'Identificazione...' : 'Carica File'}
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

                {/* Informazioni geografiche e habitat da GBIF */}
                {gbifInfo ? (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Distribuzione Geografica Reale
                    </h4>
                    <div className="space-y-2 text-sm text-blue-700">
                      {gbifInfo.nativeCountries && gbifInfo.nativeCountries.length > 0 && (
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="font-medium">Habitat nativo: </span>
                            {gbifInfo.nativeCountries.slice(0, 5).join(', ')}
                            {gbifInfo.nativeCountries.length > 5 && ` e altri ${gbifInfo.nativeCountries.length - 5} paesi`}
                          </div>
                        </div>
                      )}
                      {gbifInfo.introducedCountries && gbifInfo.introducedCountries.length > 0 && (
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="font-medium">Coltivata in: </span>
                            {gbifInfo.introducedCountries.slice(0, 3).join(', ')}
                            {gbifInfo.introducedCountries.length > 3 && ` e altri ${gbifInfo.introducedCountries.length - 3} paesi`}
                          </div>
                        </div>
                      )}
                      {gbifInfo.totalOccurrences && (
                        <div className="text-xs text-blue-600 mt-2">
                          📊 {gbifInfo.totalOccurrences.toLocaleString()} osservazioni registrate in GBIF
                        </div>
                      )}
                    </div>
                  </div>
                ) : isLoadingGBIF ? (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 text-gray-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                      <span className="text-sm">Caricamento dati geografici...</span>
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

              {/* Descrizione e caratteristiche */}
              <div>
                <div className="mb-4">
                  <h4 className="font-medium text-gray-700 mb-2">Caratteristiche specifiche:</h4>
                  <div className="text-sm text-gray-600 space-y-2">
                    {getSpecificPlantInfo(identificationResult.scientificName, identificationResult.plantName)}
                    
                    <div className="bg-green-50 p-3 rounded-lg mt-3">
                      <p className="font-medium text-green-800 mb-1">💡 Consigli di cura specifici:</p>
                      <div className="text-green-700">
                        {getSpecificCareInstructions(identificationResult.scientificName, identificationResult.plantName)}
                      </div>
                    </div>

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

                {identificationResult.description && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Descrizione botanica:</h4>
                    <p className="text-sm text-gray-600 line-clamp-4">
                      {identificationResult.description}
                    </p>
                  </div>
                )}
              </div>
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