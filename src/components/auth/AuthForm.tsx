
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { signUp, signIn } from '@/integrations/supabase/supabaseClient';
import { toast } from 'sonner';
import { AuthEmailConfirmation } from './AuthEmailConfirmation';
import { AuthFormFields } from './AuthFormFields';

type AuthMode = 'login' | 'signup';

export function AuthForm() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);

  const toggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setEmailSent(false);
    setIsRateLimited(false);
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
          console.log("Risultato registrazione:", result);
          
          // Verifica se la conferma email è richiesta
          const needsConfirmation = 'confirmationRequired' in result ? result.confirmationRequired : true;
          
          toast.success('Registrazione completata', {
            description: needsConfirmation 
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
        <AuthEmailConfirmation
          email={email}
          isRateLimited={isRateLimited}
          mode={mode}
          onBack={toggleMode}
        />
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
          <AuthFormFields
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            mode={mode}
            onSubmit={handleSubmit}
            toggleMode={toggleMode}
            isLoading={isLoading}
          />
        </>
      )}
    </Card>
  );
}
