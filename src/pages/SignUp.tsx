
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Leaf, LockKeyhole, Mail, AlertCircle } from "lucide-react";
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
  const navigate = useNavigate();
  const { toast } = useToast();
  const { register } = useAuth();

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: SignUpFormValues) => {
    setIsLoading(true);
    setIsRateLimited(false);

    try {
      await register(values.email, values.password);
      
      setEmailSent(true);
      toast({
        title: "Registration completed",
        description: "We have sent you a confirmation email. If you don't see it in your inbox, please check your spam or promotions folder.",
      });
    } catch (error: any) {
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
        toast({
          title: "Registration completed",
          description: errorMessage,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Registration error",
          description: errorMessage,
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
                <p className="text-gray-600">
                  We've sent a confirmation email to <span className="font-medium">{form.getValues().email}</span>.
                  Please click the link in the email to complete your registration. If you don't see it in your inbox, please check your spam or promotions folder.
                </p>
              )}
              <Button 
                variant="outline" 
                className="mt-4 w-full"
                onClick={() => navigate('/login')}
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
