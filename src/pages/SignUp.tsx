
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Leaf, LockKeyhole, Mail } from "lucide-react";
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
  email: z.string().email({ message: "Inserisci un indirizzo email valido" }),
  password: z.string().min(6, { message: "La password deve contenere almeno 6 caratteri" }), // Changed from min(5) to min(6)
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Le password non corrispondono",
  path: ["confirmPassword"],
});

type SignUpFormValues = z.infer<typeof signUpSchema>;

const SignUp = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
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

    try {
      await register(values.email, values.password);
      
      setEmailSent(true);
      toast({
        title: "Registrazione completata",
        description: "Ti abbiamo inviato un'email di conferma. Controlla la tua casella di posta.",
      });
    } catch (error: any) {
      let errorMessage = "Si è verificato un problema durante la registrazione";
      
      // Provide more specific error messages
      if (error.message?.includes("weak_password")) {
        errorMessage = "Password troppo debole. Deve contenere almeno 6 caratteri.";
      } else if (error.message?.includes("already registered")) {
        errorMessage = "Questo indirizzo email è già registrato. Prova ad accedere.";
      } else if (error.message?.includes("email sending failed")) {
        errorMessage = "Registrazione completata, ma non è stato possibile inviare l'email di conferma. Prova ad accedere.";
        setEmailSent(true);
      }
      
      toast({
        variant: "destructive",
        title: "Errore durante la registrazione",
        description: errorMessage,
      });
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
          <h1 className="text-3xl font-bold text-drplant-blue-dark">Plant Patho Pal</h1>
          <p className="text-gray-600 mt-2">Registrati per iniziare</p>
        </div>

        <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm">
          {emailSent ? (
            <div className="text-center p-8 space-y-4">
              <div className="inline-flex items-center justify-center p-4 bg-drplant-green/20 rounded-full">
                <Mail className="h-8 w-8 text-drplant-green" />
              </div>
              <h3 className="text-xl font-medium text-drplant-blue-dark">Controlla la tua email</h3>
              <p className="text-gray-600">
                Abbiamo inviato un'email di conferma a <span className="font-medium">{form.getValues().email}</span>.
                Per favore, clicca sul link nella email per completare la registrazione.
              </p>
              <Button 
                variant="outline" 
                className="mt-4 w-full"
                onClick={() => navigate('/login')}
              >
                Torna al login
              </Button>
            </div>
          ) : (
            <>
              <CardHeader>
                <CardTitle className="text-2xl text-drplant-blue-dark text-center">Crea un account</CardTitle>
                <CardDescription className="text-center">
                  Inserisci i tuoi dati per registrarti
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
                                placeholder="nome@esempio.it" 
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
                                placeholder="Minimo 5 caratteri" 
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
                          <FormLabel>Conferma password</FormLabel>
                          <div className="relative">
                            <LockKeyhole className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <FormControl>
                              <Input 
                                {...field}
                                placeholder="Ripeti la password" 
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
                        {isLoading ? "Registrazione in corso..." : "Registrati"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4 text-sm text-gray-500">
                <div className="text-center w-full">
                  Hai già un account? <Link to="/login" className="text-drplant-blue font-medium hover:underline">Accedi</Link>
                </div>
                <p className="text-xs text-gray-500 text-center">
                  Registrandoti, accetti i nostri termini di servizio e la nostra politica sulla privacy.
                </p>
              </CardFooter>
            </>
          )}
        </Card>

        <div className="mt-8 text-center text-gray-600 text-sm">
          <p>© 2025 Plant Patho Pal. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
