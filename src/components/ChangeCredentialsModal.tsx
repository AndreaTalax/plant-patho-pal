import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast"; 
import { useAuth } from "@/context/auth"; // Updated import path

interface ChangeCredentialsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ChangeCredentialsModal = ({ open, onOpenChange }: ChangeCredentialsModalProps) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { toast } = useToast();
  const { updateUsername, updatePassword } = useAuth();

  const handleSave = async () => {
    let hasError = false;

    if (username && username.length < 3) {
      toast({
        variant: "destructive",
        title: "Username non valido",
        description: "L'username deve essere di almeno 3 caratteri.",
      });
      hasError = true;
    }

    if (password && password.length < 5) {
      toast({
        variant: "destructive",
        title: "Password non valida",
        description: "La password deve essere di almeno 5 caratteri.",
      });
      hasError = true;
    }

    if (password && password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Le password non coincidono",
        description: "La password e la conferma password devono essere identiche.",
      });
      hasError = true;
    }

    if (!hasError) {
      try {
        if (username) {
          await updateUsername(username);
        }
        
        if (password) {
          await updatePassword(password);
        }

        toast({
          title: "Credenziali aggiornate",
          description: "Le tue credenziali sono state aggiornate con successo.",
        });

        // Reset form
        setUsername("");
        setPassword("");
        setConfirmPassword("");
        onOpenChange(false);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Errore",
          description: "Si è verificato un errore durante l'aggiornamento delle credenziali.",
        });
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cambia credenziali</DialogTitle>
          <DialogDescription>
            Aggiorna il tuo username o password. Lascia vuoto il campo che non vuoi modificare.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="username">Nuovo Username</Label>
            <Input 
              id="username" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              placeholder="Inserisci nuovo username"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Nuova Password</Label>
            <Input 
              id="password" 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="Minimo 5 caratteri"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Conferma Password</Label>
            <Input 
              id="confirm-password" 
              type="password" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              placeholder="Conferma la nuova password"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annulla</Button>
          <Button onClick={handleSave}>Salva</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChangeCredentialsModal;
