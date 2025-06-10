
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit2, Home, Sun, Droplets, AlertCircle } from 'lucide-react';

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
  return (
    <Card className="w-full max-w-2xl mx-auto mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Riepilogo Informazioni Pianta</CardTitle>
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Edit2 className="h-4 w-4 mr-2" />
            Modifica
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Home className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium">Ambiente:</span>
          <span className="text-sm">{plantInfo.isIndoor ? 'Interno' : 'Esterno'}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Droplets className="h-4 w-4 text-blue-500" />
          <span className="text-sm font-medium">Irrigazione:</span>
          <span className="text-sm">{plantInfo.wateringFrequency}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Sun className="h-4 w-4 text-yellow-500" />
          <span className="text-sm font-medium">Luce:</span>
          <span className="text-sm">{plantInfo.lightExposure}</span>
        </div>
        
        {plantInfo.symptoms && (
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
            <div>
              <span className="text-sm font-medium">Sintomi:</span>
              <p className="text-sm text-gray-600 mt-1">{plantInfo.symptoms}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PlantInfoSummary;
