
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { User, Key } from "lucide-react";

type ChangeCredentialsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const ChangeCredentialsModal = ({ open, onOpenChange }: ChangeCredentialsModalProps) => {
  const { toast } = useToast();
  const { t } = useTheme();
  const { updateUsername, updatePassword } = useAuth();
  
  const [currentUsername, setCurrentUsername] = useState("");
  const [newUsername, setNewUsername] = useState("");
  
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const handleChangeUsername = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (currentUsername !== "test") {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Current username is incorrect",
      });
      return;
    }
    
    if (!newUsername.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "New username cannot be empty",
      });
      return;
    }
    
    updateUsername(newUsername);
    
    toast({
      title: "Username updated",
      description: "Your username has been changed successfully",
    });
    
    setCurrentUsername("");
    setNewUsername("");
    onOpenChange(false);
  };
  
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (currentPassword !== "test") {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Current password is incorrect",
      });
      return;
    }
    
    if (newPassword.length < 4) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "New password must be at least 4 characters",
      });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Passwords do not match",
      });
      return;
    }
    
    updatePassword(newPassword);
    
    toast({
      title: "Password updated",
      description: "Your password has been changed successfully",
    });
    
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Account Settings</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="username" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="username" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              {t("changeUsername")}
            </TabsTrigger>
            <TabsTrigger value="password" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              {t("changePassword")}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="username" className="mt-4">
            <form onSubmit={handleChangeUsername} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-username">{t("currentUsername")}</Label>
                <Input
                  id="current-username"
                  value={currentUsername}
                  onChange={(e) => setCurrentUsername(e.target.value)}
                  placeholder="Enter current username"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new-username">{t("newUsername")}</Label>
                <Input
                  id="new-username"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Enter new username"
                  required
                />
              </div>
              
              <DialogFooter className="mt-4">
                <Button type="submit">{t("save")}</Button>
              </DialogFooter>
            </form>
          </TabsContent>
          
          <TabsContent value="password" className="mt-4">
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">{t("currentPassword")}</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new-password">{t("newPassword")}</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirm-password">{t("confirmPassword")}</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                />
              </div>
              
              <DialogFooter className="mt-4">
                <Button type="submit">{t("save")}</Button>
              </DialogFooter>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ChangeCredentialsModal;
