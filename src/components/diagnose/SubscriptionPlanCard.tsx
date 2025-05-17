
import { Button } from '@/components/ui/button';
import { Check, MessageCircle, Trophy } from 'lucide-react';

interface SubscriptionPlanCardProps {
  currentPlan: 'free' | 'premium';
  onUpgrade: () => void;
  onProceedWithAI: () => void;
  onConsultExpert: () => void;
}

const SubscriptionPlanCard: React.FC<SubscriptionPlanCardProps> = ({
  currentPlan,
  onUpgrade,
  onProceedWithAI,
  onConsultExpert
}) => {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Scegli il tipo di diagnosi</h3>
        
        {/* Free Plan */}
        <div className={`mb-4 p-4 rounded-lg border ${currentPlan === 'free' ? 'border-drplant-green bg-drplant-green/5' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <MessageCircle className="h-5 w-5 text-drplant-blue mr-2" />
              <h4 className="font-medium text-drplant-blue-dark">Consulenza con Fitopatologo</h4>
            </div>
            <span className="text-sm bg-blue-50 text-blue-700 px-2 py-1 rounded">Piano Base</span>
          </div>
          
          <ul className="space-y-1 mb-4 text-sm">
            <li className="flex items-start">
              <Check className="h-4 w-4 text-green-600 mr-1.5 mt-0.5" />
              <span>Diagnosi professionale da un esperto qualificato</span>
            </li>
            <li className="flex items-start">
              <Check className="h-4 w-4 text-green-600 mr-1.5 mt-0.5" />
              <span>Risposta entro 24-48 ore</span>
            </li>
            <li className="flex items-start">
              <Check className="h-4 w-4 text-green-600 mr-1.5 mt-0.5" />
              <span>Consigli personalizzati per il trattamento</span>
            </li>
          </ul>
          
          <Button 
            onClick={onConsultExpert}
            className="w-full bg-drplant-blue hover:bg-drplant-blue-dark"
          >
            Consulta Fitopatologo
          </Button>
        </div>
        
        {/* Premium Plan */}
        <div className={`p-4 rounded-lg border ${currentPlan === 'premium' ? 'border-drplant-green bg-drplant-green/5' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <Trophy className="h-5 w-5 text-amber-500 mr-2" />
              <h4 className="font-medium text-drplant-blue-dark">Diagnosi con Intelligenza Artificiale</h4>
            </div>
            <span className="text-sm bg-amber-50 text-amber-700 px-2 py-1 rounded">Premium</span>
          </div>
          
          <ul className="space-y-1 mb-4 text-sm">
            <li className="flex items-start">
              <Check className="h-4 w-4 text-green-600 mr-1.5 mt-0.5" />
              <span>Risultati istantanei</span>
            </li>
            <li className="flex items-start">
              <Check className="h-4 w-4 text-green-600 mr-1.5 mt-0.5" />
              <span>Analisi dell'immagine con AI avanzata</span>
            </li>
            <li className="flex items-start">
              <Check className="h-4 w-4 text-green-600 mr-1.5 mt-0.5" />
              <span>Consigli sui prodotti specifici</span>
            </li>
          </ul>
          
          <div className="bg-gray-50 p-3 rounded-md mb-3 text-sm">
            <p className="font-medium text-gray-700 mb-1">Accuratezza dell'AI:</p>
            <ul className="space-y-1">
              <li className="flex items-center justify-between">
                <span>Diagnosi preliminare:</span>
                <span className="font-medium">60-75%</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Diagnosi confermata:</span>
                <span className="font-medium">&lt;50%</span>
              </li>
            </ul>
          </div>
          
          {currentPlan === 'premium' ? (
            <Button 
              onClick={onProceedWithAI} 
              className="w-full bg-gradient-to-r from-drplant-green to-drplant-green-dark hover:from-drplant-green-dark hover:to-drplant-green-dark"
            >
              Procedi con Diagnosi AI
            </Button>
          ) : (
            <Button 
              onClick={onUpgrade} 
              variant="outline" 
              className="w-full border-amber-400 text-amber-700 hover:bg-amber-50"
            >
              Upgrade a Premium
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPlanCard;
