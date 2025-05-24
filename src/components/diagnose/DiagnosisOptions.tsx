
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, MessageCircle, CheckCircle, AlertTriangle, Crown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface DiagnosisOptionsProps {
  onSelectAI: () => void;
  onSelectExpert: () => void;
}

const DiagnosisOptions: React.FC<DiagnosisOptionsProps> = ({ onSelectAI, onSelectExpert }) => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Scansione Pianta</h2>
        <p className="text-gray-600">Scegli il metodo di diagnosi che preferisci</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Diagnosi AI Multi-Sistema */}
        <Card className="p-6 bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="text-center">
            <div className="bg-purple-100 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-purple-800 mb-3">Diagnosi AI Multi-Sistema</h3>
            
            <div className="space-y-3 text-left mb-6">
              <div className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">Analisi istantanea con 3 AI: Rougen, Plant Diseases, Plexi</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">Prodotti consigliati automaticamente</span>
              </div>
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">Accuratezza: 60-75% per diagnosi preliminare</span>
              </div>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
              <h4 className="font-semibold text-orange-800 mb-2 text-sm">Statistiche Accuratezza AI:</h4>
              <ul className="space-y-1 text-xs text-orange-700">
                <li>• Diagnosi preliminare: 60-75%</li>
                <li>• Diagnosi precisa confermata: &lt;50%</li>
                <li>• Migliore con foto chiare e sintomi visibili</li>
              </ul>
            </div>

            <div className="bg-gray-100 rounded-lg p-2 mb-4">
              <span className="text-gray-600 text-sm">Richiede Abbonamento Premium</span>
            </div>

            <Button 
              onClick={onSelectAI}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Usa Diagnosi AI
            </Button>
          </div>
        </Card>

        {/* Consulto Fitopatologo */}
        <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="text-center">
            <div className="bg-green-100 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <MessageCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-green-800 mb-3">Consulto Fitopatologo</h3>
            
            <div className="space-y-3 text-left mb-6">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">Diagnosi professionale personalizzata</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">Chat privata con l'esperto</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">Trattamenti specifici e followup</span>
              </div>
            </div>

            <div className="bg-green-100 border border-green-300 rounded-lg p-3 mb-4">
              <h4 className="font-semibold text-green-800 mb-2 text-sm">Cosa riceverà l'esperto:</h4>
              <ul className="space-y-1 text-xs text-green-700">
                <li>• Foto della pianta e sintomi</li>
                <li>• I tuoi dati personali</li>
                <li>• Descrizione dettagliata dei sintomi</li>
                <li>• Informazioni su irrigazione ed esposizione</li>
              </ul>
            </div>

            <Button 
              onClick={onSelectExpert}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              disabled={!isAuthenticated}
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              {isAuthenticated ? 'Contatta Fitopatologo' : 'Accedi per Contattare'}
            </Button>
          </div>
        </Card>
      </div>

      {/* Sezione Sblocca la Diagnosi AI */}
      <Card className="p-6 bg-gradient-to-r from-yellow-50 to-amber-50 border-amber-200">
        <div className="text-center">
          <Crown className="h-12 w-12 text-amber-600 mx-auto mb-3" />
          <h3 className="text-xl font-bold text-amber-800 mb-2">Sblocca la Diagnosi AI</h3>
          <p className="text-amber-700 mb-4">
            Sottoscrivi l'abbonamento Premium per accedere alla diagnosi AI multi-sistema con 
            raccomandazioni automatiche di prodotti
          </p>
          <Button variant="outline" className="border-amber-600 text-amber-700 hover:bg-amber-50">
            Scopri Premium
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default DiagnosisOptions;
