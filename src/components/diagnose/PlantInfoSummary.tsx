
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronDownIcon, ChevronUpIcon, Edit3Icon } from 'lucide-react';
import { useState } from 'react';

interface PlantInfoSummaryProps {
  plantInfo: {
    isIndoor: boolean;
    wateringFrequency: string;
    lightExposure: string;
    symptoms: string;
  };
  onEdit: () => void;
}

const PlantInfoSummary = ({ plantInfo, onEdit }: PlantInfoSummaryProps) => {
  const [expanded, setExpanded] = useState(false);

  const getWateringText = (frequency: string) => {
    switch (frequency) {
      case '0': return 'Raramente / Mai';
      case '1': return '1 volta a settimana';
      case '2': return '2 volte a settimana';
      case '3': return '3 volte a settimana';
      case '4': return '4+ volte a settimana';
      default: return frequency;
    }
  };

  const getLightExposureText = (exposure: string) => {
    switch (exposure) {
      case 'full-sun': return 'Luce piena / sole diretto';
      case 'partial-sun': return 'Parzialmente soleggiata';
      case 'shade': return 'Ombra / luce indiretta';
      case 'low-light': return 'Luce scarsa';
      default: return exposure;
    }
  };

  return (
    <Card className="bg-white p-5 shadow-md rounded-xl">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Informazioni fornite</h3>
          <p className="text-sm text-gray-500">Dati inseriti sulla pianta</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onEdit}
          className="flex items-center text-sm font-medium text-blue-600"
        >
          <Edit3Icon className="h-3.5 w-3.5 mr-1" /> Modifica
        </Button>
      </div>

      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500">Posizione:</p>
            <p className="text-sm font-medium">{plantInfo.isIndoor ? 'In casa' : 'All\'aperto'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Irrigazione:</p>
            <p className="text-sm font-medium">{getWateringText(plantInfo.wateringFrequency)}</p>
          </div>
        </div>
        
        <div>
          <p className="text-xs text-gray-500">Esposizione alla luce:</p>
          <p className="text-sm font-medium">{getLightExposureText(plantInfo.lightExposure)}</p>
        </div>
        
        <div className="pt-1">
          <p className="text-xs text-gray-500 flex items-center">
            Sintomi:
            <button 
              className="ml-1 inline-flex items-center text-blue-600"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <><span className="text-xs">nascondi</span> <ChevronUpIcon className="h-3 w-3" /></>
              ) : (
                <><span className="text-xs">mostra</span> <ChevronDownIcon className="h-3 w-3" /></>
              )}
            </button>
          </p>
          {expanded && (
            <div className="mt-1 p-2 bg-gray-50 rounded-md text-sm">
              {plantInfo.symptoms}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default PlantInfoSummary;
