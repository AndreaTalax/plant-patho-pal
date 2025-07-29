
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast"; // Updated import path
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

interface ChangeCredentialsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Represents a modal dialog to change user credentials such as username and password.
 * @example
 * changeCredentialsModalProps({ open: true, onOpenChange: handleOpenChange })
 * <Dialog /> JSX element
 * @param {boolean} open - Indicates whether the modal is open.
 * @param {Function} onOpenChange - Callback function to handle changes in dialog visibility.
 * @returns {JSX.Element} A modal dialog component allowing users to update their credentials.
 * @description
 *   - Ensures username is at least 3 characters long and password is at least 5 characters long.
 *   - Validates that password and confirm password fields match.
 *   - Resets form inputs upon successful update.
 */
const ChangeCredentialsModal = ({ open, onOpenChange }: ChangeCredentialsModalProps) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { toast } = useToast();
  const { updateUsername, updatePassword } = useAuth();
  const { t } = useTheme();

  /**
   * Handles the validation and updating of username and password credentials.
   * @example
   * updateCredentials('user123', 'password123', 'password123')
   * // Displays success toast if no error, otherwise shows error toast
   * @param {string} username - The new username to validate and update.
   * @param {string} password - The new password to validate and update.
   * @param {string} confirmPassword - The confirmation password to check against the new password.
   * @returns {void} Does not return a value; provides feedback through UI toast.
   * @description
   *   - If either the username or password is invalid, an error toast is displayed.
   *   - The onOpenChange function is used to reset the modal's open state.
   *   - Resets the form input fields upon successful update or validation error.
   *   - Utilizes `toast` for displaying validation and update messages.
   */
  const handleSave = () => {
    let hasError = false;

    if (username && username.length < 3) {
      toast({
        variant: "destructive",
        title: t("invalidUsername"),
        description: t("usernameMinLength"),
      });
      hasError = true;
    }

    if (password && password.length < 5) {
      toast({
        variant: "destructive",
        title: t("invalidPassword"),
        description: t("passwordMinLength"),
      });
      hasError = true;
    }

    if (password && password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: t("passwordsDontMatchTitle"),
        description: t("passwordsDontMatchDesc"),
      });
      hasError = true;
    }

    if (!hasError) {
      if (username) {
        updateUsername(username);
      }
      
      if (password) {
        updatePassword(password);
      }

      toast({
        title: t("credentialsUpdated"),
        description: t("credentialsUpdatedDesc"),
      });

      // Reset form
      setUsername("");
      setPassword("");
      setConfirmPassword("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("changeCredentials")}</DialogTitle>
          <DialogDescription>
            {t("updateCredentials")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="username">{t("newUsername")}</Label>
            <Input 
              id="username" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              placeholder={t("enterNewUsername")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t("newPasswordLabel")}</Label>
            <Input 
              id="password" 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder={t("minCharacters")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">{t("confirmPasswordLabel")}</Label>
            <Input 
              id="confirm-password" 
              type="password" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              placeholder={t("confirmNewPasswordPlaceholder")}
            />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("cancel")}</Button>
          <Button onClick={handleSave}>{t("save")}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChangeCredentialsModal;
