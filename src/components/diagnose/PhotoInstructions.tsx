
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, CheckCircle, AlertCircle } from 'lucide-react';

const PhotoInstructions = () => {
  return (
    <Card className="w-full max-w-2xl mx-auto mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Camera className="h-5 w-5 text-drplant-green" />
          Come scattare la foto perfetta
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-green-800">Pianta in vaso</p>
                <p className="text-sm text-gray-600">Fotografa l'intera pianta includendo il vaso e la terra visibile</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-green-800">Pianta in terra</p>
                <p className="text-sm text-gray-600">Includi la pianta e la terra circostante per contesto ambientale</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-green-800">Luce naturale</p>
                <p className="text-sm text-gray-600">Scatta in condizioni di buona illuminazione, possibilmente naturale</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-green-800">Sfondo visibile</p>
                <p className="text-sm text-gray-600">Posiziona la pianta in modo che si veda anche il pavimento o lo sfondo per un contesto migliore</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-amber-800">Sintomi visibili</p>
                <p className="text-sm text-gray-600">Assicurati che eventuali problemi (foglie gialle, macchie) siano ben visibili</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-amber-800">Inquadratura stabile</p>
                <p className="text-sm text-gray-600">Mantieni il telefono fermo per evitare foto mosse o sfocate</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-amber-800">Distanza appropriata</p>
                <p className="text-sm text-gray-600">Non troppo vicino, non troppo lontano - la pianta deve riempire l'inquadratura</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-drplant-green/10 rounded-lg p-3 mt-4">
          <p className="text-sm text-drplant-green font-medium">
            💡 Suggerimento: Una foto di qualità migliora significativamente l'accuratezza della diagnosi AI
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PhotoInstructions;
