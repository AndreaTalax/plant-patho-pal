
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SignUpForm, SignUpFormValues } from "@/components/signup/SignUpForm";
import { AuthPageLayout } from "@/components/auth/AuthPageLayout";
import { Link } from "react-router-dom";

const SignUp = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const { register } = useAuth();

  const onSubmit = async (values: SignUpFormValues) => {
    setIsLoading(true);
    
    try {
      // Clear any previous toasts
      toast.dismiss();
      
      await register(values.email, values.password);
      setRegisteredEmail(values.email);
      setEmailSent(true);
      
      toast.success("Registrazione completata", {
        description: "Ti abbiamo inviato un'email di conferma. Controlla la tua casella di posta.",
        duration: 8000,
        dismissible: true,
      });
    } catch (error: any) {
      console.error("Errore registrazione:", error);
      let errorMessage = "Si è verificato un problema durante la registrazione";
      
      if (error.message?.includes("weak_password")) {
        errorMessage = "La password è troppo debole. Deve contenere almeno 6 caratteri.";
      } else if (error.message?.includes("already registered")) {
        errorMessage = "Questo indirizzo email è già registrato. Prova ad accedere.";
      }
      
      toast.error("Errore registrazione", {
        description: errorMessage,
        duration: 8000,
        dismissible: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-drplant-green/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <h2 className="text-xl font-semibold mb-2">Controlla la tua email</h2>
          <p className="text-gray-600 mb-6">
            Abbiamo inviato un'email di conferma a <span className="font-medium">{registeredEmail}</span>.<br />
            Clicca sul link nell'email per completare la registrazione.
          </p>
          <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-200">
            <p className="text-sm text-blue-800 font-medium">
              Non hai ricevuto l'email?
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Controlla nella cartella spam o nella posta indesiderata.
            </p>
          </div>
          <div className="mt-6 space-y-3">
            <Link to="/login">
              <Button className="w-full bg-drplant-green hover:bg-drplant-green/90 text-white">
                Vai al Login
              </Button>
            </Link>
            <Link to="/signup">
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => {
                  setEmailSent(false);
                  setRegisteredEmail("");
                }}
              >
                Registra un altro account
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <AuthPageLayout>
      <SignUpForm isLoading={isLoading} onSubmit={onSubmit} />
    </AuthPageLayout>
  );
};

export default SignUp;
