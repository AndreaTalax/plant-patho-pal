
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Leaf, LockKeyhole, Mail, AlertCircle, RefreshCw } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { resendConfirmationEmail } from "@/integrations/supabase/supabaseClient";

// Define the validation schema for the sign-up form
const signUpSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must contain at least 6 characters" }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type SignUpFormValues = z.infer<typeof signUpSchema>;

const SignUp = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [isResendingEmail, setIsResendingEmail] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const handleResendConfirmation = async () => {
    const email = form.getValues().email;
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

  const onSubmit = async (values: SignUpFormValues) => {
    setIsLoading(true);
    setIsRateLimited(false);
    
    try {
      // Clear any previous toasts to prevent accumulation
      toast.dismiss();
      
      const result = await register(values.email, values.password);
      
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
    <div className="h-screen w-full bg-gradient-to-b from-drplant-blue-light via-white to-drplant-green/10 flex flex-col items-center justify-center px-4">
      <div className="absolute top-0 left-0 w-full h-64 bg-drplant-blue-light/30 -z-10 rounded-b-[50%]" />
      <div className="absolute bottom-0 right-0 w-full h-64 bg-drplant-green/20 -z-10 rounded-t-[30%]" />
      
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-4 bg-white/80 backdrop-blur-sm rounded-full shadow-lg mb-4">
            <Leaf className="h-12 w-12 text-drplant-green" />
          </div>
          <h1 className="text-3xl font-bold text-drplant-blue-dark">Dr.Plant</h1>
          <p className="text-gray-600 mt-2">Register to get started</p>
        </div>

        <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm">
          {emailSent ? (
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
                    We've sent a confirmation email to <span className="font-medium">{form.getValues().email}</span>.
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
          ) : (
            <>
              <CardHeader>
                <CardTitle className="text-2xl text-drplant-blue-dark text-center">Create an account</CardTitle>
                <CardDescription className="text-center">
                  Enter your details to register
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <FormControl>
                              <Input 
                                {...field}
                                placeholder="name@example.com" 
                                className="pl-10" 
                                type="email" 
                                autoComplete="email"
                              />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <div className="relative">
                            <LockKeyhole className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <FormControl>
                              <Input 
                                {...field}
                                placeholder="Minimum 6 characters" 
                                className="pl-10" 
                                type="password" 
                                autoComplete="new-password"
                              />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm password</FormLabel>
                          <div className="relative">
                            <LockKeyhole className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <FormControl>
                              <Input 
                                {...field}
                                placeholder="Repeat password" 
                                className="pl-10" 
                                type="password" 
                                autoComplete="new-password"
                              />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="pt-2">
                      <Button 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-drplant-blue to-drplant-blue-dark hover:from-drplant-blue-dark hover:to-drplant-blue-dark transition-all duration-300"
                        disabled={isLoading}
                      >
                        {isLoading ? "Registering..." : "Register"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4 text-sm text-gray-500">
                <div className="text-center w-full">
                  Already have an account? <Link to="/login" className="text-drplant-blue font-medium hover:underline">Login</Link>
                </div>
                <p className="text-xs text-gray-500 text-center">
                  By registering, you agree to our terms of service and privacy policy.
                </p>
              </CardFooter>
            </>
          )}
        </Card>

        <div className="mt-8 text-center text-gray-600 text-sm">
          <p>© 2025 Dr.Plant. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
