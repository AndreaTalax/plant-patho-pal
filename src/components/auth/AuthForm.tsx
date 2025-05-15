
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signUp, signIn, resendConfirmationEmail } from '@/integrations/supabase/supabaseClient';
import { toast } from 'sonner';
import { Mail, LockKeyhole, AlertCircle, RefreshCw } from "lucide-react";

type AuthMode = 'login' | 'signup';

export function AuthForm() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [isResendingEmail, setIsResendingEmail] = useState(false);

  const toggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setEmailSent(false);
    setIsRateLimited(false);
  };

  const handleResendConfirmation = async () => {
    if (!email) {
      toast.error('Email mancante', {
        description: "Per favore inserisci la tua email per ricevere un nuovo link di conferma."
      });
      return;
    }
    
    setIsResendingEmail(true);
    
    try {
      const result = await resendConfirmationEmail(email);
      
      if (result.rateLimitExceeded) {
        toast.warning('Limite invio email raggiunto', {
          description: result.message,
          duration: 8000,
        });
      } else {
        toast.success('Email inviata', {
          description: "Abbiamo inviato una nuova email di conferma. Controlla la tua casella di posta.",
        });
      }
    } catch (error) {
      toast.error('Errore invio email', {
        description: "Non è stato possibile inviare l'email di conferma. Riprova più tardi.",
      });
    } finally {
      setIsResendingEmail(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (mode === 'signup') {
        const result = await signUp(email, password);
        
        // Gestione del caso di rate limit
        if (result && 'rateLimitExceeded' in result && result.rateLimitExceeded) {
          setIsRateLimited(true);
          setEmailSent(true); // Mostriamo comunque la schermata di conferma
          toast.warning('Limite invio email raggiunto', {
            description: result.message,
            duration: 8000, // Durata più lunga per questo avviso importante
          });
        } else {
          setEmailSent(true);
          toast.success('Registrazione completata', {
            description: result.confirmationRequired 
              ? "Ti abbiamo inviato un'email di conferma. Se non la vedi nella casella principale, controlla nella cartella spam."
              : "Registrazione completata con successo.",
          });
        }
      } else {
        try {
          await signIn(email, password);
          toast.success('Login effettuato con successo', {
            description: "Benvenuto nel tuo account!",
          });
        } catch (error: any) {
          if (error.message === 'email_not_confirmed') {
            setEmailSent(true);
            toast.warning('Email non confermata', {
              description: "Devi confermare la tua email prima di poter accedere. Controlla la tua casella di posta o richiedi un nuovo link di conferma.",
              duration: 8000,
            });
          } else {
            throw error;
          }
        }
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
          
          {isRateLimited ? (
            <>
              <div className="flex justify-center mt-4 mb-2">
                <AlertCircle className="h-8 w-8 text-amber-500" />
              </div>
              <div className="mb-4 p-3 bg-amber-50 rounded-md border border-amber-200">
                <p className="text-sm text-amber-800 font-medium">
                  Limite di email raggiunto
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Hai effettuato troppe richieste di registrazione con questa email. Il tuo account è stato probabilmente creato, ma non possiamo inviare un'altra email di conferma al momento.
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Se hai già ricevuto un'email di conferma precedente, usala per completare la registrazione o prova ad accedere direttamente.
                </p>
              </div>
            </>
          ) : (
            <>
              <CardDescription className="mb-6">
                Abbiamo inviato un'email di conferma a <span className="font-medium">{email}</span>.<br />
                Clicca sul link nell'email per {mode === 'signup' ? 'completare la registrazione' : 'accedere al tuo account'}.
              </CardDescription>
              
              <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-200">
                <p className="text-sm text-blue-800 font-medium">
                  Non hai ricevuto l'email?
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Controlla nella cartella spam o nella posta indesiderata.
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="mt-2 w-full"
                  onClick={handleResendConfirmation}
                  disabled={isResendingEmail}
                >
                  {isResendingEmail ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Invio in corso...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Invia di nuovo l'email
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
          
          <Button variant="outline" className="mt-6" onClick={toggleMode}>
            Torna al {mode === 'signup' ? 'login' : 'signup'}
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
