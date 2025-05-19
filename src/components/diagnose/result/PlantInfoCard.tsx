
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnalysisDetails } from '../types';

export interface PlantInfoCardProps {
  plantInfo: any;
  analysisDetails: AnalysisDetails | null;
}

const PlantInfoCard: React.FC<PlantInfoCardProps> = ({ plantInfo, analysisDetails }) => {
  // Use either multiServiceInsights or direct property with fallback
  const plantName = 
    (analysisDetails?.multiServiceInsights?.plantName) || 
    analysisDetails?.plantName || 
    'Pianta sconosciuta';
    
  const plantSpecies = 
    (analysisDetails?.multiServiceInsights?.plantSpecies) || 
    analysisDetails?.plantSpecies || 
    plantName;
  
  const plantPart = analysisDetails?.multiServiceInsights?.plantPart || 'Intera pianta';
  
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
              <div>{plantPart}</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PlantInfoCard;
