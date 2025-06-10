
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Brain, MessageCircle, Sparkles } from 'lucide-react';
import { PlantInfo } from '@/context/PlantInfoContext';

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

  const [diagnosisMethod, setDiagnosisMethod] = useState<'ai' | 'expert' | ''>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!diagnosisMethod) {
      return;
    }

    const updatedData = {
      ...formData,
      useAI: diagnosisMethod === 'ai',
      sendToExpert: diagnosisMethod === 'expert',
      infoComplete: true,
    };

    onComplete(updatedData);
  };

  const handleChange = (field: keyof PlantInfo, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDiagnosisMethodChange = (value: string) => {
    if (value === 'ai' || value === 'expert') {
      setDiagnosisMethod(value);
    }
  };

  const isFormValid = formData.name && formData.wateringFrequency && formData.lightExposure && diagnosisMethod;

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

          {/* Scelta metodo diagnosi */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Scegli il metodo di diagnosi</Label>
            <RadioGroup value={diagnosisMethod} onValueChange={handleDiagnosisMethodChange}>
              {/* Opzione AI */}
              <Card className={`cursor-pointer transition-all ${
                diagnosisMethod === 'ai' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="ai" id="ai" />
                    <div className="flex items-center space-x-2 flex-1">
                      <Brain className="h-5 w-5 text-blue-600" />
                      <div>
                        <Label htmlFor="ai" className="text-base font-medium cursor-pointer">
                          Diagnosi con Intelligenza Artificiale
                        </Label>
                        <p className="text-sm text-gray-600 mt-1">
                          Analisi immediata con AI avanzata e database di malattie delle piante
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <Sparkles className="h-3 w-3 text-blue-500" />
                          <span className="text-xs text-blue-600 font-medium">Risultati in 30 secondi</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Opzione Esperto */}
              <Card className={`cursor-pointer transition-all ${
                diagnosisMethod === 'expert' ? 'ring-2 ring-green-500 bg-green-50' : 'hover:bg-gray-50'
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="expert" id="expert" />
                    <div className="flex items-center space-x-2 flex-1">
                      <MessageCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <Label htmlFor="expert" className="text-base font-medium cursor-pointer">
                          Chat con Fitopatogo Esperto
                        </Label>
                        <p className="text-sm text-gray-600 mt-1">
                          Consulenza diretta con un esperto qualificato in patologie vegetali
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <MessageCircle className="h-3 w-3 text-green-500" />
                          <span className="text-xs text-green-600 font-medium">Risposta personalizzata</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </RadioGroup>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-drplant-blue hover:bg-drplant-blue-dark"
            disabled={!isFormValid}
          >
            {diagnosisMethod === 'ai' ? 'Continua con la Diagnosi AI' : 
             diagnosisMethod === 'expert' ? 'Continua con Chat Esperto' : 
             'Seleziona un metodo di diagnosi'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default PlantInfoForm;
