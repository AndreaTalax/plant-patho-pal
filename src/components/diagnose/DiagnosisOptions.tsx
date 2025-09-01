
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, MessageCircle, Zap, Users, Crown, Lock, TestTube } from 'lucide-react';
import { usePremiumStatus } from '@/services/premiumService';
import { useAuth } from '@/context/AuthContext';
import AIAccuracyStats from './AIAccuracyStats';
import { PremiumPaywallModal } from "./PremiumPaywallModal";

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
  const { 
    hasExpertChatAccess, 
    hasUnlimitedDiagnosis, 
    isTestAdmin, 
    upgradeMessage,
    freeLimitMessage,
    canUseAIDiagnosis
  } = usePremiumStatus();
  const { userProfile } = useAuth();
  const [paywallOpen, setPaywallOpen] = useState(false);

  const isTestUser = userProfile?.email === 'test@gmail.com';
  const hasUsedAllFreeDiagnoses = remainingFreeDiagnoses === 0;
  
  // Logica per diagnosi AI: premium sempre ok, utenti normali solo se hanno diagnosi rimanenti
  const canUseDiagnosis = hasUnlimitedDiagnosis || (canUseFreeDiagnosis && !hasUsedAllFreeDiagnoses) || hasActiveSubscription;

  const handleAISelection = () => {
    if (!canUseDiagnosis && !isTestUser) {
      setPaywallOpen(true);
      return;
    }
    onSelectAI();
  };

  const handleExpertSelection = () => {
    if (!hasExpertChatAccess && !isTestUser) {
      setPaywallOpen(true);
      return;
    }
    onSelectExpert();
  };

  return (
    <div className="space-y-6">
      <AIAccuracyStats />
      
      {isTestUser && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-blue-800">
            <TestTube className="h-4 w-4" />
            <span className="font-medium">Account di Test</span>
          </div>
          <p className="text-blue-700 text-sm mt-1">
            Hai accesso completo a tutte le funzionalità per il testing
          </p>
        </div>
      )}
      
      <div className="grid md:grid-cols-2 gap-4">
        {/* Opzione Diagnosi AI */}
        <Card className="transition-all hover:shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Brain className="h-5 w-5 text-drplant-blue" />
                Diagnosi AI
              </CardTitle>
              {isTestUser ? (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  <TestTube className="h-3 w-3 mr-1" />
                  Test
                </Badge>
              ) : hasActiveSubscription || hasUnlimitedDiagnosis ? (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  Premium
                </Badge>
              ) : (
                <Badge variant="secondary" className={`${canUseFreeDiagnosis && !hasUsedAllFreeDiagnoses ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {canUseFreeDiagnosis && !hasUsedAllFreeDiagnoses ? `${remainingFreeDiagnoses}/3 Gratis` : 'Limite Raggiunto'}
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
                <span>Possibilità di consultare l'esperto</span>
              </div>
            </div>
            
            <Button 
              onClick={handleAISelection}
              className="w-full"
              disabled={!canUseDiagnosis && !isTestUser}
              variant={(!canUseDiagnosis && !isTestUser) ? "outline" : "default"}
            >
              {(!canUseDiagnosis && !isTestUser) && <Lock className="h-4 w-4 mr-2" />}
              Analizza con AI
            </Button>
            
            <p className="text-xs text-center">
              {isTestUser ? (
                <span className="text-blue-600">Accesso illimitato per test</span>
              ) : hasActiveSubscription || hasUnlimitedDiagnosis ? (
                <span className="text-blue-600">Illimitato con Premium</span>
              ) : canUseFreeDiagnosis && !hasUsedAllFreeDiagnoses ? (
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

        {/* Opzione Chat con Esperto */}
        <Card className="relative transition-all hover:shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-drplant-green" />
                Chat con Fitopatologo
              </CardTitle>
              {isTestUser ? (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  <TestTube className="h-3 w-3 mr-1" />
                  Test
                </Badge>
              ) : (
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
              variant={(!hasExpertChatAccess && !isTestUser) ? "outline" : "default"}
            >
              {(!hasExpertChatAccess && !isTestUser) && <Lock className="h-4 w-4 mr-2" />}
              {hasExpertChatAccess || isTestUser ? 'Chat con Esperto' : 'Richiede Premium'}
            </Button>
            
            <p className="text-xs text-center">
              {isTestUser ? (
                <span className="text-blue-600">Accesso completo per test</span>
              ) : !hasExpertChatAccess ? (
                <span className="text-amber-600">Disponibile per utenti Premium</span>
              ) : (
                <span className="text-green-600">Accesso Premium attivo</span>
              )}
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-4">
        <p className="text-sm text-gray-700 text-center">
          <strong>Nota:</strong> Gli utenti normali hanno 3 diagnosi AI gratuite. 
          La chat con l'esperto richiede sempre l'abbonamento Premium.
        </p>
      </div>
      
      {/* Paywall modal */}
      <PremiumPaywallModal
        open={paywallOpen}
        onClose={() => setPaywallOpen(false)}
      />
    </div>
  );
};

export default DiagnosisOptions;
