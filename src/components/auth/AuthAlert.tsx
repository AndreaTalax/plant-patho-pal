
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface AuthAlertProps {
  title?: string;
  description?: string;
  onDismiss?: () => void;
}

/**
 * Renders an authentication alert with options to close or navigate to login.
 * @example
 * AuthAlert({ title: "Access Necessary", description: "You must log in to use this feature.", onDismiss: () => console.log("Alert dismissed") })
 * // Renders an alert with specified title and description, and handles onDismiss action.
 * @param {Object} AuthAlertProps - Props containing title, description, and onDismiss callback.
 * @param {string} AuthAlertProps.title - The title text of the alert.
 * @param {string} AuthAlertProps.description - The description text of the alert.
 * @param {Function} [AuthAlertProps.onDismiss] - Function to handle the dismiss action of the alert.
 * @returns {JSX.Element} The rendered authentication alert component.
 * @description
 *   - Utilizes useNavigate for navigation to the login page upon "Accedi" button click.
 *   - Applies specific CSS classes for styling the alert and buttons.
 *   - Supports responsive design adjustments for the alert description layout.
 */
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
