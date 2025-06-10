
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

/**
 * Renders a dialog that prompts the user to log in before accessing certain features.
 * @example
 * AuthRequiredDialog({
 *   isOpen: true,
 *   onClose: () => console.log('Dialog closed'),
 *   title: "Access Restricted",
 *   description: "Please log in to access this section.",
 *   redirectPath: "/login"
 * })
 * Dialog component prompting user login with navigation support
 * @param {boolean} isOpen - Indicates whether the dialog is open or closed.
 * @param {function} onClose - Callback function to handle the closing of the dialog.
 * @param {string} title - Title of the dialog, defaults to "Login Required".
 * @param {string} description - Detailed message displayed in the dialog, defaults to a login requirement message.
 * @param {string} redirectPath - Path to redirect user upon login, defaults to "/auth".
 * @returns {JSX.Element} A dialog component prompting user login.
 * @description
 *   - Utilizes the `useNavigate` hook for page navigation upon login.
 *   - Dialog includes a cancel button which triggers the `onClose` function.
 *   - Customizable dialog title and description.
 *   - Defines styles for buttons and dialog through class names.
 */
export function AuthRequiredDialog({
  isOpen,
  onClose,
  title = "Login Required",
  description = "You need to log in to use this feature.",
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
            Cancel
          </Button>
          <Button onClick={handleLogin} className="bg-drplant-blue hover:bg-drplant-blue-dark">
            Login
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
