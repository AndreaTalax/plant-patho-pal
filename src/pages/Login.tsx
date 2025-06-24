
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Leaf, LockKeyhole, Mail } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

/**
 * Handles user login by validating credentials and navigating to the main page upon success.
 * @example
 * handleLogin(event)
 * - No explicit return value, handles UI actions.
 * @param {React.FormEvent} e - Event triggered by form submission.
 * @returns {void} Nothing is returned. Function manages authentication process and UI state internally.
 * @description
 *   - Provides user feedback using toast notifications based on the success or failure of the authentication.
 *   - Implements client-side form validation ensuring both email and password fields are filled.
 *   - Utilizes async/await for login process to handle asynchronous operations smoothly.
 *   - Navigation to the home page is delayed for 500 milliseconds after a successful login 
 *     to ensure the authentication state is properly updated.
 */
const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  // Lista degli account amministrativi per gestione speciale
  const adminEmails = [
    'agrotecnicomarconigro@gmail.com',
    'test@gmail.com',
    'premium@gmail.com'
  ];

  /**
  * Handles user login process by validating credentials and providing feedback.
  * @example
  * sync(formEvent)
  * Initiates login and navigates home on success.
  * @param {React.FormEvent} e - The form event that triggers the login process.
  * @returns {void} No return value, but navigates on successful login.
  * @description
  *   - Trims whitespaces from the email input before sending login request.
  *   - Uses toast notifications for both success and error feedback.
  *   - Logs success and error information to the console for debugging purposes.
  *   - Includes a delay before navigation to ensure authentication state is updated.
  */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    toast.dismiss();
    setIsLoading(true);

    if (!email || !password) {
      toast.error("Errore", {
        description: "Inserisci sia email che password",
        dismissible: true
      });
      setIsLoading(false);
      return;
    }

    try {
      console.log('Starting login process for:', email);
      
      // Per account amministrativi, ignora la password inserita
      const isAdminEmail = adminEmails.includes(email.trim().toLowerCase());
      
      if (isAdminEmail) {
        console.log('Account amministrativo rilevato:', email);
        toast.info("Login amministratore in corso...", {
          description: "Accesso con credenziali speciali",
          duration: 2000
        });
      }
      
      const result = await login(email.trim(), password);
      
      if (result.success) {
        console.log('Login successful');
        toast.success("Login effettuato con successo", {
          description: isAdminEmail ? "Benvenuto, Amministratore!" : "Benvenuto nell'applicazione!",
          dismissible: true
        });
        
        // Navigate after a short delay to ensure auth state is updated
        setTimeout(() => {
          navigate("/", { replace: true });
        }, 500);
      } else {
        toast.error("Login fallito", {
          description: isAdminEmail ? 
            "Problemi con l'account amministratore. Contattare il supporto tecnico." : 
            "Credenziali non valide. Riprova.",
          dismissible: true
        });
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error("Login fallito", {
        description: error.message || "Si è verificato un errore. Riprova.",
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
            <Leaf className="h-12 w-12 text-drplant-green" />
          </div>
          <h1 className="text-3xl font-bold text-drplant-blue-dark">Dr.Plant</h1>
          <p className="text-gray-600 mt-2">Accedi al tuo assistente per la cura delle piante</p>
        </div>

        <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl text-drplant-blue-dark text-center">Benvenuto</CardTitle>
            <CardDescription className="text-center">
              Inserisci le tue credenziali per continuare
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <Input 
                    id="email" 
                    placeholder="Inserisci la tua email" 
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
                <Label htmlFor="password" className="text-gray-700">Password</Label>
                <div className="relative">
                  <LockKeyhole className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="Inserisci la tua password" 
                    className="pl-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    disabled={isLoading}
                  />
                </div>
              </div>
              
              {/* Suggerimento per account amministrativi */}
              {adminEmails.includes(email.trim().toLowerCase()) && (
                <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                  💡 Account amministratore rilevato. Usa qualsiasi password.
                </div>
              )}
              
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-drplant-blue to-drplant-blue-dark hover:from-drplant-blue-dark hover:to-drplant-blue-dark transition-all duration-300"
                disabled={isLoading}
              >
                {isLoading ? "Accesso in corso..." : "Accedi"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-center w-full text-sm text-gray-500">
              Non hai un account? <Link to="/signup" className="text-drplant-blue font-medium hover:underline">Registrati</Link>
            </div>
          </CardFooter>
        </Card>

        <div className="mt-8 text-center text-gray-600 text-sm">
          <p>© 2025 Dr.Plant. Tutti i diritti riservati.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
