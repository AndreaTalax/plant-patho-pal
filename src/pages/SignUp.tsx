
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { AuthPageLayout } from "@/components/auth/AuthPageLayout";
import { SignUpForm, SignUpFormValues } from "@/components/signup/SignUpForm";
import { EmailConfirmationScreen } from "@/components/signup/EmailConfirmationScreen";

/**
* Handles user registration by submitting sign-up form data and displaying appropriate messages.
* @example
* onSubmit({ email: "test@example.com", password: "password123" })
* // Returns a layout component that wraps a registration form or confirmation screen.
* @param {SignUpFormValues} values - The sign-up form data including email and password.
* @returns {JSX.Element} Returns a layout component wrapping either the registration form or confirmation screen.
* @description
*   - Clears previous toasts before attempting registration to avoid accumulation.
*   - Handles multiple error scenarios with specific messages, including rate limits and weak password.
*   - Considers user already registered as a successful registration for messaging purposes.
*   - Sets state flags for loading, email sent status, and rate limiting status based on registration outcome.
*/
const SignUp = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const { register } = useAuth();

  /**
   * Handles user registration and provides feedback via toasts.
   * @example
   * sync({ email: "example@example.com", password: "securepassword123" })
   * // Displays success or error toast based on registration outcome
   * @param {SignUpFormValues} values - An object containing `email` and `password` for registration.
   * @returns {void} This function does not return a value.
   * @description
   *   - Manages the registration process and feedback to the user via asynchronous calls and toasts.
   *   - Differentiates error handling based on the error type (rate limit, weak password, already registered, etc.).
   *   - Updates the state related to loading and rate limiting conditions.
   *   - Uses Italian language for toast messages when providing user feedback.
   */
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
