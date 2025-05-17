
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface PlantInfoFormValues {
  isIndoor: boolean;
  wateringFrequency: string;
}

interface PlantInfoFormProps {
  onComplete: (data: PlantInfoFormValues) => void;
}

const PlantInfoForm = ({ onComplete }: PlantInfoFormProps) => {
  const [formData, setFormData] = useState<PlantInfoFormValues>({
    isIndoor: false,
    wateringFrequency: '2',
  });

  const handleCheckboxChange = (name: keyof PlantInfoFormValues) => {
    setFormData(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, wateringFrequency: value }));
  };

  const handleSubmit = () => {
    onComplete(formData);
  };

  return (
    <Card className="bg-white p-6 shadow-md rounded-2xl">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Informazioni sulla pianta</h3>
          <p className="text-sm text-gray-500 mb-4">
            Per ottenere una diagnosi più accurata, fornisci alcune informazioni sulla tua pianta.
            Questi dettagli ci aiuteranno a comprendere meglio la sua situazione.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="isIndoor" 
              checked={formData.isIndoor} 
              onCheckedChange={() => handleCheckboxChange('isIndoor')}
            />
            <Label htmlFor="isIndoor" className="text-sm font-medium cursor-pointer">
              La pianta è in casa (ambiente chiuso)
            </Label>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="wateringFrequency" className="text-sm font-medium">
              Frequenza di irrigazione (volte a settimana)
            </Label>
            <Select 
              value={formData.wateringFrequency} 
              onValueChange={handleSelectChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleziona frequenza" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 volta</SelectItem>
                <SelectItem value="2">2 volte</SelectItem>
                <SelectItem value="3">3 volte</SelectItem>
                <SelectItem value="4">4 o più volte</SelectItem>
                <SelectItem value="0">Raramente / Mai</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button 
          onClick={handleSubmit} 
          className="w-full mt-4 bg-drplant-green hover:bg-drplant-green/90"
        >
          Continua
        </Button>
      </div>
    </Card>
  );
};

export default PlantInfoForm;
