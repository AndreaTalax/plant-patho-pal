
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { User, Calendar, MapPin } from "lucide-react";
import { useAuth } from "@/context/auth";
import { supabase } from "@/integrations/supabase/client";
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

const profileSchema = z.object({
  email: z.string().email({ message: "L'indirizzo email non è valido" }),
  password: z.string().min(6, { message: "La password deve contenere almeno 6 caratteri" }),
  firstName: z.string().min(1, { message: "Il nome è obbligatorio" }),
  lastName: z.string().min(1, { message: "Il cognome è obbligatorio" }),
  birthDate: z.string().min(1, { message: "La data di nascita è obbligatoria" }),
  birthPlace: z.string().min(1, { message: "Il luogo di nascita è obbligatorio" }),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const CompleteProfile = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast: uiToast } = useToast();
  const { updateProfile, userProfile, isAuthenticated, register, login } = useAuth();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      email: userProfile.email || "",
      password: "",
      firstName: userProfile.firstName || "",
      lastName: userProfile.lastName || "",
      birthDate: userProfile.birthDate || "",
      birthPlace: userProfile.birthPlace || "",
    },
  });

  const onSubmit = async (values: ProfileFormValues) => {
    setIsLoading(true);

    try {
      // If user is not authenticated, register them first
      if (!isAuthenticated) {
        try {
          await register(values.email, values.password);
          // Login after registration
          await login(values.email, values.password);
        } catch (error: any) {
          // If user already exists, try to log them in
          if (error.message?.includes('already registered')) {
            await login(values.email, values.password);
          } else {
            throw error;
          }
        }
      }

      // Update profile information
      await updateProfile("firstName", values.firstName);
      await updateProfile("lastName", values.lastName);
      await updateProfile("birthDate", values.birthDate);
      await updateProfile("birthPlace", values.birthPlace);
      await updateProfile("hasCompletedProfile", true);
      
      toast.success("Profilo completato", {
        description: "Benvenuto su Plant Patho Pal!"
      });
      
      // Redirect to home page
      navigate("/");
    } catch (error: any) {
      console.error("Profile completion error:", error);
      
      toast.error("Errore", {
        description: "Si è verificato un problema. Riprova più tardi."
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
        <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-drplant-blue/10 rounded-full">
                <User className="h-8 w-8 text-drplant-blue" />
              </div>
            </div>
            <CardTitle className="text-2xl text-drplant-blue-dark text-center">Crea il tuo profilo</CardTitle>
            <CardDescription className="text-center">
              Inserisci le tue informazioni per personalizzare la tua esperienza
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {!isAuthenticated && (
                  <>
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" placeholder="Inserisci la tua email" />
                          </FormControl>
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
                          <FormControl>
                            <Input {...field} type="password" placeholder="Inserisci la tua password" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Inserisci il tuo nome" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cognome</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Inserisci il tuo cognome" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="birthDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data di nascita</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            {...field} 
                            type="date" 
                            placeholder="Seleziona la data di nascita"
                          />
                          <Calendar className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="birthPlace"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Luogo di nascita</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            {...field} 
                            placeholder="Inserisci il luogo di nascita" 
                          />
                          <MapPin className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="pt-4">
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-drplant-blue to-drplant-blue-dark hover:from-drplant-blue-dark hover:to-drplant-blue-dark transition-all duration-300"
                    disabled={isLoading}
                  >
                    {isLoading ? "Salvataggio..." : "Continua"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CompleteProfile;
