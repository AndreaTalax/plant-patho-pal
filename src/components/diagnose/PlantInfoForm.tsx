import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { HelpCircle } from 'lucide-react';
import { PlantInfo } from './types';
import { useTheme } from '@/context/ThemeContext';

// Comprehensive plant symptoms list
const plantSymptoms = [
  // Foglie - Colore
  { value: 'foglie-gialle', label: 'Foglie gialle', emoji: '🍂' },
  { value: 'foglie-marroni', label: 'Foglie marroni', emoji: '🍁' },
  { value: 'foglie-rosse', label: 'Foglie rosse', emoji: '🔴' },
  { value: 'foglie-nere', label: 'Foglie nere', emoji: '⚫' },
  { value: 'foglie-bianche', label: 'Foglie bianche/sbiancate', emoji: '⚪' },
  { value: 'foglie-pallide', label: 'Foglie pallide/scolorite', emoji: '💛' },
  
  // Foglie - Texture e forma
  { value: 'foglie-secche', label: 'Foglie secche/croccanti', emoji: '🥀' },
  { value: 'foglie-appassite', label: 'Foglie appassite', emoji: '😢' },
  { value: 'foglie-arricciate', label: 'Foglie arricciate', emoji: '🌀' },
  { value: 'foglie-cadenti', label: 'Foglie che cadono', emoji: '🍃' },
  { value: 'foglie-bucate', label: 'Foglie bucate/perforate', emoji: '🕳️' },
  { value: 'foglie-deformate', label: 'Foglie deformate', emoji: '🌿' },
  
  // Macchie e pattern
  { value: 'macchie-marroni', label: 'Macchie marroni sulle foglie', emoji: '🟤' },
  { value: 'macchie-nere', label: 'Macchie nere sulle foglie', emoji: '⚫' },
  { value: 'macchie-gialle', label: 'Macchie gialle sulle foglie', emoji: '🟡' },
  { value: 'macchie-bianche', label: 'Macchie bianche sulle foglie', emoji: '⚪' },
  { value: 'alone-giallo', label: 'Alone giallo intorno alle macchie', emoji: '🟨' },
  { value: 'striature', label: 'Striature o linee anomale', emoji: '〰️' },
  
  // Crescite e presenze anomale
  { value: 'muffa-bianca', label: 'Muffa bianca (oidio)', emoji: '🤍' },
  { value: 'muffa-grigia', label: 'Muffa grigia', emoji: '🩶' },
  { value: 'peluria-bianca', label: 'Peluria bianca', emoji: '🫧' },
  { value: 'puntini-bianchi', label: 'Puntini bianchi', emoji: '🔘' },
  { value: 'polvere-bianca', label: 'Polvere bianca sulle foglie', emoji: '💨' },
  
  // Insetti e parassiti
  { value: 'insetti-visibili', label: 'Insetti visibili', emoji: '🐛' },
  { value: 'ragnatele', label: 'Ragnatele', emoji: '🕸️' },
  { value: 'cocciniglie', label: 'Cocciniglie (puntini bianchi)', emoji: '🦗' },
  { value: 'afidi', label: 'Afidi (piccoli insetti)', emoji: '🐜' },
  { value: 'mosche-bianche', label: 'Mosche bianche', emoji: '🪰' },
  
  // Stelo e rami
  { value: 'stelo-molle', label: 'Stelo molle/marcio', emoji: '💀' },
  { value: 'stelo-nero', label: 'Stelo annerito', emoji: '⚫' },
  { value: 'rami-secchi', label: 'Rami secchi', emoji: '🪵' },
  { value: 'crescita-anomala', label: 'Crescita anomala/stentata', emoji: '📉' },
  
  // Radici e terra
  { value: 'marciume-radici', label: 'Marciume delle radici', emoji: '🦴' },
  { value: 'terreno-troppo-umido', label: 'Terreno sempre umido', emoji: '💧' },
  { value: 'terreno-troppo-secco', label: 'Terreno sempre secco', emoji: '🏜️' },
  { value: 'odore-cattivo', label: 'Odore cattivo dal terreno', emoji: '👃' },
  
  // Fiori e frutti
  { value: 'fiori-cadenti', label: 'Fiori che cadono', emoji: '🌸' },
  { value: 'fiori-deformati', label: 'Fiori deformati', emoji: '🥀' },
  { value: 'frutti-macchiati', label: 'Frutti con macchie', emoji: '🍎' },
  { value: 'mancata-fioritura', label: 'Mancata fioritura', emoji: '🚫' },
  
  // Crescita generale
  { value: 'crescita-lenta', label: 'Crescita molto lenta', emoji: '🐌' },
  { value: 'perdita-vigore', label: 'Perdita di vigore generale', emoji: '😴' },
  { value: 'pianta-inclinata', label: 'Pianta inclinata/instabile', emoji: '📐' },
];

interface PlantInfoFormProps {
  onComplete: (data: PlantInfo) => void;
  initialData?: Partial<PlantInfo>;
}

const PlantInfoForm = ({ onComplete, initialData }: PlantInfoFormProps) => {
  const { t } = useTheme();
  const [formData, setFormData] = useState<PlantInfo>({
    isIndoor: initialData?.isIndoor ?? true,
    wateringFrequency: initialData?.wateringFrequency ?? '',
    lightExposure: initialData?.lightExposure ?? '',
    symptoms: initialData?.symptoms ?? [],
    useAI: false,
    sendToExpert: false,
    name: initialData?.name ?? '',
    infoComplete: false,
  });

  const [showCustomPlantName, setShowCustomPlantName] = useState(false);
  const [customPlantName, setCustomPlantName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalPlantName = showCustomPlantName ? customPlantName : formData.name;
    
    const updatedData = {
      ...formData,
      name: finalPlantName,
      infoComplete: true,
    };

    onComplete(updatedData);
  };

  const handleChange = (field: keyof PlantInfo, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePlantNameChange = (value: string) => {
    if (value === 'altro') {
      setShowCustomPlantName(true);
      handleChange('name', '');
    } else if (value === 'non-so') {
      setShowCustomPlantName(false);
      setCustomPlantName('');
      handleChange('name', t('unidentifiedPlant'));
    } else {
      setShowCustomPlantName(false);
      setCustomPlantName('');
      handleChange('name', value);
    }
  };

  const handleSwitchToLibrary = (symptomKey: string) => {
    // Salva il sintomo per cui l'utente vuole aiuto
    localStorage.setItem('symptomHelpRequest', symptomKey);
    // Naviga al tab libreria
    window.dispatchEvent(new CustomEvent('switchTab', { detail: 'library' }));
  };

  const isFormValid = () => {
    // Il nome della pianta non è più obbligatorio
    return formData.wateringFrequency && formData.lightExposure;
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">{t('plantInfoTitle')}</CardTitle>
        <CardDescription className="text-center">
          {t('plantInfoDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nome della pianta - ora opzionale */}
          <div className="space-y-2">
            <Label htmlFor="name">{t('plantTypeOptional')}</Label>
            <Select value={showCustomPlantName ? 'altro' : (formData.name === t('unidentifiedPlant') ? 'non-so' : formData.name)} onValueChange={handlePlantNameChange}>
              <SelectTrigger>
                <SelectValue placeholder={t('selectPlantType')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="non-so">{t('dontKnowPlant')}</SelectItem>
                <SelectItem value="rose">{t('rose')}</SelectItem>
                <SelectItem value="basilico">{t('basil')}</SelectItem>
                <SelectItem value="monstera">{t('monstera')}</SelectItem>
                <SelectItem value="pomodoro">{t('tomato')}</SelectItem>
                <SelectItem value="geranio">{t('geranium')}</SelectItem>
                <SelectItem value="ficus">{t('ficus')}</SelectItem>
                <SelectItem value="orchidea">{t('orchid')}</SelectItem>
                <SelectItem value="succulenta">{t('succulent')}</SelectItem>
                <SelectItem value="olivo">{t('olive')}</SelectItem>
                <SelectItem value="lavanda">{t('lavender')}</SelectItem>
                <SelectItem value="altro">{t('other')}</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Campo personalizzato per "altro" */}
            {showCustomPlantName && (
              <div className="space-y-2">
                <Label htmlFor="customPlantName">{t('plantName')}</Label>
                <Input
                  id="customPlantName"
                  value={customPlantName}
                  onChange={(e) => setCustomPlantName(e.target.value)}
                  placeholder={t('writePlantName')}
                />
              </div>
            )}
          </div>

          {/* Ambiente */}
          <div className="space-y-3">
            <Label>{t('environment')}</Label>
            <RadioGroup
              value={formData.isIndoor ? 'indoor' : 'outdoor'}
              onValueChange={(value) => handleChange('isIndoor', value === 'indoor')}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="indoor" id="indoor" />
                <Label htmlFor="indoor">{t('indoor')}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="outdoor" id="outdoor" />
                <Label htmlFor="outdoor">{t('outdoor')}</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Frequenza irrigazione */}
          <div className="space-y-2">
            <Label>{t('wateringFrequency')}</Label>
            <Select value={formData.wateringFrequency} onValueChange={(value) => handleChange('wateringFrequency', value)}>
              <SelectTrigger>
                <SelectValue placeholder={t('selectFrequency')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="quotidiana">{t('daily')}</SelectItem>
                <SelectItem value="ogni-2-giorni">{t('every2Days')}</SelectItem>
                <SelectItem value="2-volte-settimana">{t('twiceWeek')}</SelectItem>
                <SelectItem value="settimanale">{t('weekly')}</SelectItem>
                <SelectItem value="ogni-2-settimane">{t('every2Weeks')}</SelectItem>
                <SelectItem value="mensile">{t('monthly')}</SelectItem>
                <SelectItem value="quando-necessario">{t('whenDry')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Esposizione alla luce */}
          <div className="space-y-2">
            <Label>{t('lightExposure')}</Label>
            <Select value={formData.lightExposure} onValueChange={(value) => handleChange('lightExposure', value)}>
              <SelectTrigger>
                <SelectValue placeholder={t('selectExposure')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sole-diretto">{t('directSun')}</SelectItem>
                <SelectItem value="sole-parziale">{t('partialSun')}</SelectItem>
                <SelectItem value="ombra-parziale">{t('partialShade')}</SelectItem>
                <SelectItem value="ombra-completa">{t('fullShade')}</SelectItem>
                <SelectItem value="luce-indiretta">{t('indirectLight')}</SelectItem>
                <SelectItem value="luce-artificiale">{t('artificialLight')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sintomi */}
          <div className="space-y-3">
            <Label>Selezione Sintomi</Label>
            <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
              <div className="grid grid-cols-1 gap-3">
                {plantSymptoms.map((symptom) => (
                  <div key={symptom.value} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                    <div className="flex items-center space-x-3 flex-1">
                      <Checkbox
                        id={symptom.value}
                        checked={formData.symptoms.includes(symptom.value)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            handleChange('symptoms', [...formData.symptoms, symptom.value]);
                          } else {
                            handleChange('symptoms', formData.symptoms.filter(s => s !== symptom.value));
                          }
                        }}
                      />
                      <Label htmlFor={symptom.value} className="text-sm font-normal cursor-pointer flex-1">
                        {symptom.emoji} {symptom.label}
                      </Label>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSwitchToLibrary(symptom.value)}
                      className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                      title={`Scopri di più su: ${symptom.label}`}
                    >
                      <HelpCircle className="h-3 w-3" />
                      <span>Info</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
            {formData.symptoms.length > 0 && (
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-sm text-blue-800 font-medium">Sintomi selezionati:</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {formData.symptoms.map((symptom) => {
                    const symptomInfo = plantSymptoms.find(s => s.value === symptom);
                    return (
                      <span key={symptom} className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {symptomInfo?.emoji} {symptomInfo?.label}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              📸 <strong>{t('nextStepInfo')}</strong> {t('nextStepDescription')}
            </p>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-drplant-blue hover:bg-drplant-blue-dark"
            disabled={!isFormValid()}
          >
            {t('continueToPhoto')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default PlantInfoForm;
