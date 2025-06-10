
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { PlantInfo } from './types';

interface PlantInfoFormProps {
  onComplete: (data: PlantInfo) => void;
  initialData?: Partial<PlantInfo>;
}

/**
 * A form component for collecting detailed plant information to facilitate diagnosis.
 * @example
 * PlantInfoForm({ onComplete: handleFormCompletion, initialData: defaultPlantData })
 * Renders a plant information form and calls onComplete with the updated data.
 * @param {object} PlantInfoFormProps - Props for the PlantInfoForm component.
 * @param {Function} PlantInfoFormProps.onComplete - Callback function to execute upon form submission, receiving the collected plant data.
 * @param {object} [PlantInfoFormProps.initialData] - Optional initial values for the form fields.
 * @returns {JSX.Element} A styled card containing the plant information form.
 * @description
 *   - Uses React's useState hook to manage form data locally.
 *   - Includes validation logic to ensure required fields are filled before submission.
 *   - Provides options for submitting the collected plant data either through AI diagnosis or expert consultation.
 */
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

  /**
   * Handles form submission and updates form data based on the selected diagnosis method.
   * @example
   * handleFormSubmit(event)
   * // No return value, updates state with new form data and triggers onComplete callback
   * @param {React.FormEvent} e - The form event triggered on submission.
   * @returns {void} Executes onComplete with updated form data.
   * @description
   *   - Aggregates choices from the diagnosis method selection to construct updatedData.
   *   - Converts diagnosisMethod into boolean flags for options: useAI and sendToExpert.
   *   - Ensures infoComplete flag is set in updatedData.
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
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
            <Label htmlFor="name">Tipo di pianta</Label>
            <Select value={formData.name} onValueChange={(value) => handleChange('name', value)}>
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

          {/* Metodo di diagnosi */}
          <div className="space-y-3">
            <Label>Metodo di diagnosi</Label>
            <RadioGroup
              value={diagnosisMethod}
              onValueChange={(value: 'ai' | 'expert') => setDiagnosisMethod(value)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ai" id="ai" />
                <Label htmlFor="ai">Diagnosi con Intelligenza Artificiale</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="expert" id="expert" />
                <Label htmlFor="expert">Chat con Fitopatogo Esperto</Label>
              </div>
            </RadioGroup>
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
