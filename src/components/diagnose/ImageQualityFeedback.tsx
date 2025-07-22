import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';

interface ImageQualityResult {
  isValid: boolean;
  hasPlantContent: boolean;
  quality: number;
  issues: string[];
  suggestions: string[];
}

interface ImageQualityFeedbackProps {
  qualityResult: ImageQualityResult | null;
  isAnalyzing: boolean;
}

export const ImageQualityFeedback = ({ qualityResult, isAnalyzing }: ImageQualityFeedbackProps) => {
  if (!qualityResult && !isAnalyzing) return null;

  const getQualityColor = (quality: number) => {
    if (quality >= 0.8) return 'text-green-600';
    if (quality >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getQualityIcon = (quality: number) => {
    if (quality >= 0.8) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (quality >= 0.6) return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    return <XCircle className="h-4 w-4 text-red-600" />;
  };

  const getQualityBadge = (quality: number) => {
    if (quality >= 0.8) return <Badge variant="default" className="bg-green-100 text-green-800">Ottima</Badge>;
    if (quality >= 0.6) return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Buona</Badge>;
    return <Badge variant="destructive">Insufficiente</Badge>;
  };

  if (isAnalyzing && !qualityResult) {
    return (
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span className="text-sm text-muted-foreground">Analisi qualità immagine...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!qualityResult) return null;

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          {getQualityIcon(qualityResult.quality)}
          Qualità Immagine
          {getQualityBadge(qualityResult.quality)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Quality Score */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Punteggio qualità:</span>
          <span className={`font-medium ${getQualityColor(qualityResult.quality)}`}>
            {Math.round(qualityResult.quality * 100)}%
          </span>
        </div>

        {/* Plant Content Detection */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Contenuto vegetale:</span>
          {qualityResult.hasPlantContent ? (
            <Badge variant="default" className="bg-green-100 text-green-800">Rilevato</Badge>
          ) : (
            <Badge variant="destructive">Non rilevato</Badge>
          )}
        </div>

        {/* Issues */}
        {qualityResult.issues.length > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p className="font-medium">Problemi rilevati:</p>
                <ul className="text-sm list-disc list-inside space-y-1">
                  {qualityResult.issues.map((issue, index) => (
                    <li key={index}>{issue}</li>
                  ))}
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Suggestions */}
        {qualityResult.suggestions.length > 0 && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p className="font-medium">Suggerimenti per migliorare:</p>
                <ul className="text-sm list-disc list-inside space-y-1">
                  {qualityResult.suggestions.map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Success message for high quality */}
        {qualityResult.quality >= 0.8 && qualityResult.isValid && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription className="text-green-700">
              Immagine di ottima qualità! L'analisi AI dovrebbe fornire risultati accurati.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};