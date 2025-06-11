
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { PlantInfo } from './types';

interface PlantInfoFormProps {
  onComplete: (data: PlantInfo) => void;
  initialData?: Partial<PlantInfo>;
}

const PlantInfoForm = ({ onComplete, initialData }: PlantInfoFormProps) => {
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
      handleChange('name', '');
    } else {
      setShowCustomPlantName(false);
      setCustomPlantName('');
      handleChange('name', value);
    }
  };

  const isFormValid = () => {
    const hasPlantName = showCustomPlantName ? customPlantName.trim() !== '' : formData.name !== '';
    return hasPlantName && formData.wateringFrequency && formData.lightExposure;
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Informazioni sulla Pianta</CardTitle>
        <CardDescription className="text-center">
          Fornisci le informazioni sulla tua pianta per una diagnosi accurata
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nome della pianta */}
          <div className="space-y-2">
            <Label htmlFor="name">Tipo di pianta</Label>
            <Select value={showCustomPlantName ? 'altro' : formData.name} onValueChange={handlePlantNameChange}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona il tipo di pianta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rose">Rosa</SelectItem>
                <SelectItem value="basilico">Basilico</SelectItem>
                <SelectItem value="monstera">Monstera</SelectItem>
                <SelectItem value="pomodoro">Pomodoro</SelectItem>
                <SelectItem value="geranio">Geranio</SelectItem>
                <SelectItem value="ficus">Ficus</SelectItem>
                <SelectItem value="orchidea">Orchidea</SelectItem>
                <SelectItem value="succulenta">Succulenta</SelectItem>
                <SelectItem value="olivo">Olivo</SelectItem>
                <SelectItem value="lavanda">Lavanda</SelectItem>
                <SelectItem value="altro">Altro</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Campo personalizzato per "altro" */}
            {showCustomPlantName && (
              <div className="space-y-2">
                <Label htmlFor="customPlantName">Nome della pianta</Label>
                <Input
                  id="customPlantName"
                  value={customPlantName}
                  onChange={(e) => setCustomPlantName(e.target.value)}
                  placeholder="Scrivi il nome della pianta se lo conosci"
                />
              </div>
            )}
          </div>

          {/* Ambiente */}
          <div className="space-y-3">
            <Label>Ambiente</Label>
            <RadioGroup
              value={formData.isIndoor ? 'indoor' : 'outdoor'}
              onValueChange={(value) => handleChange('isIndoor', value === 'indoor')}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="indoor" id="indoor" />
                <Label htmlFor="indoor">Interno</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="outdoor" id="outdoor" />
                <Label htmlFor="outdoor">Esterno</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Frequenza irrigazione */}
          <div className="space-y-2">
            <Label>Frequenza di irrigazione</Label>
            <Select value={formData.wateringFrequency} onValueChange={(value) => handleChange('wateringFrequency', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona la frequenza" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="quotidiana">Quotidiana</SelectItem>
                <SelectItem value="ogni-2-giorni">Ogni 2 giorni</SelectItem>
                <SelectItem value="2-volte-settimana">2 volte a settimana</SelectItem>
                <SelectItem value="settimanale">Settimanale</SelectItem>
                <SelectItem value="ogni-2-settimane">Ogni 2 settimane</SelectItem>
                <SelectItem value="mensile">Mensile</SelectItem>
                <SelectItem value="quando-necessario">Quando il terreno è secco</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Esposizione alla luce */}
          <div className="space-y-2">
            <Label>Esposizione alla luce</Label>
            <Select value={formData.lightExposure} onValueChange={(value) => handleChange('lightExposure', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona l'esposizione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sole-diretto">Sole diretto</SelectItem>
                <SelectItem value="sole-parziale">Sole parziale</SelectItem>
                <SelectItem value="ombra-parziale">Ombra parziale</SelectItem>
                <SelectItem value="ombra-completa">Ombra completa</SelectItem>
                <SelectItem value="luce-indiretta">Luce indiretta</SelectItem>
                <SelectItem value="luce-artificiale">Luce artificiale</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sintomi */}
          <div className="space-y-2">
            <Label htmlFor="symptoms">Descrivi i sintomi osservati</Label>
            <Textarea
              id="symptoms"
              value={formData.symptoms}
              onChange={(e) => handleChange('symptoms', e.target.value)}
              placeholder="es. Foglie gialle, macchie scure, appassimento..."
              rows={3}
            />
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              📸 <strong>Prossimo passo:</strong> Dopo aver salvato queste informazioni, dovrai scattare una foto o caricare un'immagine della tua pianta per procedere con la diagnosi.
            </p>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-drplant-blue hover:bg-drplant-blue-dark"
            disabled={!isFormValid()}
          >
            Continua alla Foto
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default PlantInfoForm;
