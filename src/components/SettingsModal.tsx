
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Moon, Sun, Globe, Bell, Smartphone, Mail } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SettingsModal = ({ open, onOpenChange }: SettingsModalProps) => {
  const { mode, setMode, language, setLanguage, t } = useTheme();
  const { isSupported, permission, requestPermission, sendTestNotification } = usePushNotifications();
  const { userProfile, updateProfile } = useAuth();
  
  const [emailEnabled, setEmailEnabled] = useState(userProfile?.email_notifications_enabled ?? true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setEmailEnabled(userProfile.email_notifications_enabled ?? true);
    }
  }, [userProfile]);
  
  const handleSave = () => {
    toast.success(t("settingsSaved"), {
      description: t("preferencesUpdated"),
    });
    onOpenChange(false);
  };

  const handlePushNotificationToggle = async (enabled: boolean) => {
    if (enabled) {
      const success = await requestPermission();
      if (!success) {
        toast.error('Impossibile attivare le notifiche push');
      }
    }
  };

  const handleEmailToggle = async (enabled: boolean) => {
    if (!userProfile) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ email_notifications_enabled: enabled } as any)
        .eq('id', userProfile.id);

      if (error) throw error;

      setEmailEnabled(enabled);
      await updateProfile({ email_notifications_enabled: enabled } as any);
      toast.success(enabled ? 'Notifiche email attivate' : 'Notifiche email disattivate');
    } catch (error) {
      console.error('Error updating email notifications:', error);
      toast.error('Errore durante l\'aggiornamento');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-drplant-blue-dark">{t("settings")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {/* Appearance Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              {mode === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              {t("appearance")}
            </h3>
            <div className="flex items-center justify-between">
              <Label htmlFor="dark-mode" className="text-gray-700">
                {mode === 'dark' ? t("lightMode") : t("darkMode")}
              </Label>
              <Switch
                id="dark-mode"
                checked={mode === 'dark'}
                onCheckedChange={(checked) => setMode(checked ? 'dark' : 'light')}
              />
            </div>
          </div>

          <Separator />

          {/* Language Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <Globe className="h-5 w-5" />
              {t("language")}
            </h3>
            <div className="space-y-2">
              <Label htmlFor="language" className="text-gray-700">
                {t("language")}
              </Label>
              <Select value={language} onValueChange={(value: any) => setLanguage(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="it">{t("italian")}</SelectItem>
                  <SelectItem value="en">{t("english")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Notifications Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <Bell className="h-5 w-5" />
              {t("notifications")}
            </h3>
            
            {/* Email Notifications */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <Label htmlFor="email-notifications" className="text-gray-700">
                  Notifiche Email
                </Label>
              </div>
              <Switch
                id="email-notifications"
                checked={emailEnabled}
                onCheckedChange={handleEmailToggle}
                disabled={isSaving}
              />
            </div>
            
            {/* Push Notifications */}
            {isSupported ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    <Label htmlFor="push-notifications" className="text-gray-700">
                      {t("pushNotifications")}
                    </Label>
                  </div>
                  <Switch
                    id="push-notifications"
                    checked={permission === 'granted'}
                    onCheckedChange={handlePushNotificationToggle}
                  />
                </div>
                
                {permission === 'granted' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={sendTestNotification}
                    className="w-full"
                  >
                    {t("testNotification")}
                  </Button>
                )}
                
                <p className="text-sm text-gray-500">
                  {permission === 'granted' 
                    ? t("pushNotificationsEnabled")
                    : permission === 'denied'
                    ? t("pushNotificationsDenied")
                    : t("pushNotificationsDisabled")
                  }
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                {t("pushNotificationsNotSupported")}
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button 
            onClick={handleSave}
            className="bg-gradient-to-r from-drplant-blue to-drplant-blue-dark hover:from-drplant-blue-dark hover:to-drplant-blue-dark"
          >
            {t("save")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;
