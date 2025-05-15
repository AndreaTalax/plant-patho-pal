
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnalysisDetails } from '../types';

export interface PlantInfoCardProps {
  plantInfo: any;
  analysisDetails: AnalysisDetails | null;
}

const PlantInfoCard: React.FC<PlantInfoCardProps> = ({ plantInfo, analysisDetails }) => {
  const plantName = analysisDetails?.multiServiceInsights?.plantName || plantInfo?.name || 'Unknown Plant';
  
  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{plantName}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-sm">
          {plantInfo && (
            <div className="grid grid-cols-2 gap-2">
              <div>Environment:</div>
              <div>{plantInfo.isIndoor ? 'Indoor' : 'Outdoor'}</div>
              
              <div>Light exposure:</div>
              <div>{plantInfo.inSunlight ? 'Sunny' : 'Shaded'}</div>
              
              <div>Watering frequency:</div>
              <div>{plantInfo.wateringFrequency || 'Not specified'} times/week</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PlantInfoCard;
