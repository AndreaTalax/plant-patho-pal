
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
    useAI: initialData?.useAI ?? false,
    sendToExpert: initialData?.sendToExpert ?? false,
    name: initialData?.name ?? '',
    infoComplete: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updatedData = {
      ...formData,
      infoComplete: true,
    };

    onComplete(updatedData);
  };

  const handleChange = (field: keyof PlantInfo, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isFormValid = formData.name && formData.wateringFrequency && formData.lightExposure;

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
            <Label htmlFor="name">Nome della pianta (se conosciuto)</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="es. Rosa, Basilico, Monstera..."
              required
            />
          </div>

          {/* Ambiente */}
          <div className="space-y-3">
            <Label>Ambiente</Label>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="indoor"
                  checked={formData.isIndoor}
                  onCheckedChange={(checked) => handleChange('isIndoor', checked)}
                />
                <Label htmlFor="indoor">Interno</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="outdoor"
                  checked={!formData.isIndoor}
                  onCheckedChange={(checked) => handleChange('isIndoor', !checked)}
                />
                <Label htmlFor="outdoor">Esterno</Label>
              </div>
            </div>
          </div>

          {/* Frequenza irrigazione */}
          <div className="space-y-2">
            <Label htmlFor="watering">Frequenza di irrigazione</Label>
            <Input
              id="watering"
              value={formData.wateringFrequency}
              onChange={(e) => handleChange('wateringFrequency', e.target.value)}
              placeholder="es. Ogni giorno, 2 volte a settimana..."
              required
            />
          </div>

          {/* Esposizione alla luce */}
          <div className="space-y-2">
            <Label htmlFor="light">Esposizione alla luce</Label>
            <Input
              id="light"
              value={formData.lightExposure}
              onChange={(e) => handleChange('lightExposure', e.target.value)}
              placeholder="es. Sole diretto, Ombra parziale, Luce indiretta..."
              required
            />
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

          <Button 
            type="submit" 
            className="w-full bg-drplant-blue hover:bg-drplant-blue-dark"
            disabled={!isFormValid}
          >
            Continua
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default PlantInfoForm;
