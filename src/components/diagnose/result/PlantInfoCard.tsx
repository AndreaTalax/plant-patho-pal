
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnalysisDetails, DiagnosedDisease } from '../types';

export interface PlantInfoCardProps {
  plantInfo: any;
  analysisDetails: AnalysisDetails | null;
  standardizedData?: DiagnosedDisease | null;
}

/**
 * Displays detailed information about a plant within a styled card component.
 * @example
 * displayPlantDetails({
 *   plantInfo: { isIndoor: true, wateringFrequency: 3 },
 *   analysisDetails: { multiServiceInsights: { plantName: 'Rose', plantSpecies: 'Rosa', plantPart: 'Leaf' } },
 *   standardizedData: { label: 'Standard Rose' }
 * })
 * // Returns a JSX element that represents a card containing plant information.
 * @param {Object} components - The input object containing detailed plant information.
 * @param {Object} components.plantInfo - Information about the plant's environment and watering details.
 * @param {Object} components.analysisDetails - Detailed analysis data from multiple insights.
 * @param {Object} components.standardizedData - Centralized data for plant details.
 * @returns {JSX.Element} A card component containing plant information.
 * @description
 *   - Utilizes both plantName and plantSpecies for enhanced display purposes.
 *   - Handles fallback scenarios for unavailability of specific data points.
 *   - Integrates plantIdData when available to enrich displayed data with taxonomy and common names.
 */
const PlantInfoCard: React.FC<PlantInfoCardProps> = ({ 
  plantInfo, 
  analysisDetails,
  standardizedData 
}) => {
  // Utilizziamo sia plantName che plantSpecies per una migliore visualizzazione
  const plantName = analysisDetails?.multiServiceInsights?.plantName || 
                    standardizedData?.label ||
                    'Pianta sconosciuta';
  const plantSpecies = analysisDetails?.multiServiceInsights?.plantSpecies || plantName;
  
  // Check for Plant.id specific data
  const plantIdData = analysisDetails?.risultatiCompleti?.plantIdResult;
  const hasPlantIdData = !!plantIdData;
  
  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{plantName}</CardTitle>
        {hasPlantIdData && plantIdData.commonNames && plantIdData.commonNames.length > 0 && (
          <div className="text-sm text-muted-foreground">
            Nomi comuni: {plantIdData.commonNames.slice(0, 3).join(", ")}
            {plantIdData.commonNames.length > 3 && "..."}
          </div>
        )}
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
              
              {hasPlantIdData && plantIdData.taxonomy && (
                <>
                  <div>Famiglia:</div>
                  <div>{plantIdData.taxonomy.family || 'Non disponibile'}</div>
                  
                  <div>Genere:</div>
                  <div>{plantIdData.taxonomy.genus || 'Non disponibile'}</div>
                </>
              )}
              
              {hasPlantIdData && plantIdData.edibleParts && plantIdData.edibleParts.length > 0 && (
                <>
                  <div>Parti commestibili:</div>
                  <div>{plantIdData.edibleParts.join(", ")}</div>
                </>
              )}
            </div>
          )}
          
          {hasPlantIdData && plantIdData.wikiDescription && (
            <div className="mt-3">
              <div className="font-medium mb-1">Descrizione:</div>
              <div className="text-xs text-muted-foreground">
                {plantIdData.wikiDescription.length > 200 
                  ? `${plantIdData.wikiDescription.substring(0, 200)}...` 
                  : plantIdData.wikiDescription}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PlantInfoCard;
