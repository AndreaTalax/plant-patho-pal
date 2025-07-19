
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, MessageCircle, Zap, Users, Crown, Lock } from 'lucide-react';
import { usePremiumStatus } from '@/services/premiumService';
import { toast } from 'sonner';
import AIAccuracyStats from './AIAccuracyStats';
import { PremiumPaywallModal } from "./PremiumPaywallModal";
import { useState } from "react";

interface DiagnosisOptionsProps {
  onSelectAI: () => void;
  onSelectExpert: () => void;
  hasAIAccess: boolean;
  canUseFreeDiagnosis?: boolean;
  remainingFreeDiagnoses?: number;
  hasActiveSubscription?: boolean;
}

const DiagnosisOptions: React.FC<DiagnosisOptionsProps> = ({
  onSelectAI,
  onSelectExpert,
  hasAIAccess,
  canUseFreeDiagnosis = true,
  remainingFreeDiagnoses = 3,
  hasActiveSubscription = false
}) => {
  const { hasExpertChatAccess, upgradeMessage } = usePremiumStatus();
  const [paywallOpen, setPaywallOpen] = useState(false);

  const handleExpertSelection = () => {
    if (!hasExpertChatAccess) {
      setPaywallOpen(true);
      return;
    }
    onSelectExpert();
  };

  return (
    <div className="space-y-6">
      <AIAccuracyStats />
      
      <div className="grid md:grid-cols-2 gap-4">
        {/* Opzione Diagnosi AI - ORA GRATUITA */}
        <Card className="transition-all hover:shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Brain className="h-5 w-5 text-drplant-blue" />
                Diagnosi AI
              </CardTitle>
              {hasActiveSubscription ? (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  Premium
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  {canUseFreeDiagnosis ? `${remainingFreeDiagnoses}/3 Gratis` : 'Limite Raggiunto'}
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
              onClick={onSelectAI}
              className="w-full"
              disabled={!canUseFreeDiagnosis && !hasActiveSubscription}
              variant={!canUseFreeDiagnosis && !hasActiveSubscription ? "outline" : "default"}
            >
              {!canUseFreeDiagnosis && !hasActiveSubscription && <Lock className="h-4 w-4 mr-2" />}
              Analizza con AI
            </Button>
            
            <p className="text-xs text-center">
              {hasActiveSubscription ? (
                <span className="text-blue-600">Illimitato con Premium</span>
              ) : canUseFreeDiagnosis ? (
                <span className="text-green-600">
                  {remainingFreeDiagnoses} diagnosi gratuite rimanenti
                </span>
              ) : (
                <span className="text-red-600">
                  Limite raggiunto - Richiede Premium
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        {/* Opzione Esperto - ORA PREMIUM */}
        <Card className={`relative transition-all hover:shadow-lg`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-drplant-green" />
                Chat con Fitopatologo
              </CardTitle>
              {!hasExpertChatAccess && (
                <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                  <Crown className="h-3 w-3 mr-1" />
                  Premium
                </Badge>
              )}
            </div>
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
              onClick={handleExpertSelection}
              className="w-full"
              variant={!hasExpertChatAccess ? "outline" : "default"}
            >
              {!hasExpertChatAccess && <Lock className="h-4 w-4 mr-2" />}
              {hasExpertChatAccess ? 'Chat con Esperto' : 'Richiede Premium'}
            </Button>
            
            {!hasExpertChatAccess && (
              <p className="text-xs text-amber-600 text-center">
                Disponibile per utenti Premium
              </p>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-4">
        <p className="text-sm text-gray-700 text-center">
          <strong>Raccomandazione:</strong> Inizia con l'analisi AI gratuita, poi passa alla consulenza premium 
          per una valutazione professionale completa.
        </p>
      </div>
      
      {/* Paywall modale per la chat esperto */}
      <PremiumPaywallModal
        open={paywallOpen}
        onClose={() => setPaywallOpen(false)}
      />
    </div>
  );
};

export default DiagnosisOptions;
