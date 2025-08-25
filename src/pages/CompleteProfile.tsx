import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { User, ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
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

const profileSchema = z.object({
  firstName: z.string().min(1, { message: "Il nome è obbligatorio" }),
  lastName: z.string().min(1, { message: "Il cognome è obbligatorio" }),
  birthDate: z.string().min(1, { message: "La data di nascita è obbligatoria" }),
  birthPlace: z.string().min(1, { message: "Il luogo di nascita è obbligatorio" }),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const CompleteProfile = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { updateProfile, userProfile } = useAuth();
  const { t } = useTheme();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: userProfile?.firstName || userProfile?.first_name || "",
      lastName: userProfile?.lastName || userProfile?.last_name || "",
      birthDate: userProfile?.birthDate || userProfile?.birth_date || "",
      birthPlace: userProfile?.birthPlace || userProfile?.birth_place || "",
    },
  });

  const onSubmit = async (values: ProfileFormValues) => {
    setIsLoading(true);

    try {
      // Map to database field names (snake_case)
      await updateProfile("first_name", values.firstName);
      await updateProfile("last_name", values.lastName);
      await updateProfile("birth_date", values.birthDate);  
      await updateProfile("birth_place", values.birthPlace);
      
      toast({
        title: t("profileCompleted"),
        description: t("welcomeMessage"),
      });
      
      // Redirect to home page with diagnose tab active
      navigate("/?tab=diagnose");
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("error"),
        description: t("tryAgain"),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-full bg-gradient-to-b from-drplant-blue-light via-white to-drplant-green/10 flex flex-col items-center justify-center px-4">
      <div className="absolute top-0 left-0 w-full h-64 bg-drplant-blue-light/30 -z-10 rounded-b-[50%]" />
      <div className="absolute bottom-0 right-0 w-full h-64 bg-drplant-green/20 -z-10 rounded-t-[30%]" />
      
      {/* Back Button */}
      <div className="absolute top-4 left-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/login")}
          className="flex items-center gap-2 text-drplant-blue hover:text-drplant-blue-dark"
        >
          <ArrowLeft className="h-4 w-4" />
          Esci
        </Button>
      </div>
      
      <div className="w-full max-w-md">
        <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-drplant-blue/10 rounded-full">
                <User className="h-8 w-8 text-drplant-blue" />
              </div>
            </div>
            <CardTitle className="text-2xl text-drplant-blue-dark text-center">{t("completeProfile")}</CardTitle>
            <CardDescription className="text-center">
              {t("personalInfo")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("firstName")} *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder={t("enterFirstName")} />
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
                      <FormLabel>{t("lastName")} *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder={t("enterLastName")} />
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
                      <FormLabel>{t("birthDate")} *</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" placeholder={t("enterBirthDate")} />
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
                      <FormLabel>{t("birthPlace")} *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder={t("enterBirthPlace")} />
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
                    {isLoading ? t("saving") : t("continue")}
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
