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
    setGbifInfo(null); // Reset stato precedente
    
    try {
      const info = await GBIFService.searchSpecies(scientificName);
      console.log('📊 Dati GBIF ricevuti:', info);
      setGbifInfo(info);
      
      if (info) {
        console.log('✅ GBIF info impostata con successo');
      } else {
        console.log('⚠️ Nessun dato GBIF trovato per questa specie');
      }
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
    setPlantariumInfo(null); // Reset stato precedente
    
    try {
      const info = await PlantariumService.getPlantInfo(scientificName);
      console.log('📚 Dati Plantarium ricevuti:', info);
      setPlantariumInfo(info);
      
      if (info) {
        console.log('✅ Plantarium info impostata con successo');
      } else {
        console.log('⚠️ Nessun dato Plantarium trovato per questa specie');
      }
    } catch (error) {
      console.error('❌ Errore nel recupero informazioni Plantarium:', error);
      toast.error('Impossibile recuperare informazioni enciclopediche');
    } finally {
      setIsLoadingPlantarium(false);
    }
  };

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

    // Reset info per nuova identificazione
    setGbifInfo(null);
    setPlantariumInfo(null);
    
    const result = await identifyPlant(file);
    
    // Se l'identificazione è riuscita, recupera informazioni da entrambe le fonti
    if (result?.scientificName) {
      console.log('🌍 Recupero dati esterni per:', result.scientificName);
      
      // Fetch parallelo per migliori performance
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

  // Reset identificazione e dati esterni
  const resetIdentification = () => {
    originalResetIdentification();
    setGbifInfo(null);
    setIsLoadingGBIF(false);
    setPlantariumInfo(null);
    setIsLoadingPlantarium(false);
  };

  // Funzione per ottenere informazioni enciclopediche specifiche sulla pianta
  const getSpecificPlantInfo = (scientificName: string, commonName: string) => {
    const lower = scientificName.toLowerCase();
    
    if (lower.includes('dieffenbachia')) {
      return (
        <div className="space-y-3">
          <p>
            <strong>Dieffenbachia seguine</strong> (Jacq.) Schott è una pianta erbacea perenne appartenente 
            alla famiglia delle Araceae, originaria delle regioni tropicali dell'America centrale e meridionale, 
            particolarmente diffusa dal Messico al nord del Sud America.
          </p>
          
          <div>
            <h5 className="font-medium text-gray-800 mb-1">Morfologia:</h5>
            <p className="text-sm">
              La pianta presenta un fusto carnoso e succoso che può raggiungere 1-2 metri di altezza. 
              Le foglie sono grandi (15-45 cm), ovali-oblunghe, con picciolo lungo e guaine ampie. 
              La caratteristica più distintiva è la variegatura delle foglie, con macchie e striature 
              bianco-crema o giallo-verde lungo le nervature principali e secondarie.
            </p>
          </div>

          <div>
            <h5 className="font-medium text-gray-800 mb-1">Habitat naturale:</h5>
            <p className="text-sm">
              Cresce spontaneamente nel sottobosco delle foreste pluviali tropicali, dove trova 
              condizioni di luce filtrata, elevata umidità atmosferica (80-90%) e temperature 
              costanti tra 22-28°C. Il terreno naturale è ricco di humus, ben drenato ma 
              costantemente umido.
            </p>
          </div>

          <div className="bg-red-50 p-2 rounded text-red-800 text-xs">
            ⚠️ <strong>Tossicità:</strong> Contiene cristalli di ossalato di calcio e enzimi proteolitici. 
            L'ingestione può causare edema della glottide e difficoltà respiratorie. 
            Il contatto con la linfa può provocare dermatiti.
          </div>
        </div>
      );
    }
    
    if (lower.includes('monstera deliciosa')) {
      return (
        <div className="space-y-3">
          <p>
            <strong>Monstera deliciosa</strong> Liebm. è una pianta rampicante epifita della famiglia 
            Araceae, endemica delle foreste pluviali del Messico meridionale e dell'America centrale 
            (Guatemala, Honduras, Costa Rica).
          </p>
          
          <div>
            <h5 className="font-medium text-gray-800 mb-1">Caratteristiche botaniche:</h5>
            <p className="text-sm">
              Presenta foglie giovani intere e cordate che, con la maturazione, sviluppano le 
              caratteristiche fenestrazioni (perforazioni naturali) e incisioni marginali profonde. 
              Le foglie mature possono raggiungere 90 cm di larghezza. La pianta produce radici 
              aeree che in natura si attaccano ai tronchi per sostegno e assorbimento di nutrienti.
            </p>
          </div>

          <div>
            <h5 className="font-medium text-gray-800 mb-1">Fioritura e fruttificazione:</h5>
            <p className="text-sm">
              Produce un'infiorescenza a spadice circondata da una spata bianco-crema. 
              Il frutto è una bacca commestibile (da cui il nome "deliciosa") che matura 
              in 12-15 mesi, sviluppando un aroma simile all'ananas e alla banana.
            </p>
          </div>
        </div>
      );
    }
    
    if (lower.includes('ficus')) {
      return (
        <div className="space-y-3">
          <p>
            Il genere <strong>Ficus</strong> comprende oltre 850 specie di piante della famiglia 
            Moraceae, distribuite principalmente nelle regioni tropicali e subtropicali. 
            Molte specie sono caratterizzate da un particolare ciclo di vita che inizia come epifite.
          </p>
          
          <div>
            <h5 className="font-medium text-gray-800 mb-1">Caratteristiche generali:</h5>
            <p className="text-sm">
              Tutte le specie di Ficus producono un lattice bianco contenente enzimi e composti 
              terpenici. Le foglie sono generalmente coriacee, lucide, con nervatura pennata. 
              Il sistema radicale è molto sviluppato e aggressivo, caratteristica che ha reso 
              alcune specie invasive quando introdotte in nuovi habitat.
            </p>
          </div>

          <div>
            <h5 className="font-medium text-gray-800 mb-1">Relazione simbiotica:</h5>
            <p className="text-sm">
              I Ficus hanno una relazione mutualistica obbligata con vespe impollinatrici del 
              genere Agaonidae. Ogni specie di Ficus è impollinata da una specifica specie di vespa, 
              rappresentando uno degli esempi più affascinanti di coevoluzione nel regno vegetale.
            </p>
          </div>
        </div>
      );
    }

    if (lower.includes('sansevieria')) {
      return (
        <div className="space-y-3">
          <p>
            <strong>Sansevieria trifasciata</strong> Prain, comunemente nota come "lingua di suocera", 
            è una pianta succulenta della famiglia Asparagaceae, originaria dell'Africa tropicale 
            occidentale, particolarmente diffusa in Nigeria e Repubblica Democratica del Congo.
          </p>
          
          <div>
            <h5 className="font-medium text-gray-800 mb-1">Adattamenti xerofitici:</h5>
            <p className="text-sm">
              Le foglie sono modificate in strutture carnose e succulente per l'accumulo di acqua, 
              con epidermide spessa e cuticola cerosa per ridurre la traspirazione. Presenta 
              metabolismo CAM (Crassulacean Acid Metabolism) che permette l'apertura degli stomi 
              durante la notte per ridurre la perdita d'acqua.
            </p>
          </div>

          <div>
            <h5 className="font-medium text-gray-800 mb-1">Riproduzione vegetativa:</h5>
            <p className="text-sm">
              Oltre alla propagazione per divisione dei rizomi, la pianta può essere moltiplicata 
              attraverso talee fogliari. È interessante notare che le varietà variegate perdono 
              la variegatura quando propagate per talea, mantenendola solo nella riproduzione per divisione.
            </p>
          </div>
        </div>
      );
    }
    
    return (
      <div>
        <p>
          Informazioni enciclopediche dettagliate per <em>{scientificName}</em> richiedono 
          consultazione di fonti botaniche specializzate per una descrizione scientifica accurata 
          delle caratteristiche morfologiche, fisiologiche e ecologiche della specie.
        </p>
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

              {/* Caratteristiche specifiche da Plantarium */}
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
                      <div className="prose prose-sm max-w-none">
                        <div 
                          className="text-gray-700 text-sm leading-relaxed whitespace-pre-line"
                          dangerouslySetInnerHTML={{ 
                            __html: PlantariumService.formatEncyclopedicText(plantariumInfo).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
                          }}
                        />
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