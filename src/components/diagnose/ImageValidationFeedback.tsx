import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, XCircle, AlertCircle, Eye, Loader2 } from 'lucide-react';
import type { ImageValidationResult } from '@/hooks/useImageValidation';

interface ImageValidationFeedbackProps {
  isValidating: boolean;
  validationResult: ImageValidationResult | null;
  imageFile?: File;
}

export const ImageValidationFeedback: React.FC<ImageValidationFeedbackProps> = ({
  isValidating,
  validationResult,
  imageFile
}) => {
  if (!imageFile && !isValidating && !validationResult) {
    return null;
  }

  const getStatusIcon = () => {
    if (isValidating) {
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    }
    
    if (!validationResult) return null;

    if (validationResult.isValid) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    
    if (validationResult.isPlant) {
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
    
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusText = () => {
    if (isValidating) {
      return "Verifica se l'immagine contiene una pianta...";
    }
    
    if (!validationResult) return null;

    if (validationResult.isValid) {
      return `Pianta rilevata con confidenza ${validationResult.confidence.toFixed(1)}%`;
    }
    
    if (validationResult.isPlant) {
      return `Pianta rilevata ma con bassa confidenza (${validationResult.confidence.toFixed(1)}%)`;
    }
    
    return "Nessuna pianta rilevata nell'immagine";
  };

  const getStatusColor = () => {
    if (isValidating) return "bg-blue-50 border-blue-200";
    if (!validationResult) return "";
    
    if (validationResult.isValid) return "bg-green-50 border-green-200";
    if (validationResult.isPlant) return "bg-yellow-50 border-yellow-200";
    return "bg-red-50 border-red-200";
  };

  const getBadgeVariant = () => {
    if (isValidating) return "secondary";
    if (!validationResult) return "secondary";
    
    if (validationResult.isValid) return "default";
    if (validationResult.isPlant) return "secondary";
    return "destructive";
  };

  return (
    <Card className={`${getStatusColor()} transition-colors duration-300`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">
              Validazione immagine
            </span>
          </div>
          
          <Badge variant={getBadgeVariant()} className="text-xs">
            {isValidating ? 'In corso...' : 
             validationResult?.isValid ? 'Valida' : 
             validationResult?.isPlant ? 'Attenzione' : 'Non valida'}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2 mb-2">
          {getStatusIcon()}
          <span className="text-sm text-gray-600">
            {getStatusText()}
          </span>
        </div>
        
        {validationResult && validationResult.qualityIssues.length > 0 && (
          <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
            <strong>Problemi rilevati:</strong> {validationResult.qualityIssues.join(', ')}
          </div>
        )}
        
        {validationResult && !validationResult.isValid && (
          <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-700">
            <strong>Consiglio:</strong> Carica un'immagine che mostri chiaramente foglie, fiori o parti verdi della pianta con buona illuminazione.
          </div>
        )}
      </CardContent>
    </Card>
  );
};