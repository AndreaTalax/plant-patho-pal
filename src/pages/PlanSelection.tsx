import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Crown, Building, Users } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

export type PlanType = 'privati' | 'business' | 'professionisti';

const PlanSelection = () => {
  const navigate = useNavigate();
  const { t, language } = useTheme();
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);

  const handlePlanSelection = (planType: PlanType) => {
    setSelectedPlan(planType);
    // Salva la selezione del piano nel localStorage
    localStorage.setItem('selectedPlanType', planType);
    // Naviga alla pagina di login con il piano selezionato
    navigate('/login', { state: { planType } });
  };

  const plans = [
    {
      id: 'privati' as PlanType,
      title: language === 'it' ? 'Privati' : 'Private',
      subtitle: language === 'it' ? 'Per uso personale' : 'For personal use',
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      features: [
        language === 'it' ? 'Diagnosi AI avanzata' : 'Advanced AI Diagnosis',
        language === 'it' ? 'Chat diretta con fitopatologo' : 'Direct chat with plant pathologist',
        language === 'it' ? 'Abbonamento a gettone' : 'Token-based subscription',
        language === 'it' ? 'Supporto personalizzato' : 'Personal support'
      ],
      description: language === 'it' ? 'Perfetto per appassionati e coltivatori amatoriali' : 'Perfect for enthusiasts and amateur growers'
    },
    {
      id: 'business' as PlanType,
      title: 'Business',
      subtitle: language === 'it' ? 'Per aziende e professionisti' : 'For companies and professionals',
      icon: Building,
      color: 'from-green-500 to-green-600',
      features: [
        language === 'it' ? 'Tutte le funzionalità Privati' : 'All Private features',
        language === 'it' ? 'Piani flessibili (giornaliero, settimanale, mensile, annuale)' : 'Flexible plans (daily, weekly, monthly, yearly)',
        language === 'it' ? 'Priorità nelle consultazioni' : 'Priority in consultations',
        language === 'it' ? 'Reportistica avanzata' : 'Advanced reporting'
      ],
      description: language === 'it' ? 'Ideale per vivai, aziende agricole e consulenti' : 'Ideal for nurseries, farms and consultants'
    },
    {
      id: 'professionisti' as PlanType,
      title: language === 'it' ? 'Professionisti' : 'Professionals',
      subtitle: language === 'it' ? 'Soluzione su misura' : 'Tailored solution',
      icon: Crown,
      color: 'from-purple-500 to-purple-600',
      features: [
        language === 'it' ? 'Offerta personalizzata' : 'Customized offer',
        language === 'it' ? 'Chat diretta con fitopatologo dedicato' : 'Direct chat with dedicated plant pathologist',
        language === 'it' ? 'Assistenza prioritaria 24/7' : '24/7 priority support',
        language === 'it' ? 'Integrazioni custom' : 'Custom integrations'
      ],
      description: language === 'it' ? 'Per grandi aziende e istituzioni specializzate' : 'For large companies and specialized institutions'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-drplant-blue-light via-white to-drplant-green/10 flex flex-col items-center justify-center px-4 py-8">
      <div className="absolute top-0 left-0 w-full h-64 bg-drplant-blue-light/30 -z-10 rounded-b-[50%]" />
      <div className="absolute bottom-0 right-0 w-full h-64 bg-drplant-green/20 -z-10 rounded-t-[30%]" />

      <div className="w-full max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-4 bg-white/80 backdrop-blur-sm rounded-full shadow-lg mb-6">
            <img 
              src="/lovable-uploads/72d5a60c-404a-4167-9430-511af91c523b.png" 
              alt="Dr.Plant Logo" 
              className="h-16 w-auto"
            />
          </div>
          <h1 className="text-4xl font-bold text-drplant-blue-dark mb-4">
            {language === 'it' ? 'Scegli il tuo piano Dr.Plant' : 'Choose your Dr.Plant plan'}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {language === 'it' 
              ? 'Seleziona la soluzione più adatta alle tue esigenze per la cura e diagnosi delle tue piante'
              : 'Select the solution that best fits your needs for plant care and diagnosis'
            }
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isPopular = plan.id === 'business';
            
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
                      {language === 'it' ? 'Più popolare' : 'Most Popular'}
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <div className={`inline-flex items-center justify-center p-4 rounded-full bg-gradient-to-r ${plan.color} text-white mb-4 mx-auto`}>
                    <Icon className="h-8 w-8" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-drplant-blue-dark">
                    {plan.title}
                  </CardTitle>
                  <CardDescription className="text-lg">
                    {plan.subtitle}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-0">
                  <p className="text-center text-gray-600 mb-6">
                    {plan.description}
                  </p>
                  
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-3">
                        <Check className="h-5 w-5 text-drplant-green flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Button 
                    className={`w-full transition-all duration-300 ${
                      selectedPlan === plan.id
                        ? 'bg-gradient-to-r from-drplant-green to-drplant-green-dark text-white'
                        : 'bg-gradient-to-r from-drplant-blue to-drplant-blue-dark hover:from-drplant-green hover:to-drplant-green-dark'
                    }`}
                  >
                    {language === 'it' ? 'Seleziona' : 'Select'}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* Footer Info */}
        <div className="text-center">
          <p className="text-gray-500 text-sm">
            {language === 'it' 
              ? 'Potrai cambiare piano in qualsiasi momento dalle impostazioni del tuo profilo'
              : 'You can change your plan anytime from your profile settings'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default PlanSelection;