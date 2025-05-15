
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, AlertCircle, RefreshCw } from "lucide-react";
import { resendConfirmationEmail } from "@/integrations/supabase/supabaseClient";
import { toast } from "sonner";

interface EmailConfirmationScreenProps {
  email: string;
  isRateLimited: boolean;
}

export const EmailConfirmationScreen = ({ email, isRateLimited }: EmailConfirmationScreenProps) => {
  const [isResendingEmail, setIsResendingEmail] = useState(false);
  const navigate = useNavigate();

  const handleResendConfirmation = async () => {
    if (!email) {
      toast.error("Email required", {
        description: "Please enter your email to receive a new confirmation link.",
      });
      return;
    }
    
    setIsResendingEmail(true);
    
    try {
      const result = await resendConfirmationEmail(email);
      
      if (result.rateLimitExceeded) {
        toast.warning("Email rate limit reached", {
          description: result.message,
          duration: 8000,
        });
      } else {
        toast.success("Confirmation email sent", {
          description: "We've sent a new confirmation email. Please check your inbox.",
        });
      }
    } catch (error) {
      toast.error("Failed to send email", {
        description: "Could not send the confirmation email. Please try again later.",
      });
    } finally {
      setIsResendingEmail(false);
    }
  };

  return (
    <div className="text-center p-8 space-y-4">
      <div className="inline-flex items-center justify-center p-4 bg-drplant-green/20 rounded-full">
        <Mail className="h-8 w-8 text-drplant-green" />
      </div>
      <h3 className="text-xl font-medium text-drplant-blue-dark">Check your email</h3>
      {isRateLimited ? (
        <>
          <div className="inline-flex items-center justify-center p-3 bg-amber-50 rounded-full mt-2">
            <AlertCircle className="h-6 w-6 text-amber-500" />
          </div>
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <p className="text-amber-800">
              <strong>Email rate limit reached</strong>
            </p>
            <p className="text-gray-700 text-sm mt-1">
              You've tried to register multiple times with the same email. Your account has been created, but we couldn't send another confirmation email due to rate limiting.
            </p>
            <p className="text-gray-700 text-sm mt-2">
              Please check your spam or promotions folder for previous confirmation emails, or try logging in directly.
            </p>
          </div>
        </>
      ) : (
        <>
          <p className="text-gray-600">
            We've sent a confirmation email to <span className="font-medium">{email}</span>.
            Please click the link in the email to complete your registration.
          </p>
          
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-blue-800 font-medium">
              Haven't received the email?
            </p>
            <p className="text-gray-700 text-sm mt-1">
              Check your spam or promotions folder, or request a new confirmation email.
            </p>
            <Button 
              variant="outline" 
              size="sm"
              className="mt-3 w-full"
              onClick={handleResendConfirmation}
              disabled={isResendingEmail}
            >
              {isResendingEmail ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Resend confirmation email
                </>
              )}
            </Button>
          </div>
        </>
      )}
      <Button 
        variant="outline" 
        className="mt-4 w-full"
        onClick={() => {
          toast.dismiss(); // Clear any toasts on navigation
          navigate('/login');
        }}
      >
        Back to login
      </Button>
    </div>
  );
};
