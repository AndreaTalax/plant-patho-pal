
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { PlantInfo } from './types';
import { useTheme } from '@/context/ThemeContext';

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
    symptoms: initialData?.symptoms ?? '',
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
      handleChange('name', 'altro'); // Use 'altro' instead of empty string
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

  const isFormValid = () => {
    // Il nome della pianta non è più obbligatorio
    return formData.wateringFrequency && formData.lightExposure;
  };

  // Get the current select value for plant name
  const getCurrentPlantSelectValue = () => {
    if (showCustomPlantName) return 'altro';
    if (formData.name === t('unidentifiedPlant')) return 'non-so';
    if (!formData.name) return undefined; // Use undefined instead of empty string
    return formData.name;
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
            <Select value={getCurrentPlantSelectValue()} onValueChange={handlePlantNameChange}>
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
            <Select value={formData.wateringFrequency || undefined} onValueChange={(value) => handleChange('wateringFrequency', value)}>
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
            <Select value={formData.lightExposure || undefined} onValueChange={(value) => handleChange('lightExposure', value)}>
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
          <div className="space-y-2">
            <Label htmlFor="symptoms">{t('symptomsDescription')}</Label>
            <Textarea
              id="symptoms"
              value={formData.symptoms}
              onChange={(e) => handleChange('symptoms', e.target.value)}
              placeholder={t('symptomsPlaceholder')}
              rows={3}
            />
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
