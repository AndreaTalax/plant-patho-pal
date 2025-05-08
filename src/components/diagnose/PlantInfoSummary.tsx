
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PlantInfoFormValues } from './PlantInfoForm';

interface PlantInfoSummaryProps {
  plantInfo: {
    isIndoor: boolean;
    inSunlight: boolean;
    wateringFrequency: string;
  };
  onEdit: () => void;
}

const PlantInfoSummary = ({ plantInfo, onEdit }: PlantInfoSummaryProps) => {
  return (
    <Card className="bg-white p-4 shadow-md rounded-2xl mb-6">
      <div className="bg-drplant-green/10 p-4 rounded-lg">
        <h4 className="font-medium mb-2">Informazioni sulla pianta</h4>
        <div className="text-sm space-y-2">
          <div className="flex items-center gap-2">
            <Checkbox checked={plantInfo.isIndoor} disabled />
            <span>All'interno dell'abitazione</span>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox checked={plantInfo.inSunlight} disabled />
            <span>Esposta alla luce del sole</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Irrigazione: </span>
            <span>{plantInfo.wateringFrequency} volte a settimana</span>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={onEdit}
        >
          Modifica
        </Button>
      </div>
    </Card>
  );
};

export default PlantInfoSummary;
