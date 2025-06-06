
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PlantInfoFormProps {
  onComplete: (data: any) => void;
  initialData?: any;
}

const PlantInfoForm: React.FC<PlantInfoFormProps> = ({ onComplete, initialData = {} }) => {
  const [formData, setFormData] = useState({
    plantName: initialData.plantName || '',
    isIndoor: initialData.isIndoor || 'indoor',
    wateringFrequency: initialData.wateringFrequency || '',
    lightExposure: initialData.lightExposure || '',
    symptoms: initialData.symptoms || '',
    plantAge: initialData.plantAge || '',
    potSize: initialData.potSize || '',
    fertilizer: initialData.fertilizer || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.symptoms.trim()) {
      alert('Please describe the symptoms you\'ve observed');
      return;
    }

    onComplete({
      ...formData,
      isIndoor: formData.isIndoor === 'indoor',
      wateringFrequency: parseInt(formData.wateringFrequency) || 0
    });
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">Plant Information</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Plant Name */}
        <div>
          <Label htmlFor="plantName">Plant Name (if known)</Label>
          <Input
            id="plantName"
            value={formData.plantName}
            onChange={(e) => updateField('plantName', e.target.value)}
            placeholder="e.g., Rose, Tomato, Peace Lily..."
          />
        </div>

        {/* Indoor/Outdoor */}
        <div>
          <Label>Plant Environment</Label>
          <RadioGroup
            value={formData.isIndoor}
            onValueChange={(value) => updateField('isIndoor', value)}
            className="flex gap-6 mt-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="indoor" id="indoor" />
              <Label htmlFor="indoor">Indoor Plant</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="outdoor" id="outdoor" />
              <Label htmlFor="outdoor">Outdoor Plant</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Watering Frequency */}
        <div>
          <Label htmlFor="watering">Watering Frequency (times per week)</Label>
          <Select value={formData.wateringFrequency} onValueChange={(value) => updateField('wateringFrequency', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select watering frequency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Never / Very rarely</SelectItem>
              <SelectItem value="1">Once a week</SelectItem>
              <SelectItem value="2">Twice a week</SelectItem>
              <SelectItem value="3">3 times a week</SelectItem>
              <SelectItem value="4">4 times a week</SelectItem>
              <SelectItem value="5">5 times a week</SelectItem>
              <SelectItem value="7">Daily</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Light Exposure */}
        <div>
          <Label htmlFor="light">Light Exposure</Label>
          <Select value={formData.lightExposure} onValueChange={(value) => updateField('lightExposure', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select light exposure" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low light (shade)</SelectItem>
              <SelectItem value="medium">Medium light (indirect)</SelectItem>
              <SelectItem value="high">High light (direct sun)</SelectItem>
              <SelectItem value="artificial">Artificial light only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Plant Age */}
        <div>
          <Label htmlFor="age">Plant Age (approximate)</Label>
          <Select value={formData.plantAge} onValueChange={(value) => updateField('plantAge', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select plant age" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="seedling">Seedling (less than 3 months)</SelectItem>
              <SelectItem value="young">Young (3-12 months)</SelectItem>
              <SelectItem value="mature">Mature (1-3 years)</SelectItem>
              <SelectItem value="old">Old (more than 3 years)</SelectItem>
              <SelectItem value="unknown">Unknown</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Symptoms (Required) */}
        <div>
          <Label htmlFor="symptoms">Symptoms Description *</Label>
          <Textarea
            id="symptoms"
            value={formData.symptoms}
            onChange={(e) => updateField('symptoms', e.target.value)}
            placeholder="Describe what you've observed: yellow leaves, brown spots, wilting, pest damage, etc."
            className="min-h-[100px]"
            required
          />
          <p className="text-sm text-gray-500 mt-1">
            Detailed symptom description helps our AI provide more accurate analysis
          </p>
        </div>

        <Button type="submit" className="w-full">
          Continue to Image Upload
        </Button>
      </form>
    </Card>
  );
};

export default PlantInfoForm;
