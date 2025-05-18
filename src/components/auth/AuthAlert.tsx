
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface AuthAlertProps {
  title?: string;
  description?: string;
  onDismiss?: () => void;
}

export function AuthAlert({
  title = "Devi accedere",
  description = "Per utilizzare questa funzionalità devi accedere al tuo account.",
  onDismiss
}: AuthAlertProps) {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate("/auth");
  };

  return (
    <Alert variant="destructive" className="mb-4 bg-red-50 border-red-200">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-2 gap-2">
        <span>{description}</span>
        <div className="flex gap-2 w-full sm:w-auto">
          {onDismiss && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onDismiss} 
              className="text-xs flex-1 sm:flex-auto"
            >
              Chiudi
            </Button>
          )}
          <Button 
            size="sm" 
            onClick={handleLogin} 
            className="bg-drplant-blue hover:bg-drplant-blue-dark text-xs flex-1 sm:flex-auto"
          >
            Accedi
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
