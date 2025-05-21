
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Mail, AlertCircle, RefreshCw } from "lucide-react";
import { resendConfirmationEmail } from '@/integrations/supabase/supabaseClient';
import { toast } from 'sonner';

interface AuthEmailConfirmationProps {
  email: string;
  isRateLimited: boolean;
  mode: 'login' | 'signup';
  onBack: () => void;
}

export function AuthEmailConfirmation({ 
  email, 
  isRateLimited, 
  mode, 
  onBack 
}: AuthEmailConfirmationProps) {
  const [isResendingEmail, setIsResendingEmail] = useState(false);

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
      console.error("Errore nell'invio dell'email:", error);
      toast.error('Errore invio email', {
        description: "Non è stato possibile inviare l'email di conferma. Riprova più tardi.",
      });
    } finally {
      setIsResendingEmail(false);
    }
  };

  return (
    <div className="p-6 text-center">
      <div className="flex justify-center mb-4">
        <Mail className="h-16 w-16 text-drplant-green" />
      </div>
      <h2 className="text-xl font-semibold mb-2">Controlla la tua email</h2>
      
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
          <p className="text-gray-600 mb-6">
            Abbiamo inviato un'email di conferma a <span className="font-medium">{email}</span>.<br />
            Clicca sul link nell'email per {mode === 'signup' ? 'completare la registrazione' : 'accedere al tuo account'}.
          </p>
          
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
      
      <Button variant="outline" className="mt-6 w-full" onClick={onBack}>
        Torna al {mode === 'signup' ? 'login' : 'signup'}
      </Button>
    </div>
  );
}
