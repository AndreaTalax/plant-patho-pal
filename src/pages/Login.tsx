
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Leaf, LockKeyhole, User, Mail } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("test@test.com");
  const [password, setPassword] = useState("test123");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simple validation
    if (!email || !password) {
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Inserisci sia email che password",
      });
      setIsLoading(false);
      return;
    }

    try {
      await login(email, password);
      toast({
        title: "Login effettuato con successo",
        description: "Bentornato su Plant Patho Pal!",
      });
      navigate("/");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Login fallito",
        description: "Credenziali non valide. Prova con uno degli account di test.",
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
          <h1 className="text-3xl font-bold text-drplant-blue-dark">Plant Patho Pal</h1>
          <p className="text-gray-600 mt-2">Accedi al tuo sistema di assistenza per piante</p>
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
                    placeholder="Inserisci email" 
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
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
                    placeholder="Inserisci password" 
                    className="pl-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
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
            <div className="text-center text-sm text-gray-500 space-y-2">
              <p className="font-medium">Credenziali demo:</p>
              <p><span className="font-medium">Account utente:</span> Email: test@test.com, Password: test123</p>
              <p><span className="font-medium">Account master:</span> Email: agrotecnicomarconigro@gmail.com, Password: marconigro93</p>
            </div>
          </CardFooter>
        </Card>

        <div className="mt-8 text-center text-gray-600 text-sm">
          <p>© 2025 Plant Patho Pal. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
