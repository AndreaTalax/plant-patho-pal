
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Eye, Microscope, AlertCircle, CheckCircle } from 'lucide-react';
import type { DiagnosedDisease, AnalysisDetails } from '@/components/diagnose/types';
import ProductSuggestions from './ProductSuggestions';

interface DiagnosisResultProps {
  diagnosedDisease: DiagnosedDisease;
  analysisDetails?: AnalysisDetails | null;
  diagnosisResult?: string | null;
}

const DiagnosisResult = ({ diagnosedDisease, analysisDetails, diagnosisResult }: DiagnosisResultProps) => {
  const isHealthy = diagnosedDisease.healthy;
  const confidence = diagnosedDisease.confidence || 0;
  
  // Extract visual symptoms and analysis from analysisDetails
  const visualSymptoms = (analysisDetails as any)?.visualSymptoms || [];
  const visualAnalysis = (analysisDetails as any)?.visualAnalysis || '';
  const possibleDiseases = (analysisDetails as any)?.possibleDiseases || [];

  // Get severity based on confidence and symptoms
  const getSeverity = () => {
    if (isHealthy) return 'healthy';
    if (confidence > 60 || diagnosedDisease.symptoms.length > 3) return 'high';
    if (confidence > 40 || diagnosedDisease.symptoms.length > 1) return 'medium';
    return 'low';
  };

  const severity = getSeverity();
  
  const getSeverityColor = () => {
    switch (severity) {
      case 'healthy': return 'text-green-600 bg-green-50 border-green-200';
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityText = () => {
    switch (severity) {
      case 'healthy': return 'Pianta Sana';
      case 'high': return 'Problema Grave';
      case 'medium': return 'Problema Moderato';
      case 'low': return 'Problema Lieve';
      default: return 'Da Monitorare';
    }
  };

  const getSeverityIcon = () => {
    switch (severity) {
      case 'healthy': return <CheckCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Diagnosis Card */}
      <Card className={`border-2 ${getSeverityColor()}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {getSeverityIcon()}
              {diagnosedDisease.name}
            </CardTitle>
            <Badge variant={isHealthy ? "default" : "destructive"}>
              {confidence}% accuratezza
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getSeverityColor()}>
              {getSeverityText()}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {diagnosedDisease.description && (
            <p className="text-gray-700">{diagnosedDisease.description}</p>
          )}

          {/* Visual Symptoms Analysis */}
          {(visualAnalysis || visualSymptoms.length > 0) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="h-4 w-4 text-blue-600" />
                <h4 className="font-semibold text-blue-800">Analisi Sintomi Visivi</h4>
              </div>
              {visualAnalysis && (
                <p className="text-blue-700 mb-2">{visualAnalysis}</p>
              )}
              {visualSymptoms.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {visualSymptoms.slice(0, 4).map((symptom: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-blue-700 border-blue-300">
                      {symptom}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Multiple Disease Hypotheses */}
          {possibleDiseases.length > 1 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Microscope className="h-4 w-4 text-gray-600" />
                <h4 className="font-semibold text-gray-800">Ipotesi Alternative</h4>
              </div>
              {possibleDiseases.slice(1, 3).map((disease: any, index: number) => (
                <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-800">{disease.name}</span>
                    <Badge variant="outline">
                      {Math.round((disease.probability || 0) * 100)}%
                    </Badge>
                  </div>
                  {disease.visualAnalysis && (
                    <p className="text-sm text-gray-600 mb-1">
                      <Eye className="h-3 w-3 inline mr-1" />
                      {disease.visualAnalysis}
                    </p>
                  )}
                  {disease.description && (
                    <p className="text-sm text-gray-600">{disease.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          <Separator />

          {/* Symptoms */}
          {diagnosedDisease.symptoms.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Sintomi Identificati</h4>
              <div className="flex flex-wrap gap-2">
                {diagnosedDisease.symptoms.map((symptom, index) => (
                  <Badge key={index} variant="outline">
                    {symptom}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Zona Colpita */}
          <div>
            <h4 className="font-semibold mb-2">Zona Colpita</h4>
            <p className="text-gray-700">
              {visualSymptoms.some((s: string) => s.includes('foglia') || s.includes('leaf')) ? 'Foglie' :
               diagnosedDisease.symptoms.some(s => s.toLowerCase().includes('root')) ? 'Radici' :
               diagnosedDisease.symptoms.some(s => s.toLowerCase().includes('stem')) ? 'Fusto' :
               diagnosedDisease.symptoms.some(s => s.toLowerCase().includes('flower')) ? 'Fiori' :
               'Sistema fogliare'}
            </p>
          </div>

          {/* Treatments */}
          {diagnosedDisease.treatments.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Trattamenti Suggeriti</h4>
              <ul className="list-disc list-inside space-y-1">
                {diagnosedDisease.treatments.slice(0, 3).map((treatment, index) => (
                  <li key={index} className="text-gray-700">{treatment}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Expert Recommendation */}
          {diagnosedDisease.recommendExpertConsultation && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-yellow-800 text-sm">
                ⚠️ Si consiglia una consulenza esperta per una diagnosi più accurata e un piano di trattamento personalizzato.
              </p>
            </div>
          )}
          
          {diagnosedDisease.disclaimer && (
            <p className="text-xs text-gray-500 italic">{diagnosedDisease.disclaimer}</p>
          )}
        </CardContent>
      </Card>

      {/* Product Suggestions */}
      {!isHealthy && <ProductSuggestions diagnosedDisease={diagnosedDisease} />}
    </div>
  );
};

export default DiagnosisResult;
