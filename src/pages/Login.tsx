import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { LockKeyhole, Mail, Globe, Fingerprint } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import ForgotPasswordModal from "@/components/auth/ForgotPasswordModal";
import PrivacyPolicyTrigger from "@/components/PrivacyPolicyTrigger";
import TermsOfServiceTrigger from "@/components/TermsOfServiceTrigger";
import CookiePolicyTrigger from "@/components/CookiePolicyTrigger";
import { BiometricAuthService } from "@/services/biometricAuthService";
import { supabase } from "@/integrations/supabase/client";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { language, setLanguage, t } = useTheme();
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Controlla la disponibilità della biometria
  useEffect(() => {
    const checkBiometric = async () => {
      const available = await BiometricAuthService.isAvailable();
      const enabled = await BiometricAuthService.isEnabled();
      setBiometricAvailable(available);
      setBiometricEnabled(enabled);
    };
    checkBiometric();
  }, []);

  const adminCredentials = {
    'agrotecnicomarconigro@gmail.com': 'marconigro93',
    'test@gmail.com': 'test123',
    'premium@gmail.com': 'premium123'
  };

  const isAdminEmail = (email: string) => {
    return Object.keys(adminCredentials).includes(email.toLowerCase());
  };

  const handleBiometricLogin = async () => {
    try {
      setIsLoading(true);
      const credentials = await BiometricAuthService.authenticate();
      
      if (credentials) {
        setEmail(credentials.email);
        setPassword(credentials.password);
        
        // Procedi con il login
        const result = await login(credentials.email, credentials.password);
        
        if (result.success) {
          toast.success(t("loginSuccessful"), {
            description: "Accesso con impronta digitale completato",
            dismissible: true
          });
          
          setTimeout(() => {
            navigate("/", { replace: true });
          }, 500);
        }
      }
    } catch (error) {
      console.error('Biometric login error:', error);
      toast.error("Errore", {
        description: "Autenticazione biometrica fallita",
        dismissible: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        }
      });
      
      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error('Google login error:', error);
      toast.error("Errore", {
        description: "Impossibile accedere con Google. Riprova.",
        dismissible: true
      });
      setIsLoading(false);
    }
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
      console.log('Starting login process for:', email);
      
      const emailLower = email.trim().toLowerCase();
      const isAdminEmail = Object.keys(adminCredentials).includes(emailLower);
      
      if (isAdminEmail) {
        console.log('Account amministrativo rilevato:', email);
        toast.info(t("loginInProgress"), {
          description: "Accesso con credenziali speciali",
          duration: 2000
        });
      }
      
      const result = await login(email.trim(), password);
      
      if (result.success) {
        console.log('Login successful');
        
        // Proponi di abilitare la biometria se disponibile e non ancora abilitata
        if (biometricAvailable && !biometricEnabled) {
          toast.info("Abilita l'impronta digitale", {
            description: "Vuoi abilitare l'accesso rapido con impronta? Vai nelle impostazioni.",
            duration: 5000,
            dismissible: true
          });
        }
        
        toast.success(t("loginSuccessful"), {
          description: isAdminEmail ? "Benvenuto, Amministratore!" : t("welcomeMessage"),
          dismissible: true
        });
        
        setTimeout(() => {
          const planTypeFromState = location.state?.planType;
          const planTypeFromStorage = localStorage.getItem('selectedPlanType');
          const selectedPlanType = planTypeFromState || planTypeFromStorage;
          const isTestAccount = emailLower === 'test@gmail.com';
          
          let redirectPath = "/";
          
          if (isTestAccount) {
            redirectPath = "/plan-selection";
          } else if (selectedPlanType && ['privati', 'business', 'professionisti'].includes(selectedPlanType)) {
            redirectPath = "/plan-subscription";
          } else if (isAdminEmail) {
            redirectPath = "/";
          } else {
            redirectPath = "/plan-selection";
          }
          
          navigate(redirectPath, { replace: true });
        }, 500);
      } else {
        toast.error(t("loginFailed"), {
          description: isAdminEmail ? 
            "Problemi con l'account amministratore. Verifica le credenziali." : 
            "Credenziali non valide. Riprova.",
          dismissible: true
        });
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(t("loginFailed"), {
        description: error.message || t("somethingWentWrong"),
        dismissible: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-b from-drplant-blue-light via-white to-drplant-green/10 flex flex-col items-center justify-center px-4 py-8">
      {/* Elementi decorativi di sfondo */}
      <div className="absolute top-0 left-0 w-full h-64 bg-drplant-blue-light/30 -z-10 rounded-b-[50%]" />
      <div className="absolute bottom-0 right-0 w-full h-64 bg-drplant-green/20 -z-10 rounded-t-[30%]" />

      {/* Contenitore principale con z-index positivo */}
      <div className="relative z-10 w-full max-w-md">
        {/* Card di login con logo integrato */}
        <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            {/* Logo + Titolo integrati */}
            <div className="flex flex-col items-center gap-4 mb-2">
              <div className="flex items-center gap-3">
                <img 
                  src="/lovable-uploads/72d5a60c-404a-4167-9430-511af91c523b.png" 
                  alt="Dr.Plant Logo" 
                  className="h-16 w-auto"
                />
                <div className="text-left">
                  <h1 className="text-3xl font-bold text-drplant-blue-dark">Dr.Plant</h1>
                  <p className="text-sm text-gray-600">{t("assistantMessage")}</p>
                </div>
              </div>
            </div>
            
            <CardTitle className="text-2xl text-drplant-blue-dark mt-4">{t("welcome")}</CardTitle>
            <CardDescription>
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

              {/* Google Login */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-muted-foreground">
                    oppure
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGoogleLogin}
                disabled={isLoading}
              >
                <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                  <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                </svg>
                Continua con Google
              </Button>

              {/* Biometric Login */}
              {biometricAvailable && biometricEnabled && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full mt-2"
                  onClick={handleBiometricLogin}
                  disabled={isLoading}
                >
                  <Fingerprint className="mr-2 h-4 w-4" />
                  Accedi con impronta digitale
                </Button>
              )}
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

        {/* Footer */}
        <div className="mt-6 text-center text-gray-600 text-sm space-y-2">
          <div className="flex justify-center flex-wrap gap-2 items-center mb-2">
            <PrivacyPolicyTrigger />
            <span className="text-gray-400">|</span>
            <CookiePolicyTrigger />
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

export default Login;
