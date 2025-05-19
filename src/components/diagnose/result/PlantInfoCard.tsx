
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnalysisDetails } from '../types';

export interface PlantInfoCardProps {
  plantInfo: any;
  analysisDetails: AnalysisDetails | null;
}

const PlantInfoCard: React.FC<PlantInfoCardProps> = ({ plantInfo, analysisDetails }) => {
  // Utilizziamo sia plantName che plantSpecies per una migliore visualizzazione
  const plantName = analysisDetails?.multiServiceInsights?.plantName || 'Pianta sconosciuta';
  const plantSpecies = analysisDetails?.multiServiceInsights?.plantSpecies || plantName;
  
  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{plantName}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-sm">
          {plantInfo && (
            <div className="grid grid-cols-2 gap-2">
              <div>Ambiente:</div>
              <div>{plantInfo.isIndoor ? 'Interno' : 'Esterno'}</div>
              
              <div>Frequenza d'irrigazione:</div>
              <div>{plantInfo.wateringFrequency || 'Non specificata'} volte/settimana</div>
              
              <div>Specie:</div>
              <div>{plantSpecies || 'Sconosciuta'}</div>
              
              <div>Parte della pianta:</div>
              <div>{analysisDetails?.multiServiceInsights?.plantPart || 'Intera pianta'}</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PlantInfoCard;
