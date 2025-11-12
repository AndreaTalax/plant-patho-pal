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

// Comprehensive plant symptoms list with technical names
const plantSymptoms = [
  // Foglie - Alterazioni cromatiche
  { value: 'clorosi', label: 'Clorosi (ingiallimento fogliare)', emoji: '🍂' },
  { value: 'necrosi-fogliare', label: 'Necrosi fogliare (imbrunimento)', emoji: '🍁' },
  { value: 'antocianosi', label: 'Antocianosi (arrossamento foglie)', emoji: '🔴' },
  { value: 'necrosi', label: 'Necrosi (annerimento tessuti)', emoji: '⚫' },
  { value: 'clorosi-ferrica', label: 'Clorosi ferrica (sbiancamento)', emoji: '⚪' },
  { value: 'etiolamento', label: 'Etiolamento (pallore/scolorimento)', emoji: '💛' },
  
  // Foglie - Alterazioni strutturali
  { value: 'disseccamento', label: 'Disseccamento fogliare', emoji: '🥀' },
  { value: 'appassimento', label: 'Appassimento', emoji: '😢' },
  { value: 'accartocciamento', label: 'Accartocciamento fogliare', emoji: '🌀' },
  { value: 'defogliazione', label: 'Defogliazione (caduta foglie)', emoji: '🍃' },
  { value: 'filloptosi', label: 'Filloptosi (perforazione foglie)', emoji: '🕳️' },
  { value: 'bollosita', label: 'Bollosità (deformazione foglie)', emoji: '🌿' },
  
  // Macchie e maculature
  { value: 'maculatura-fogliare', label: 'Maculatura fogliare (macchie marroni)', emoji: '🟤' },
  { value: 'antracnosi', label: 'Antracnosi (macchie nere necrotiche)', emoji: '⚫' },
  { value: 'septoriosi', label: 'Septoriosi (macchie con alone)', emoji: '🟡' },
  { value: 'oidio-maculato', label: 'Maculatura bianca', emoji: '⚪' },
  { value: 'clorosi-internervale', label: 'Clorosi internervale (alone giallo)', emoji: '🟨' },
  { value: 'striatura-virale', label: 'Striatura virale', emoji: '〰️' },
  
  // Patologie fungine
  { value: 'oidio', label: 'Oidio (mal bianco)', emoji: '🤍' },
  { value: 'botrite', label: 'Botrite (muffa grigia)', emoji: '🩶' },
  { value: 'peronospora', label: 'Peronospora (peluria bianca)', emoji: '🫧' },
  { value: 'ruggine', label: 'Ruggine (pustole)', emoji: '🔘' },
  { value: 'oidio-polverulento', label: 'Oidio polverulento', emoji: '💨' },
  
  // Parassiti animali
  { value: 'infestazione-insetti', label: 'Infestazione da insetti', emoji: '🐛' },
  { value: 'ragnetto-rosso', label: 'Ragnetto rosso (ragnatele)', emoji: '🕸️' },
  { value: 'cocciniglia', label: 'Cocciniglia', emoji: '🦗' },
  { value: 'afidi', label: 'Afidi', emoji: '🐜' },
  { value: 'aleurodidi', label: 'Aleurodidi (mosche bianche)', emoji: '🪰' },
  
  // Stelo e rami
  { value: 'marciume-colletto', label: 'Marciume del colletto', emoji: '💀' },
  { value: 'cancro-rameale', label: 'Cancro rameale (annerimento)', emoji: '⚫' },
  { value: 'disseccamento-rami', label: 'Disseccamento rami', emoji: '🪵' },
  { value: 'nanismo', label: 'Nanismo (crescita stentata)', emoji: '📉' },
  
  // Apparato radicale
  { value: 'marciume-radicale', label: 'Marciume radicale', emoji: '🦴' },
  { value: 'asfissia-radicale', label: 'Asfissia radicale (eccesso umidità)', emoji: '💧' },
  { value: 'stress-idrico', label: 'Stress idrico (carenza acqua)', emoji: '🏜️' },
  { value: 'putrefazione', label: 'Putrefazione (odore sgradevole)', emoji: '👃' },
  
  // Fiori e frutti
  { value: 'cascola', label: 'Cascola (caduta fiori/frutti)', emoji: '🌸' },
  { value: 'aborto-fiorale', label: 'Aborto fiorale (deformazione)', emoji: '🥀' },
  { value: 'marciume-frutto', label: 'Marciume del frutto', emoji: '🍎' },
  { value: 'aborto-gemmario', label: 'Aborto gemmario (mancata fioritura)', emoji: '🚫' },
  
  // Alterazioni fisiologiche
  { value: 'stentata-crescita', label: 'Crescita stentata', emoji: '🐌' },
  { value: 'senescenza-precoce', label: 'Senescenza precoce (perdita vigore)', emoji: '😴' },
  { value: 'lodging', label: 'Allettamento (inclinazione)', emoji: '📐' },
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
    localStorage.setItem('symptomHelpRequest', symptomKey);
    window.dispatchEvent(new CustomEvent('switchTab', { detail: 'library' }));
  };

  const isFormValid = () => {
    return formData.wateringFrequency && formData.lightExposure && formData.symptoms.length > 0;
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="space-y-2 pb-3">
        <CardTitle className="text-xl font-bold text-center text-drplant-blue-dark">
          🌿 Informazioni Pianta
        </CardTitle>
        <CardDescription className="text-center text-xs px-2">
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
                <SelectItem value="acquatica">🌊 Pianta Acquatica</SelectItem>
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
            {formData.symptoms.length === 0 && (
              <p className="text-sm text-red-600 mt-2">
                ⚠️ <strong>Seleziona almeno un sintomo</strong> per continuare con la diagnosi
              </p>
            )}
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
