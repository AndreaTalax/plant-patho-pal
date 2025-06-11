
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, MessageCircle, Zap, Users, Crown, Lock } from 'lucide-react';
import { usePremiumStatus } from '@/services/premiumService';
import { toast } from 'sonner';
import AIAccuracyStats from './AIAccuracyStats';

interface DiagnosisOptionsProps {
  onSelectAI: () => void;
  onSelectExpert: () => void;
}

const DiagnosisOptions: React.FC<DiagnosisOptionsProps> = ({
  onSelectAI,
  onSelectExpert
}) => {
  const { hasAIAccess, upgradeMessage } = usePremiumStatus();

  const handleAISelection = () => {
    if (!hasAIAccess) {
      toast.error(upgradeMessage, {
        description: "Puoi comunque consultare direttamente il nostro esperto!"
      });
      return;
    }
    onSelectAI();
  };

  return (
    <div className="space-y-6">
      <AIAccuracyStats />
      
      <div className="grid md:grid-cols-2 gap-4">
        {/* Opzione Diagnosi AI */}
        <Card className={`relative transition-all hover:shadow-lg ${!hasAIAccess ? 'opacity-75' : ''}`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Brain className="h-5 w-5 text-drplant-blue" />
                Diagnosi AI
              </CardTitle>
              {!hasAIAccess && (
                <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                  <Crown className="h-3 w-3 mr-1" />
                  Premium
                </Badge>
              )}
            </div>
            <CardDescription>
              Analisi immediata con intelligenza artificiale avanzata
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-green-600" />
                <span>Risultati in pochi secondi</span>
              </div>
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-blue-600" />
                <span>Database di migliaia di malattie</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-purple-600" />
                <span>Invio automatico all'esperto</span>
              </div>
            </div>
            
            <Button 
              onClick={handleAISelection}
              className="w-full"
              variant={!hasAIAccess ? "outline" : "default"}
              disabled={!hasAIAccess}
            >
              {!hasAIAccess && <Lock className="h-4 w-4 mr-2" />}
              {hasAIAccess ? 'Analizza con AI' : 'Richiede Premium'}
            </Button>
            
            {!hasAIAccess && (
              <p className="text-xs text-amber-600 text-center">
                Disponibile per utenti Premium
              </p>
            )}
          </CardContent>
        </Card>

        {/* Opzione Esperto */}
        <Card className="transition-all hover:shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-drplant-green" />
              Chat con Fitopatologo
            </CardTitle>
            <CardDescription>
              Consulenza diretta con il nostro esperto Marco Nigro
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-green-600" />
                <span>Fitopatologo qualificato</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-blue-600" />
                <span>Consulenza personalizzata</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-purple-600" />
                <span>Risposta entro 24h</span>
              </div>
            </div>
            
            <Button 
              onClick={onSelectExpert}
              className="w-full bg-drplant-green hover:bg-drplant-green-dark"
            >
              Chat con Esperto
            </Button>
            
            <p className="text-xs text-green-600 text-center">
              Sempre disponibile e gratuito
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-4">
        <p className="text-sm text-gray-700 text-center">
          <strong>Raccomandazione:</strong> Entrambe le opzioni inviano automaticamente 
          le tue informazioni e foto all'esperto per una valutazione completa.
        </p>
      </div>
    </div>
  );
};

export default DiagnosisOptions;
