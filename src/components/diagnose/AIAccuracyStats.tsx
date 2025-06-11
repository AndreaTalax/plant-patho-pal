
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Brain, TrendingUp, AlertTriangle } from 'lucide-react';

const AIAccuracyStats = () => {
  return (
    <Card className="w-full max-w-2xl mx-auto mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Brain className="h-5 w-5 text-drplant-blue" />
          Accuratezza Diagnosi AI
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Diagnosi preliminare basata su immagine</span>
              <span className="text-sm font-bold text-green-600">60-75%</span>
            </div>
            <Progress value={67.5} className="h-2" />
            <p className="text-xs text-gray-600 mt-1">
              Soprattutto se la foto è chiara e mostra bene i sintomi
            </p>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Diagnosi precisa e confermata</span>
              <span className="text-sm font-bold text-amber-600">&lt;50%</span>
            </div>
            <Progress value={45} className="h-2" />
            <p className="text-xs text-gray-600 mt-1">
              Se non supportata da altri dati (condizioni ambientali, esami di laboratorio)
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="text-green-700">Migliore con foto di qualità</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span className="text-amber-700">Conferma esperto consigliata</span>
          </div>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-3 mt-4">
          <p className="text-sm text-blue-800">
            <strong>Nota:</strong> La diagnosi AI è uno strumento di supporto. Per diagnosi definitive e trattamenti specifici, 
            consulta sempre il nostro fitopatologo esperto.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIAccuracyStats;
