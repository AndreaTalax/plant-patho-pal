
import { PlantInfoFormValues } from '../PlantInfoForm';

interface PlantInfoCardProps {
  plantInfo: PlantInfoFormValues;
}

const PlantInfoCard = ({ plantInfo }: PlantInfoCardProps) => {
  return (
    <div className="bg-drplant-green/10 p-3 rounded-lg mb-4">
      <h4 className="font-medium mb-1">Informazioni sulla pianta</h4>
      <div className="text-sm space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-gray-600">Ambiente: </span>
          <span>{plantInfo.isIndoor ? "Interno" : "Esterno"}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-600">Esposizione: </span>
          <span>{plantInfo.inSunlight ? "Soleggiata" : "Ombreggiata"}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-600">Irrigazione: </span>
          <span>{plantInfo.wateringFrequency} volte/settimana</span>
        </div>
      </div>
    </div>
  );
};

export default PlantInfoCard;
