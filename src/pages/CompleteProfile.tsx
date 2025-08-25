
import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useTheme } from "@/context/ThemeContext";

const profileSchema = z.object({
  firstName: z.string().min(2, "Il nome deve avere almeno 2 caratteri"),
  lastName: z.string().min(2, "Il cognome deve avere almeno 2 caratteri"),
  birthDate: z.string().min(1, "La data di nascita è obbligatoria"),
  birthPlace: z.string().min(2, "Il luogo di nascita deve avere almeno 2 caratteri"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const CompleteProfile = () => {
  const { userProfile, updateProfile, loading } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTheme();

  // Se il profilo è già completo, redirect alla home
  React.useEffect(() => {
    if (!loading && userProfile) {
      const isComplete = Boolean(
        (userProfile.firstName || userProfile.first_name) &&
        (userProfile.lastName || userProfile.last_name) &&
        (userProfile.birthDate || userProfile.birth_date) &&
        (userProfile.birthPlace || userProfile.birth_place)
      );
      
      if (isComplete) {
        navigate('/');
      }
    }
  }, [userProfile, loading, navigate]);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: userProfile?.firstName || userProfile?.first_name || "",
      lastName: userProfile?.lastName || userProfile?.last_name || "",
      birthDate: (userProfile?.birthDate || userProfile?.birth_date || "") as string,
      birthPlace: userProfile?.birthPlace || userProfile?.birth_place || "",
    },
  });

  const onSubmit = async (values: ProfileFormValues) => {
    setIsLoading(true);

    try {
      // Aggiorna solo i campi del profilo, senza toccare ruoli o sottoscrizioni
      await updateProfile({
        first_name: values.firstName,
        last_name: values.lastName,
        birth_date: values.birthDate,
        birth_place: values.birthPlace,
      });
      
      toast.success("Profilo completato con successo!");
      navigate("/");
    } catch (error) {
      console.error("Errore durante il completamento del profilo:", error);
      toast.error("Errore durante il completamento del profilo. Riprova.");
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-drplant-green/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-drplant-green mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-drplant-green/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-drplant-green">
            Completa il tuo profilo
          </CardTitle>
          <CardDescription>
            Aggiungi le informazioni mancanti per continuare
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Nome *</Label>
              <Input
                id="firstName"
                {...form.register("firstName")}
                placeholder="Inserisci il tuo nome"
              />
              {form.formState.errors.firstName && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.firstName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Cognome *</Label>
              <Input
                id="lastName"
                {...form.register("lastName")}
                placeholder="Inserisci il tuo cognome"
              />
              {form.formState.errors.lastName && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.lastName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthDate">Data di nascita *</Label>
              <Input
                id="birthDate"
                type="date"
                {...form.register("birthDate")}
              />
              {form.formState.errors.birthDate && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.birthDate.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthPlace">Luogo di nascita *</Label>
              <Input
                id="birthPlace"
                {...form.register("birthPlace")}
                placeholder="Inserisci il tuo luogo di nascita"
              />
              {form.formState.errors.birthPlace && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.birthPlace.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-drplant-green hover:bg-drplant-green/90"
              disabled={isLoading}
            >
              {isLoading ? "Salvataggio..." : "Continua"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompleteProfile;
