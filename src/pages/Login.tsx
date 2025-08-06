
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { LockKeyhole, Mail, Globe } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import ForgotPasswordModal from "@/components/auth/ForgotPasswordModal";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const { language, setLanguage, t } = useTheme();
  const [showForgotPassword, setShowForgotPassword] = useState(false);

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
        toast.success(t("loginSuccessful"), {
          description: isAdminEmail ? "Benvenuto, Amministratore!" : t("welcomeMessage"),
          dismissible: true
        });
        
        setTimeout(() => {
          navigate("/", { replace: true });
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
    <div className="h-screen w-full bg-gradient-to-b from-drplant-blue-light via-white to-drplant-green/10 flex flex-col items-center justify-center px-4">
      <div className="absolute top-0 left-0 w-full h-64 bg-drplant-blue-light/30 -z-10 rounded-b-[50%]" />
      <div className="absolute bottom-0 right-0 w-full h-64 bg-drplant-green/20 -z-10 rounded-t-[30%]" />


      <div className="w-full max-w-md">
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

        <div className="mt-8 text-center text-gray-600 text-sm">
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
