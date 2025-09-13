import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import PlanSubscriptionOptions from "@/components/subscription/PlanSubscriptionOptions";
import ProfessionalQuoteForm from "@/components/subscription/ProfessionalQuoteForm";
import { useTheme } from "@/context/ThemeContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export type PlanType = 'privati' | 'business' | 'professionisti';

const PlanSubscriptionSelection = () => {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();
  const { language } = useTheme();
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('privati');
  const [currentStep, setCurrentStep] = useState<'selection' | 'subscription' | 'professional'>('selection');

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  const handlePlanSelection = (planType: PlanType) => {
    setSelectedPlan(planType);
    localStorage.setItem('selectedPlanType', planType);
    
    if (planType === 'professionisti') {
      setCurrentStep('professional');
    } else {
      setCurrentStep('subscription');
    }
  };

  // Auto-select professional plan if navigating directly from chat
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('direct') === 'professional') {
      setSelectedPlan('professionisti');
      setCurrentStep('professional');
    }
  }, []);

  const handleSubscriptionSelect = (option: string) => {
    localStorage.setItem('selectedSubscriptionOption', option);
    toast.success(language === 'it' ? 'Abbonamento selezionato!' : 'Subscription selected!');
    navigate("/", { replace: true });
  };

  const handleProfessionalQuote = (data: any) => {
    localStorage.setItem('professionalQuoteData', JSON.stringify(data));
    toast.success(language === 'it' ? 'Richiesta preventivo inviata!' : 'Quote request sent!');
    navigate("/", { replace: true });
  };

  const handleBackToSelection = () => {
    setCurrentStep('selection');
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success(language === 'it' ? 'Logout effettuato con successo' : 'Logged out successfully');
    } catch (error) {
      toast.error(language === 'it' ? 'Errore durante il logout' : 'Error during logout');
    }
  };

  if (currentStep === 'subscription' && selectedPlan !== 'professionisti') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-drplant-blue-light via-white to-drplant-green/10 flex flex-col items-center justify-center px-4 py-8">
        <div className="absolute top-0 left-0 w-full h-64 bg-drplant-blue-light/30 -z-10 rounded-b-[50%]" />
        <div className="absolute bottom-0 right-0 w-full h-64 bg-drplant-green/20 -z-10 rounded-t-[30%]" />
        
        <PlanSubscriptionOptions 
          planType={selectedPlan}
          onSubscriptionSelect={handleSubscriptionSelect}
          onBack={handleBackToSelection}
        />
      </div>
    );
  }

  if (currentStep === 'professional' && selectedPlan === 'professionisti') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-drplant-blue-light via-white to-drplant-green/10 flex flex-col items-center justify-center px-4 py-8">
        <div className="absolute top-0 left-0 w-full h-64 bg-drplant-blue-light/30 -z-10 rounded-b-[50%]" />
        <div className="absolute bottom-0 right-0 w-full h-64 bg-drplant-green/20 -z-10 rounded-t-[30%]" />
        
        <div className="w-full max-w-4xl">
          {/* Logout Button */}
          <div className="absolute top-4 right-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border-gray-300 hover:bg-white hover:border-drplant-green text-gray-700 hover:text-drplant-blue-dark"
            >
              <LogOut className="h-4 w-4" />
              {language === 'it' ? 'Esci' : 'Logout'}
            </Button>
          </div>
          
          <ProfessionalQuoteForm 
            onSubmit={handleProfessionalQuote}
            onBack={handleBackToSelection}
          />
        </div>
      </div>
    );
  }

  // Plan selection view (using existing PlanSelection component logic)
  const plans = [
    {
      id: 'privati' as PlanType,
      title: language === 'it' ? 'Privati' : 'Private',
      subtitle: language === 'it' ? 'Per uso personale' : 'For personal use',
      description: language === 'it' ? 'Perfetto per appassionati e coltivatori amatoriali' : 'Perfect for enthusiasts and amateur growers'
    },
    {
      id: 'business' as PlanType,
      title: 'Business',
      subtitle: language === 'it' ? 'Per aziende e professionisti' : 'For companies and professionals',
      description: language === 'it' ? 'Ideale per vivai, aziende agricole e consulenti' : 'Ideal for nurseries, farms and consultants'
    },
    {
      id: 'professionisti' as PlanType,
      title: language === 'it' ? 'Professionisti' : 'Professionals',
      subtitle: language === 'it' ? 'Soluzione su misura' : 'Tailored solution',
      description: language === 'it' ? 'Per grandi aziende e istituzioni specializzate' : 'For large companies and specialized institutions'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-drplant-blue-light via-white to-drplant-green/10 flex flex-col items-center justify-center px-4 py-8">
      <div className="absolute top-0 left-0 w-full h-64 bg-drplant-blue-light/30 -z-10 rounded-b-[50%]" />
      <div className="absolute bottom-0 right-0 w-full h-64 bg-drplant-green/20 -z-10 rounded-t-[30%]" />

      <div className="w-full max-w-6xl">
        {/* Logout Button */}
        <div className="absolute top-4 right-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border-gray-300 hover:bg-white hover:border-drplant-green text-gray-700 hover:text-drplant-blue-dark"
          >
            <LogOut className="h-4 w-4" />
            {language === 'it' ? 'Esci' : 'Logout'}
          </Button>
        </div>

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

        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              onClick={() => handlePlanSelection(plan.id)}
              className="cursor-pointer transform transition-all duration-300 hover:scale-105"
            >
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-200 hover:border-drplant-green/50 h-full">
                <h3 className="text-2xl font-bold text-drplant-blue-dark mb-2">{plan.title}</h3>
                <p className="text-lg text-gray-600 mb-4">{plan.subtitle}</p>
                <p className="text-gray-700">{plan.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PlanSubscriptionSelection;