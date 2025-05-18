
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";

interface AuthRequiredDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  redirectPath?: string;
}

export function AuthRequiredDialog({
  isOpen,
  onClose,
  title = "Devi accedere",
  description = "Per utilizzare questa funzionalità devi accedere al tuo account.",
  redirectPath = "/auth",
}: AuthRequiredDialogProps) {
  const navigate = useNavigate();

  const handleLogin = () => {
    onClose();
    navigate(redirectPath);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center space-x-2 text-red-500">
            <AlertCircle className="h-6 w-6" />
            <DialogTitle className="text-red-500">{title}</DialogTitle>
          </div>
          <DialogDescription className="pt-2 text-base">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            Annulla
          </Button>
          <Button onClick={handleLogin} className="bg-drplant-blue hover:bg-drplant-blue-dark">
            Accedi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
