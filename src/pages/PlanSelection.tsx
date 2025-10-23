import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Crown, Building, Users, Leaf } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { MARCO_NIGRO_ID } from "@/components/phytopathologist";

export type PlanType = 'privati' | 'business' | 'professionisti' | 'tutti';

const PlanSelection = () => {
  const navigate = useNavigate();
  const { t } = useTheme();
  const { isAuthenticated, user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);

  // Check if user is admin and redirect to dashboard
  useEffect(() => {
    if (isAuthenticated && user?.id === MARCO_NIGRO_ID) {
      console.log('👨‍💼 Account amministratore rilevato nella selezione piani, reindirizzamento alla dashboard...');
      navigate('/', { replace: true });
      return;
    }
  }, [isAuthenticated, user, navigate]);

  const handlePlanSelection = (planType: PlanType) => {
    setSelectedPlan(planType);
    
    // Se è il piano "tutti", vai direttamente alla pagina di identificazione piante
    if (planType === 'tutti') {
      navigate('/plant-identification');
      return;
    }
    
    // Salva la selezione del piano nel localStorage
    localStorage.setItem('selectedPlanType', planType);
    
    // Se l'utente è già autenticato, vai direttamente alla selezione sottoscrizione
    if (isAuthenticated) {
      navigate('/plan-subscription');
    } else {
      // Se non è autenticato, vai al login con il piano selezionato
      navigate('/login', { state: { planType } });
    }
  };

  const handlePlantIdentificationSelect = () => {
    navigate('/plant-identification');
  };

  const plans = [
    {
      id: 'tutti' as PlanType,
      title: 'Per tutti',
      subtitle: 'Identificazione piante',
      icon: Leaf,
      color: 'from-green-500 to-green-600',
      features: [
        '3 identificazioni gratuite',
        'Tecnologia Plant.ID avanzata',
        'Identificazione istantanea',
        'Accesso immediato'
      ],
      description: 'Identifica qualsiasi pianta tramite foto o fotocamera',
      isPopular: true
    },
    {
      id: 'privati' as PlanType,
      title: t('privateUsers'),
      subtitle: t('personalUse'),
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      features: [
        t('advancedAIDiagnosis'),
        t('directChatWithPathologist'),
        t('tokenBasedSubscription'),
        t('personalSupport')
      ],
      description: t('perfectForEnthusiasts')
    },
    {
      id: 'business' as PlanType,
      title: t('business'),
      subtitle: t('forCompaniesAndProfessionals'),
      icon: Building,
      color: 'from-orange-500 to-orange-600',
      features: [
        t('allPrivateFeatures'),
        t('flexiblePlans'),
        t('priorityConsultations'),
        t('advancedReporting')
      ],
      description: t('idealForNurseriesFarms')
    },
    {
      id: 'professionisti' as PlanType,
      title: t('professionals'),
      subtitle: t('tailoredSolution'),
      icon: Crown,
      color: 'from-purple-500 to-purple-600',
      features: [
        t('customizedOffer'),
        t('dedicatedPathologist'),
        t('prioritySupport247'),
        t('customIntegrations')
      ],
      description: t('forLargeCompanies')
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-drplant-blue-light via-white to-drplant-green/10 flex flex-col items-center justify-center px-4 py-8">
      <div className="absolute top-0 left-0 w-full h-64 bg-drplant-blue-light/30 -z-10 rounded-b-[50%]" />
      <div className="absolute bottom-0 right-0 w-full h-64 bg-drplant-green/20 -z-10 rounded-t-[30%]" />

      <div className="w-full max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center mb-6">
            <img 
              src="/lovable-uploads/72d5a60c-404a-4167-9430-511af91c523b.png" 
              alt="Dr.Plant Logo" 
              className="h-20 w-auto drop-shadow-lg"
            />
          </div>
          <h1 className="text-4xl font-bold text-drplant-blue-dark mb-4">
            {t('choosePlan')}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t('planSelectionDescription')}
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isPopular = plan.isPopular;
            
            return (
              <Card 
                key={plan.id}
                className={`relative border-2 transition-all duration-300 hover:shadow-xl cursor-pointer bg-white/80 backdrop-blur-sm ${
                  selectedPlan === plan.id 
                    ? 'border-drplant-green shadow-lg scale-105' 
                    : 'border-gray-200 hover:border-drplant-green/50'
                }`}
                onClick={() => handlePlanSelection(plan.id)}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-drplant-green to-drplant-green-dark text-white px-4 py-1 flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      Consigliato
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <div className={`inline-flex items-center justify-center p-4 rounded-full bg-gradient-to-r ${plan.color} text-white mb-4 mx-auto`}>
                    <Icon className="h-8 w-8" />
                  </div>
                  <CardTitle className="text-xl font-bold text-drplant-blue-dark">
                    {plan.title}
                  </CardTitle>
                  <CardDescription className="text-base">
                    {plan.subtitle}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-0">
                  <p className="text-center text-gray-600 mb-4 text-sm">
                    {plan.description}
                  </p>
                  
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-drplant-green flex-shrink-0" />
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Button 
                    className={`w-full transition-all duration-300 text-sm ${
                      selectedPlan === plan.id
                        ? 'bg-gradient-to-r from-drplant-green to-drplant-green-dark text-white'
                        : plan.id === 'tutti'
                          ? 'bg-gradient-to-r from-drplant-green to-drplant-green-dark hover:from-drplant-green-dark hover:to-drplant-green'
                          : 'bg-gradient-to-r from-drplant-blue to-drplant-blue-dark hover:from-drplant-green hover:to-drplant-green-dark'
                    }`}
                  >
                    {plan.id === 'tutti' ? 'Prova Gratis' : t('select')}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* Footer Info */}
        <div className="text-center">
          <p className="text-gray-500 text-sm">
            {t('changePlanAnytime')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PlanSelection;