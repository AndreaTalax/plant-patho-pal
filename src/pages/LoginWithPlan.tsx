import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, LockKeyhole, Mail, Globe } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import ForgotPasswordModal from "@/components/auth/ForgotPasswordModal";
import PrivacyPolicyTrigger from "@/components/PrivacyPolicyTrigger";
import TermsOfServiceTrigger from "@/components/TermsOfServiceTrigger";
import PlanSubscriptionOptions from "@/components/subscription/PlanSubscriptionOptions";
import ProfessionalQuoteForm from "@/components/subscription/ProfessionalQuoteForm";

type PlanType = 'privati' | 'business' | 'professionisti';

const LoginWithPlan = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<'login' | 'subscription' | 'professional'>('login');
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { language, setLanguage, t } = useTheme();
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Ottiene il tipo di piano dall'URL o dal localStorage
  const planType = (location.state as any)?.planType || localStorage.getItem('selectedPlanType') as PlanType;

  useEffect(() => {
    if (!planType) {
      navigate('/plan-selection');
    }
  }, [planType, navigate]);

  const adminCredentials = {
    'agrotecnicomarconigro@gmail.com': 'marconigro93',
    'test@gmail.com': 'test123',
    'premium@gmail.com': 'premium123'
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    toast.dismiss();
    setIsLoading(true);

    if (!email || !password) {
      toast.error(t("error"), {
        description: t("enterCredentials"),
        dismissible: true
      });
      setIsLoading(false);
      return;
    }

    try {
      const emailLower = email.trim().toLowerCase();
      const isAdminEmail = Object.keys(adminCredentials).includes(emailLower);
      
      if (isAdminEmail) {
        toast.info(t("loginInProgress"), {
          description: "Accesso con credenziali speciali",
          duration: 2000
        });
      }
      
      const result = await login(email.trim(), password);
      
      if (result.success) {
        // Procedi in base al piano selezionato
        if (planType === 'professionisti') {
          setCurrentStep('professional');
        } else {
          setCurrentStep('subscription');
        }
        
        toast.success(t("loginSuccessful"), {
          description: isAdminEmail ? "Benvenuto, Amministratore!" : t("welcomeMessage"),
          dismissible: true
        });
      } else {
        toast.error(t("loginFailed"), {
          description: isAdminEmail ? 
            "Problemi con l'account amministratore. Verifica le credenziali." : 
            "Credenziali non valide. Riprova.",
          dismissible: true
        });
      }
    } catch (error: any) {
      toast.error(t("loginFailed"), {
        description: error.message || t("somethingWentWrong"),
        dismissible: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscriptionSelect = (option: string) => {
    // Salva l'opzione di sottoscrizione
    localStorage.setItem('selectedSubscriptionOption', option);
    toast.success("Abbonamento selezionato!");
    
    // Reindirizza alla home
    navigate("/", { replace: true });
  };

  const handleProfessionalQuote = (data: any) => {
    // Salva i dati del preventivo
    localStorage.setItem('professionalQuoteData', JSON.stringify(data));
    toast.success("Richiesta preventivo inviata!");
    
    // Reindirizza alla home (solo chat disponibile per professionisti)
    navigate("/", { replace: true });
  };

  const handleBackToPlanSelection = () => {
    localStorage.removeItem('selectedPlanType');
    navigate('/plan-selection');
  };

  const handleBackToLogin = () => {
    setCurrentStep('login');
  };

  const getPlanDisplayName = (plan: PlanType) => {
    switch (plan) {
      case 'privati': return language === 'it' ? 'Privati' : 'Private';
      case 'business': return 'Business';
      case 'professionisti': return language === 'it' ? 'Professionisti' : 'Professionals';
      default: return plan;
    }
  };

  if (currentStep === 'subscription' && planType !== 'professionisti') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-drplant-blue-light via-white to-drplant-green/10 flex flex-col items-center justify-center px-4 py-8">
        <div className="absolute top-0 left-0 w-full h-64 bg-drplant-blue-light/30 -z-10 rounded-b-[50%]" />
        <div className="absolute bottom-0 right-0 w-full h-64 bg-drplant-green/20 -z-10 rounded-t-[30%]" />
        
        <PlanSubscriptionOptions 
          planType={planType}
          onSubscriptionSelect={handleSubscriptionSelect}
          onBack={handleBackToLogin}
        />
      </div>
    );
  }

  if (currentStep === 'professional' && planType === 'professionisti') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-drplant-blue-light via-white to-drplant-green/10 flex flex-col items-center justify-center px-4 py-8">
        <div className="absolute top-0 left-0 w-full h-64 bg-drplant-blue-light/30 -z-10 rounded-b-[50%]" />
        <div className="absolute bottom-0 right-0 w-full h-64 bg-drplant-green/20 -z-10 rounded-t-[30%]" />
        
        <ProfessionalQuoteForm 
          onSubmit={handleProfessionalQuote}
          onBack={handleBackToLogin}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-drplant-blue-light via-white to-drplant-green/10 flex flex-col items-center justify-center px-4">
      <div className="absolute top-0 left-0 w-full h-64 bg-drplant-blue-light/30 -z-10 rounded-b-[50%]" />
      <div className="absolute bottom-0 right-0 w-full h-64 bg-drplant-green/20 -z-10 rounded-t-[30%]" />

      <div className="w-full max-w-md">
        {/* Back button */}
        <Button 
          variant="ghost" 
          onClick={handleBackToPlanSelection}
          className="mb-4 text-drplant-blue hover:text-drplant-blue-dark"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {language === 'it' ? 'Cambia Piano' : 'Change Plan'}
        </Button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-4 bg-white/80 backdrop-blur-sm rounded-full shadow-lg mb-4">
            <img 
              src="/lovable-uploads/72d5a60c-404a-4167-9430-511af91c523b.png" 
              alt="Dr.Plant Logo" 
              className="h-12 w-auto"
            />
          </div>
          <h1 className="text-3xl font-bold text-drplant-blue-dark">Dr.Plant</h1>
          <p className="text-gray-600 mt-2">{t("assistantMessage")}</p>
          <div className="mt-2 px-3 py-1 bg-drplant-green/20 rounded-full inline-block">
            <span className="text-sm font-medium text-drplant-green-dark">
              Piano: {getPlanDisplayName(planType)}
            </span>
          </div>
        </div>

        <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl text-drplant-blue-dark text-center">{t("welcome")}</CardTitle>
            <CardDescription className="text-center">
              {t("enterCredentials")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Language Selector */}
              <div className="space-y-2">
                <Label htmlFor="language" className="text-gray-700 flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  {t("language")}
                </Label>
                <Select value={language} onValueChange={(value: any) => setLanguage(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="it">{t("italian")}</SelectItem>
                    <SelectItem value="en">{t("english")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700">{t("email")}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <Input 
                    id="email" 
                    placeholder={t("enterEmail")} 
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    autoComplete="email"
                    disabled={isLoading}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700">{t("password")}</Label>
                <div className="relative">
                  <LockKeyhole className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder={t("enterPassword")} 
                    className="pl-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    disabled={isLoading}
                  />
                </div>
              </div>
              
              {adminCredentials[email.trim().toLowerCase() as keyof typeof adminCredentials] && (
                <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded border border-blue-200">
                  <div className="font-medium">💡 {t("adminAccountDetected")}</div>
                  <div className="mt-1">
                    Password: <code className="bg-blue-100 px-1 rounded font-mono">
                      {adminCredentials[email.trim().toLowerCase() as keyof typeof adminCredentials]}
                    </code>
                  </div>
                </div>
              )}
              
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-drplant-blue to-drplant-blue-dark hover:from-drplant-blue-dark hover:to-drplant-blue-dark transition-all duration-300"
                disabled={isLoading}
              >
                {isLoading ? t("loginInProgress") : t("login")}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-center w-full">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-drplant-blue hover:underline font-medium"
              >
                {t("forgotPassword")}
              </button>
            </div>
            <div className="text-center w-full text-sm text-gray-500">
              {t("noAccount")} <Link to="/signup" className="text-drplant-blue font-medium hover:underline">{t("signup")}</Link>
            </div>
          </CardFooter>
        </Card>

        <div className="mt-8 text-center text-gray-600 text-sm space-y-2">
          <div className="flex justify-center space-x-4 mb-2">
            <PrivacyPolicyTrigger />
            <span className="text-gray-400">|</span>
            <TermsOfServiceTrigger />
          </div>
          <p>© 2025 Dr.Plant. {t("allRightsReserved")}</p>
        </div>
      </div>

      <ForgotPasswordModal 
        open={showForgotPassword} 
        onOpenChange={setShowForgotPassword} 
      />
    </div>
  );
};

export default LoginWithPlan;