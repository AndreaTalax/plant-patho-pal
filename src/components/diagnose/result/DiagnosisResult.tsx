
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Eye, Microscope, AlertCircle, CheckCircle } from 'lucide-react';
import type { DiagnosedDisease, AnalysisDetails, PlantInfo } from '@/components/diagnose/types';
import ProductSuggestions from './ProductSuggestions';

interface DiagnosisResultProps {
  // Props già usati internamente in questa versione
  diagnosedDisease?: DiagnosedDisease | null;
  analysisDetails?: AnalysisDetails | null;
  diagnosisResult?: string | null;

  // Props necessari per compatibilità con i chiamanti (DiagnoseTab, DiagnosisStages)
  imageSrc?: string;
  plantInfo?: PlantInfo;
  analysisData?: DiagnosedDisease | null;
  isAnalyzing?: boolean;
  onStartNewAnalysis?: () => void;
  onChatWithExpert?: () => void | Promise<void>;
}

const DiagnosisResult = ({
  diagnosedDisease: diagnosedDiseaseProp,
  analysisDetails,
  diagnosisResult,
  imageSrc,            // compat: non usato qui, ma accettato per tipizzazione
  plantInfo,           // compat
  analysisData,        // compat: se presente, ha priorità
  isAnalyzing,         // compat
  onStartNewAnalysis,  // compat
  onChatWithExpert,    // compat
}: DiagnosisResultProps) => {
  // Usa analysisData se fornito dai chiamanti, altrimenti fallback a diagnosedDiseaseProp
  const diagnosedDisease = analysisData ?? diagnosedDiseaseProp ?? null;

  // Evita accessi a proprietà su undefined
  const isHealthy = diagnosedDisease?.healthy ?? false;
  const confidence = diagnosedDisease?.confidence ?? 0;

  // Estratti dai dettagli (già previsti come any nella generazione precedente)
  const visualSymptoms = (analysisDetails as any)?.visualSymptoms || [];
  const visualAnalysis = (analysisDetails as any)?.visualAnalysis || '';
  const possibleDiseases = (analysisDetails as any)?.possibleDiseases || [];

  const diseaseSymptoms = Array.isArray(diagnosedDisease?.symptoms) ? diagnosedDisease!.symptoms : [];
  const diseaseTreatments = Array.isArray(diagnosedDisease?.treatments) ? diagnosedDisease!.treatments : [];

  // Get severity based on confidence and symptoms
  const getSeverity = () => {
    if (isHealthy) return 'healthy';
    if (confidence > 60 || diseaseSymptoms.length > 3) return 'high';
    if (confidence > 40 || diseaseSymptoms.length > 1) return 'medium';
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
    <div className="space-y-4 px-2">
      {/* Main Diagnosis Card */}
      <Card className={`border-2 ${getSeverityColor()}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              {getSeverityIcon()}
              <span className="break-words">{diagnosedDisease?.name || 'Diagnosi'}</span>
            </CardTitle>
            <Badge variant={isHealthy ? "default" : "destructive"} className="text-xs px-2 py-1">
              {confidence}% accuratezza
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={`${getSeverityColor()} text-xs px-2 py-1`}>
              {getSeverityText()}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 pt-0">
          {diagnosedDisease?.description && (
            <p className="text-gray-700 text-sm leading-relaxed">{diagnosedDisease.description}</p>
          )}

          {/* Visual Symptoms Analysis */}
          {(visualAnalysis || (visualSymptoms && visualSymptoms.length > 0)) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="h-4 w-4 text-blue-600" />
                <h4 className="font-semibold text-blue-800 text-sm">Analisi Sintomi Visivi</h4>
              </div>
              {visualAnalysis && (
                <p className="text-blue-700 mb-2 text-sm leading-relaxed">{visualAnalysis}</p>
              )}
              {visualSymptoms && visualSymptoms.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {visualSymptoms.slice(0, 4).map((symptom: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-blue-700 border-blue-300 text-xs px-2 py-1">
                      {symptom}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Multiple Disease Hypotheses */}
          {Array.isArray(possibleDiseases) && possibleDiseases.length > 1 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Microscope className="h-4 w-4 text-gray-600" />
                <h4 className="font-semibold text-gray-800 text-sm">Ipotesi Alternative</h4>
              </div>
              {possibleDiseases.slice(1, 3).map((disease: any, index: number) => (
                <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-800 text-sm break-words">{disease?.name}</span>
                    <Badge variant="outline" className="text-xs px-2 py-1">
                      {Math.round((disease?.probability || 0) * 100)}%
                    </Badge>
                  </div>
                  {disease?.visualAnalysis && (
                    <p className="text-xs text-gray-600 mb-1">
                      <Eye className="h-3 w-3 inline mr-1" />
                      {disease.visualAnalysis}
                    </p>
                  )}
                  {disease?.description && (
                    <p className="text-xs text-gray-600 leading-relaxed">{disease.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          <Separator />

          {/* Symptoms */}
          {diseaseSymptoms.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2 text-sm">Sintomi Identificati</h4>
              <div className="flex flex-wrap gap-1">
                {diseaseSymptoms.map((symptom, index) => (
                  <Badge key={index} variant="outline" className="text-xs px-2 py-1">
                    {symptom}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Zona Colpita */}
          <div>
            <h4 className="font-semibold mb-2 text-sm">Zona Colpita</h4>
            <p className="text-gray-700 text-sm">
              {(visualSymptoms || []).some((s: string) => s.includes('foglia') || s.includes('leaf')) ? 'Foglie' :
               (diseaseSymptoms || []).some(s => s.toLowerCase().includes('root')) ? 'Radici' :
               (diseaseSymptoms || []).some(s => s.toLowerCase().includes('stem')) ? 'Fusto' :
               (diseaseSymptoms || []).some(s => s.toLowerCase().includes('flower')) ? 'Fiori' :
               'Sistema fogliare'}
            </p>
          </div>

          {/* Treatments */}
          {diseaseTreatments.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2 text-sm">Trattamenti Suggeriti</h4>
              <ul className="list-disc list-inside space-y-1">
                {diseaseTreatments.slice(0, 3).map((treatment, index) => (
                  <li key={index} className="text-gray-700 text-sm leading-relaxed">{treatment}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Expert Recommendation */}
          {diagnosedDisease?.recommendExpertConsultation && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-yellow-800 text-xs leading-relaxed">
                ⚠️ Si consiglia una consulenza esperta per una diagnosi più accurata e un piano di trattamento personalizzato.
              </p>
            </div>
          )}

          {diagnosedDisease?.disclaimer && (
            <p className="text-xs text-gray-500 italic leading-relaxed">{diagnosedDisease.disclaimer}</p>
          )}
        </CardContent>
      </Card>

      {/* Product Suggestions */}
      {!isHealthy && diagnosedDisease?.name && (
        <ProductSuggestions diseaseName={diagnosedDisease.name} />
      )}
    </div>
  );
};

export default DiagnosisResult;
