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
  const [currentStep, setCurrentStep] = useState<'selection' | 'subscription' | 'professional'>('subscription');

  // Load selected plan from localStorage and set appropriate step
  useEffect(() => {
    const savedPlan = localStorage.getItem('selectedPlanType') as PlanType;
    const searchParams = new URLSearchParams(window.location.search);
    
    if (searchParams.get('direct') === 'professional') {
      setSelectedPlan('professionisti');
      setCurrentStep('professional');
    } else if (savedPlan && ['privati', 'business', 'professionisti'].includes(savedPlan)) {
      setSelectedPlan(savedPlan);
      if (savedPlan === 'professionisti') {
        setCurrentStep('professional');
      } else {
        setCurrentStep('subscription');
      }
    } else {
      // Se non c'è un piano salvato, torna alla selezione piani
      navigate('/plan-selection');
    }
  }, [navigate]);

  // Redirect to login if not authenticated (after hooks)
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
  }, [isAuthenticated, navigate]);

  // Show loading state if not authenticated instead of early return
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-drplant-blue-light via-white to-drplant-green/10 flex flex-col items-center justify-center px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-drplant-green mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
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
    // Torna alla pagina di selezione piani principale
    navigate('/plan-selection');
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

  // Loading state while determining which view to show
  return (
    <div className="min-h-screen bg-gradient-to-br from-drplant-blue-light via-white to-drplant-green/10 flex flex-col items-center justify-center px-4 py-8">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-drplant-green mx-auto mb-4"></div>
        <p className="text-gray-600">{language === 'it' ? 'Caricamento...' : 'Loading...'}</p>
      </div>
    </div>
  );
};

export default PlanSubscriptionSelection;