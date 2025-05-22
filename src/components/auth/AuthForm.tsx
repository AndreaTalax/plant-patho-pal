
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
        
        // Handle rate limit case
        if (result && 'rateLimitExceeded' in result && result.rateLimitExceeded) {
          setIsRateLimited(true);
          setEmailSent(true); // Still show the confirmation screen
          toast.warning('Email sending limit reached', {
            description: result.message,
            duration: 8000, // Longer duration for this important notice
          });
        } else {
          setEmailSent(true);
          console.log("Registration result:", result);
          
          // Check if email confirmation is required
          const needsConfirmation = 'confirmationRequired' in result ? result.confirmationRequired : true;
          
          toast.success('Registration completed', {
            description: needsConfirmation 
              ? "We've sent you a confirmation email. If you don't see it in your inbox, please check your spam folder."
              : "Registration completed successfully.",
          });
        }
      } else {
        try {
          await signIn(email, password);
          toast.success('Login successful', {
            description: "Welcome to your account!",
          });
        } catch (error: any) {
          if (error.message === 'email_not_confirmed') {
            setEmailSent(true);
            toast.warning('Email not confirmed', {
              description: "You need to confirm your email before you can log in. Check your inbox or request a new confirmation link.",
              duration: 8000,
            });
          } else {
            throw error;
          }
        }
      }
    } catch (error: any) {
      let message = "An error occurred";
      
      if (error.message?.includes('already registered')) {
        message = "Email already registered. Try logging in instead.";
      } else if (error.message?.includes('Invalid login')) {
        message = "Invalid credentials. Check your email and password.";
      } else if (error.message?.includes('weak password')) {
        message = "Password must be at least 6 characters long.";
      }
      
      toast.error(mode === 'signup' ? 'Registration error' : 'Login error', {
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
            <CardTitle>{mode === 'login' ? 'Login' : 'Register'}</CardTitle>
            <CardDescription>
              {mode === 'login'
                ? 'Enter your credentials to log in'
                : 'Create a new account to get started'}
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
