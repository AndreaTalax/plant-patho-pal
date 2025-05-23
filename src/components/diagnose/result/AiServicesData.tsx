
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatPercentage } from '@/utils/plant-analysis';
import { AlertTriangle } from 'lucide-react';
import { DiagnosedDisease } from '../types';

interface AiServicesDataProps {
  analysisDetails: any;
  isAnalyzing: boolean;
  plantSymptoms?: string;
  standardizedData?: DiagnosedDisease | null;
}

const AiServicesData = ({ analysisDetails, isAnalyzing, plantSymptoms, standardizedData }: AiServicesDataProps) => {
  if (isAnalyzing || !analysisDetails) {
    return null;
  }

  // Format analysis details into a more explanatory output
  const generateDiagnosisExplanation = () => {
    if (!analysisDetails || !plantSymptoms) return '';
    
    // Get plant name and potential disease
    const plantName = standardizedData?.label || 
                     analysisDetails?.multiServiceInsights?.plantName || 
                     'pianta';
    const isHealthy = standardizedData?.healthy !== undefined ? 
                     standardizedData.healthy : 
                     analysisDetails?.multiServiceInsights?.isHealthy;
    const detectedDisease = standardizedData?.disease?.name || 
                          standardizedData?.name ||
                          analysisDetails?.multiServiceInsights?.huggingFaceResult?.label;
    
    // Extract environmental factors from symptoms
    const hasOverwatering = plantSymptoms.toLowerCase().includes('umid') || 
                         plantSymptoms.toLowerCase().includes('acqua') ||
                         plantSymptoms.toLowerCase().includes('marci');
                         
    const hasLightIssues = plantSymptoms.toLowerCase().includes('giall') || 
                        plantSymptoms.toLowerCase().includes('luce') ||
                        plantSymptoms.toLowerCase().includes('sole');
                        
    const hasLeafProblems = plantSymptoms.toLowerCase().includes('foglie') || 
                         plantSymptoms.toLowerCase().includes('macchie') ||
                         plantSymptoms.toLowerCase().includes('foglia');
    
    let explanation = '';
    
    if (isHealthy) {
      explanation = `Dall'analisi dei sintomi descritti e dell'immagine fornita, la tua ${plantName} sembra essere in buona salute. `;
      
      // Add preventive advice
      explanation += 'Per mantenere la pianta in salute, assicurati di: \n\n';
      explanation += '- Mantenere un regime di irrigazione adeguato alle esigenze della specie\n';
      explanation += '- Garantire un\'esposizione alla luce appropriata\n';
      explanation += '- Controllare regolarmente la presenza di parassiti o segni di malattia';
      
    } else {
      explanation = `Dall'analisi dei sintomi descritti e dell'immagine fornita effettuata con Plexi AI, la tua ${plantName} potrebbe presentare `;
      
      if (detectedDisease) {
        explanation += `segni compatibili con ${detectedDisease}. `;
      } else {
        explanation += 'alcuni problemi di salute. ';
      }
      
      explanation += '\n\nPossibili cause:\n';
      
      if (hasOverwatering) {
        explanation += '- Problemi di irrigazione: potrebbe trattarsi di eccesso o carenza d\'acqua\n';
      }
      
      if (hasLightIssues) {
        explanation += '- Esposizione alla luce inadeguata: troppa o troppo poca luce\n';
      }
      
      if (hasLeafProblems) {
        explanation += '- Possibile infezione fungina o attacco di parassiti\n';
      }
      
      explanation += '- Carenza di nutrienti nel terreno\n\n';
      
      explanation += 'Si consiglia di consultare un fitopatologo per una diagnosi più accurata e un trattamento specifico.';
    }
    
    return explanation;
  };

  const diagnosisExplanation = generateDiagnosisExplanation();

  return (
    <Card className="p-4 bg-white">
      <div className="mb-3 border-b pb-2">
        <h3 className="text-lg font-medium">Analisi diagnostica con Plexi AI</h3>
      </div>

      <div className="space-y-4">
        {diagnosisExplanation && (
          <div className="bg-blue-50 rounded-md p-4 border border-blue-100">
            <h4 className="font-medium text-blue-800 mb-2">Interpretazione diagnostica:</h4>
            <p className="text-sm text-blue-700 whitespace-pre-line">{diagnosisExplanation}</p>
          </div>
        )}

        <div className="pt-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-700">Dettagli analisi</h4>
            <Badge 
              variant="outline" 
              className={`${analysisDetails?.multiServiceInsights?.isHealthy 
                ? 'bg-green-50 text-green-700 border-green-200' 
                : 'bg-amber-50 text-amber-700 border-amber-200'}`}
            >
              {analysisDetails?.multiServiceInsights?.isHealthy 
                ? 'Pianta sana' 
                : 'Rilevati problemi'}
            </Badge>
          </div>

          <div className="space-y-2 mt-3">
            <div className="bg-gray-50 p-3 rounded-md">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Specie identificata:</span>
                <span className="text-sm font-medium">{analysisDetails?.multiServiceInsights?.plantSpecies || 'Non identificata'}</span>
              </div>
            </div>
            
            {analysisDetails?.multiServiceInsights?.leafAnalysis && (
              <div className="bg-gray-50 p-3 rounded-md">
                <h5 className="text-sm font-medium mb-1">Analisi fogliare:</h5>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Colore foglie:</span>
                    <span>{analysisDetails.multiServiceInsights.leafAnalysis.leafColor}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pattern rilevato:</span>
                    <span>{analysisDetails.multiServiceInsights.leafAnalysis.patternDetected}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Stato di salute:</span>
                    <span>{analysisDetails.multiServiceInsights.leafAnalysis.healthStatus}</span>
                  </div>
                </div>
              </div>
            )}
            
            {analysisDetails?.recommendedAdditionalTests && (
              <div className="bg-gray-50 p-3 rounded-md">
                <h5 className="text-sm font-medium mb-1">Test aggiuntivi consigliati:</h5>
                <ul className="list-disc list-inside text-xs space-y-0.5 text-gray-700">
                  {analysisDetails.recommendedAdditionalTests.map((test: string, index: number) => (
                    <li key={index}>{test}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-amber-700">
            <p className="font-medium mb-1">Nota importante:</p>
            <p>
              Questa è una diagnosi preliminare basata sull'analisi dell'immagine e dei sintomi descritti.
              Per un trattamento specifico e affidabile, è consigliabile consultare un fitopatologo professionista.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default AiServicesData;
