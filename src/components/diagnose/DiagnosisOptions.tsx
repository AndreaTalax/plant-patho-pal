
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, MessageCircle, Sparkles } from 'lucide-react';

interface DiagnosisOptionsProps {
  onSelectAI: () => void;
  onSelectExpert: () => void;
}

const DiagnosisOptions = ({ onSelectAI, onSelectExpert }: DiagnosisOptionsProps) => {
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-6 space-y-4">
        <h3 className="text-xl font-semibold text-center mb-6">
          Scegli il metodo di diagnosi
        </h3>
        
        {/* Opzione AI */}
        <Card 
          className="cursor-pointer transition-all hover:bg-blue-50 hover:ring-2 hover:ring-blue-500"
          onClick={onSelectAI}
        >
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 flex-1">
                <Brain className="h-6 w-6 text-blue-600" />
                <div>
                  <h4 className="text-base font-medium">
                    Diagnosi con Intelligenza Artificiale
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Analisi immediata con AI avanzata e database di malattie delle piante
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <Sparkles className="h-3 w-3 text-blue-500" />
                    <span className="text-xs text-blue-600 font-medium">Risultati in 30 secondi</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Opzione Esperto */}
        <Card 
          className="cursor-pointer transition-all hover:bg-green-50 hover:ring-2 hover:ring-green-500"
          onClick={onSelectExpert}
        >
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 flex-1">
                <MessageCircle className="h-6 w-6 text-green-600" />
                <div>
                  <h4 className="text-base font-medium">
                    Chat con Fitopatogo Esperto
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Consulenza diretta con un esperto qualificato in patologie vegetali
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <MessageCircle className="h-3 w-3 text-green-500" />
                    <span className="text-xs text-green-600 font-medium">Risposta personalizzata</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
};

export default DiagnosisOptions;
