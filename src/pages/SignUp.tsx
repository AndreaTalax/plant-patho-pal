
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
      
      const result = await register(values.email, values.password);
      setRegisteredEmail(values.email);
      
      // If result contains confirmationRequired flag (coming from our modified function)
      if (result && typeof result === 'object' && 'confirmationRequired' in result) {
        setEmailSent(true);
        
        if (result.confirmationRequired) {
          toast.success("Registration completed", {
            description: "We have sent you a confirmation email. If you don't see it in your inbox, please check your spam or promotions folder.",
            duration: 8000,
            dismissible: true,
          });
        } else {
          // User might be already registered or email confirmed
          toast.success("Registration completed", {
            description: result.message || "Your account has been created successfully.",
            duration: 8000,
            dismissible: true,
          });
        }
      } else {
        setEmailSent(true);
        toast.success("Registration completed", {
          description: "We have sent you a confirmation email. If you don't see it in your inbox, please check your spam or promotions folder.",
          duration: 8000,
          dismissible: true,
        });
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      let errorMessage = "A problem occurred during registration";
      let registrationSuccessful = false;
      
      // Check for rate limit error specifically
      if (error.status === 429 || error.code === "over_email_send_rate_limit" || error.message?.includes("rate limit exceeded")) {
        setIsRateLimited(true);
        errorMessage = "You've reached the email sending limit. Your account has been created, but we couldn't send another confirmation email.";
        registrationSuccessful = true;
      }
      // Provide more specific error messages for other cases
      else if (error.message?.includes("weak_password")) {
        errorMessage = "Password is too weak. It must contain at least 6 characters.";
      } else if (error.message?.includes("already registered")) {
        errorMessage = "This email address is already registered. Please try logging in.";
        registrationSuccessful = true; // Consider already registered user as success
      } else if (error.message?.includes("email sending failed")) {
        errorMessage = "Registration completed, but we couldn't send the confirmation email. Please try logging in.";
        registrationSuccessful = true;
      }
      
      if (registrationSuccessful) {
        setEmailSent(true);
        toast.success("Registration completed", {
          description: errorMessage,
          duration: 8000,
          dismissible: true,
        });
      } else {
        toast.error("Registration error", {
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
