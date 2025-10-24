import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Fingerprint, Lock, Mail } from "lucide-react";
import { BiometricAuthService } from "@/services/biometricAuthService";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

export const BiometricSettings = () => {
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricType, setBiometricType] = useState<string>("");
  const [isEnabling, setIsEnabling] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    checkBiometricStatus();
  }, []);

  const checkBiometricStatus = async () => {
    const available = await BiometricAuthService.isAvailable();
    const enabled = await BiometricAuthService.isEnabled();
    const type = await BiometricAuthService.getBiometryDescription();
    
    setBiometricAvailable(available);
    setBiometricEnabled(enabled);
    setBiometricType(type);
  };

  const handleEnableBiometric = async () => {
    if (!email || !password) {
      toast.error("Errore", {
        description: "Inserisci email e password per abilitare l'autenticazione biometrica",
      });
      return;
    }

    setIsEnabling(true);
    try {
      await BiometricAuthService.enableBiometric(email, password);
      setBiometricEnabled(true);
      setShowCredentials(false);
      setEmail("");
      setPassword("");
      
      toast.success("Autenticazione biometrica abilitata", {
        description: "Ora puoi accedere rapidamente con la tua impronta digitale",
      });
    } catch (error: any) {
      console.error('Error enabling biometric:', error);
      toast.error("Errore", {
        description: "Impossibile abilitare l'autenticazione biometrica",
      });
    } finally {
      setIsEnabling(false);
    }
  };

  const handleDisableBiometric = async () => {
    try {
      await BiometricAuthService.disableBiometric();
      setBiometricEnabled(false);
      
      toast.success("Autenticazione biometrica disabilitata", {
        description: "Le credenziali salvate sono state rimosse",
      });
    } catch (error) {
      console.error('Error disabling biometric:', error);
      toast.error("Errore", {
        description: "Impossibile disabilitare l'autenticazione biometrica",
      });
    }
  };

  const handleToggle = async (checked: boolean) => {
    if (checked) {
      setShowCredentials(true);
      if (user?.email) {
        setEmail(user.email);
      }
    } else {
      await handleDisableBiometric();
    }
  };

  if (!biometricAvailable) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5" />
            Autenticazione Biometrica
          </CardTitle>
          <CardDescription>
            L'autenticazione biometrica non è disponibile su questo dispositivo
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Fingerprint className="h-5 w-5" />
          Autenticazione Biometrica
        </CardTitle>
        <CardDescription>
          Accedi rapidamente con {biometricType.toLowerCase()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="biometric-switch" className="flex-1">
            <div className="font-medium">Abilita {biometricType}</div>
            <div className="text-sm text-gray-500">
              Usa la tua impronta per accedere rapidamente
            </div>
          </Label>
          <Switch
            id="biometric-switch"
            checked={biometricEnabled}
            onCheckedChange={handleToggle}
            disabled={isEnabling}
          />
        </div>

        {showCredentials && !biometricEnabled && (
          <div className="space-y-4 pt-4 border-t">
            <p className="text-sm text-gray-600">
              Per abilitare l'autenticazione biometrica, inserisci le tue credenziali di accesso.
              Verranno salvate in modo sicuro sul tuo dispositivo.
            </p>
            
            <div className="space-y-2">
              <Label htmlFor="biometric-email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  id="biometric-email"
                  type="email"
                  placeholder="Inserisci la tua email"
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="biometric-password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  id="biometric-password"
                  type="password"
                  placeholder="Inserisci la tua password"
                  className="pl-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleEnableBiometric}
                disabled={isEnabling || !email || !password}
                className="flex-1"
              >
                {isEnabling ? "Abilitazione..." : "Abilita"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCredentials(false);
                  setEmail("");
                  setPassword("");
                }}
              >
                Annulla
              </Button>
            </div>
          </div>
        )}

        {biometricEnabled && (
          <div className="pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-green-600 mb-2">
              <Fingerprint className="h-4 w-4" />
              <span>Autenticazione biometrica attiva</span>
            </div>
            <p className="text-sm text-gray-600">
              Puoi accedere all'app usando la tua impronta digitale dalla schermata di login.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
