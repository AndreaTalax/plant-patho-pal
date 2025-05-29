
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { AuthPageLayout } from "@/components/auth/AuthPageLayout";
import { SignUpForm, SignUpFormValues } from "@/components/signup/SignUpForm";
import { EmailConfirmationScreen } from "@/components/signup/EmailConfirmationScreen";

const SignUp = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const { register } = useAuth();

  const onSubmit = async (values: SignUpFormValues) => {
    setIsLoading(true);
    setIsRateLimited(false);
    
    try {
      // Clear any previous toasts to prevent accumulation
      toast.dismiss();
      
      await register(values.email, values.password);
      setRegisteredEmail(values.email);
      setEmailSent(true);
      
      toast.success("Registrazione completata", {
        description: "Ti abbiamo inviato un'email di conferma. Se non la vedi nella posta in arrivo, controlla la cartella spam.",
        duration: 8000,
        dismissible: true,
      });
    } catch (error: any) {
      console.error("Errore registrazione:", error);
      let errorMessage = "Si è verificato un problema durante la registrazione";
      let registrationSuccessful = false;
      
      // Check for rate limit error specifically
      if (error.status === 429 || error.code === "over_email_send_rate_limit" || error.message?.includes("rate limit exceeded")) {
        setIsRateLimited(true);
        errorMessage = "Hai raggiunto il limite di invio email. Il tuo account è stato creato, ma non è stato possibile inviare un'altra email di conferma.";
        registrationSuccessful = true;
      }
      // Provide more specific error messages for other cases
      else if (error.message?.includes("weak_password")) {
        errorMessage = "La password è troppo debole. Deve contenere almeno 6 caratteri.";
      } else if (error.message?.includes("already registered")) {
        errorMessage = "Questo indirizzo email è già registrato. Prova ad accedere.";
        registrationSuccessful = true; // Consider already registered user as success
      } else if (error.message?.includes("email sending failed")) {
        errorMessage = "Registrazione completata, ma non è stato possibile inviare l'email di conferma. Prova ad accedere.";
        registrationSuccessful = true;
      }
      
      if (registrationSuccessful) {
        setEmailSent(true);
        toast.success("Registrazione completata", {
          description: errorMessage,
          duration: 8000,
          dismissible: true,
        });
      } else {
        toast.error("Errore registrazione", {
          description: errorMessage,
          duration: 8000,
          dismissible: true,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthPageLayout>
      {emailSent ? (
        <EmailConfirmationScreen 
          email={registeredEmail} 
          isRateLimited={isRateLimited} 
        />
      ) : (
        <SignUpForm 
          isLoading={isLoading} 
          onSubmit={onSubmit} 
        />
      )}
    </AuthPageLayout>
  );
};

export default SignUp;
