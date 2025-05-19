
import React, { useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Lock, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface ChangeCredentialsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChangePassword?: (newPassword: string) => Promise<boolean>;
  onChangeEmail?: (newEmail: string) => Promise<boolean>;
}

const ChangeCredentialsModal: React.FC<ChangeCredentialsModalProps> = ({
  open,
  onOpenChange,
  onChangePassword,
  onChangeEmail
}) => {
  const [activeTab, setActiveTab] = useState<string>("password");
  
  // Password states
  const [currentPassword, setCurrentPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");
  const [isPasswordChanging, setIsPasswordChanging] = useState<boolean>(false);
  
  // Email states
  const [newEmail, setNewEmail] = useState<string>("");
  const [emailError, setEmailError] = useState<string>("");
  const [isEmailChanging, setIsEmailChanging] = useState<boolean>(false);
  
  const { userProfile } = useAuth();
  
  // Reset form when dialog opens/closes
  const resetForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError("");
    setNewEmail("");
    setEmailError("");
    setIsPasswordChanging(false);
    setIsEmailChanging(false);
  };
  
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setPasswordError("");
    setEmailError("");
  };
  
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    
    // Validate input
    if (!currentPassword) {
      setPasswordError("Current password is required");
      return;
    }
    
    if (!newPassword) {
      setPasswordError("New password is required");
      return;
    }
    
    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }
    
    // Change password
    try {
      setIsPasswordChanging(true);
      
      if (onChangePassword) {
        const success = await onChangePassword(newPassword);
        if (success) {
          handleOpenChange(false);
        }
      }
    } catch (error) {
      console.error("Failed to change password:", error);
      setPasswordError("Failed to change password. Please try again later.");
    } finally {
      setIsPasswordChanging(false);
    }
  };
  
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");
    
    // Validate email
    if (!newEmail) {
      setEmailError("Email is required");
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      setEmailError("Please enter a valid email address");
      return;
    }
    
    if (newEmail === userProfile.email) {
      setEmailError("New email is the same as current email");
      return;
    }
    
    // Change email
    try {
      setIsEmailChanging(true);
      
      if (onChangeEmail) {
        const success = await onChangeEmail(newEmail);
        if (success) {
          handleOpenChange(false);
        }
      }
    } catch (error) {
      console.error("Failed to change email:", error);
      setEmailError("Failed to change email. Please try again later.");
    } finally {
      setIsEmailChanging(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change Account Credentials</DialogTitle>
          <DialogDescription>
            Update your password or email address
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="password" value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="password">Password</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
          </TabsList>
          
          {/* Password Tab */}
          <TabsContent value="password">
            <form onSubmit={handlePasswordSubmit} className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              
              {passwordError && (
                <div className="text-red-500 text-sm flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4" />
                  <span>{passwordError}</span>
                </div>
              )}
              
              <DialogFooter className="flex gap-2 justify-end pt-4">
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button 
                  type="submit" 
                  className="bg-drplant-blue hover:bg-drplant-blue-dark flex items-center gap-1.5"
                  disabled={isPasswordChanging}
                >
                  <Lock className="h-4 w-4" />
                  {isPasswordChanging ? "Changing..." : "Update Password"}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
          
          {/* Email Tab */}
          <TabsContent value="email">
            <form onSubmit={handleEmailSubmit} className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="current-email">Current Email</Label>
                <Input
                  id="current-email"
                  type="email"
                  value={userProfile.email}
                  disabled
                  className="bg-gray-50"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new-email">New Email</Label>
                <Input
                  id="new-email"
                  type="email"
                  placeholder="Enter new email address"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </div>
              
              {emailError && (
                <div className="text-red-500 text-sm flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4" />
                  <span>{emailError}</span>
                </div>
              )}
              
              <DialogFooter className="flex gap-2 justify-end pt-4">
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button 
                  type="submit" 
                  className="bg-drplant-blue hover:bg-drplant-blue-dark flex items-center gap-1.5"
                  disabled={isEmailChanging}
                >
                  <Mail className="h-4 w-4" />
                  {isEmailChanging ? "Updating..." : "Update Email"}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ChangeCredentialsModal;
