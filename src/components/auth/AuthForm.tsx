
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signUp, signIn } from '@/integrations/supabase/supabaseClient';
import { toast } from 'sonner';
import { Mail, LockKeyhole } from "lucide-react";

type AuthMode = 'login' | 'signup';

export function AuthForm() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const toggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setEmailSent(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (mode === 'signup') {
        await signUp(email, password);
        setEmailSent(true);
        toast.success('Registrazione completata', {
          description: "Ti abbiamo inviato un'email di conferma. Se non la vedi nella casella principale, controlla nella cartella spam.",
        });
      } else {
        await signIn(email, password);
        toast.success('Login effettuato con successo', {
          description: "Benvenuto nel tuo account!",
        });
      }
    } catch (error: any) {
      let message = "Si è verificato un errore";
      
      if (error.message?.includes('already registered')) {
        message = "Email già registrata. Prova ad effettuare il login.";
      } else if (error.message?.includes('Invalid login')) {
        message = "Credenziali non valide. Controlla email e password.";
      } else if (error.message?.includes('weak password')) {
        message = "La password deve contenere almeno 6 caratteri.";
      }
      
      toast.error(mode === 'signup' ? 'Errore di registrazione' : 'Errore di login', {
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      {emailSent ? (
        <div className="p-6 text-center">
          <div className="flex justify-center mb-4">
            <Mail className="h-16 w-16 text-drplant-green" />
          </div>
          <CardTitle className="mb-2">Controlla la tua email</CardTitle>
          <CardDescription className="mb-6">
            Abbiamo inviato un'email di conferma a <span className="font-medium">{email}</span>.<br />
            Clicca sul link nell'email per completare la registrazione.
          </CardDescription>
          <Button variant="outline" className="mt-4" onClick={toggleMode}>
            Torna al login
          </Button>
        </div>
      ) : (
        <>
          <CardHeader>
            <CardTitle>{mode === 'login' ? 'Accedi' : 'Registrati'}</CardTitle>
            <CardDescription>
              {mode === 'login'
                ? 'Inserisci le tue credenziali per accedere'
                : 'Crea un nuovo account per iniziare'}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nome@esempio.com"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">Password</label>
                <div className="relative">
                  <LockKeyhole className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === 'signup' ? 'Minimo 6 caratteri' : '••••••••'}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading
                  ? mode === 'login' ? 'Accesso in corso...' : 'Registrazione in corso...'
                  : mode === 'login' ? 'Accedi' : 'Registrati'}
              </Button>
              <div className="text-sm text-center">
                {mode === 'login' ? (
                  <span>Non hai un account? <button type="button" className="text-drplant-blue hover:underline" onClick={toggleMode}>Registrati</button></span>
                ) : (
                  <span>Hai già un account? <button type="button" className="text-drplant-blue hover:underline" onClick={toggleMode}>Accedi</button></span>
                )}
              </div>
            </CardFooter>
          </form>
        </>
      )}
    </Card>
  );
}
