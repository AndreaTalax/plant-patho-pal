
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useTheme } from "@/context/ThemeContext";
import { useState, useEffect } from "react";
import { Sun, Moon, Globe, Settings } from "lucide-react";
import { toast } from "sonner";

type SettingsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Renders a settings modal allowing users to adjust appearance and language preferences.
 * @example
 * functionName({ open: true, onOpenChange: (isOpen) => console.log(isOpen) })
 * // Renders the settings modal with current preferences.
 * @param {object} SettingsModalProps - Contains the current open state and function to change it.
 * @returns {JSX.Element} A dialog component containing settings options for appearance and language.
 * @description
 *   - Uses local state to temporarily hold user preferences before saving.
 *   - Resets temporary settings when the modal opens to reflect current preferences.
 *   - Shows success toast notification upon saving preferences.
 */
const SettingsModal = ({ open, onOpenChange }: SettingsModalProps) => {
  const { mode, setMode, language, setLanguage, t } = useTheme();
  
  const [tempMode, setTempMode] = useState<"light" | "dark">(mode);
  const [tempLanguage, setTempLanguage] = useState(language);
  
  // Reset temp values when modal opens
  useEffect(() => {
    if (open) {
      setTempMode(mode);
      setTempLanguage(language);
    }
  }, [open, mode, language]);
  
  const handleSave = () => {
    setMode(tempMode);
    setLanguage(tempLanguage);
    
    toast.success("Settings saved", {
      description: "Your preferences have been updated",
    });
    
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Settings
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Appearance */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm">Appearance</h3>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {tempMode === "light" ? (
                  <Sun className="h-5 w-5 text-amber-500" />
                ) : (
                  <Moon className="h-5 w-5 text-indigo-400" />
                )}
                <Label htmlFor="theme-mode">
                  {tempMode === "light" ? "Light Mode" : "Dark Mode"}
                </Label>
              </div>
              <Switch
                id="theme-mode"
                checked={tempMode === "dark"}
                onCheckedChange={(checked) => setTempMode(checked ? "dark" : "light")}
              />
            </div>
          </div>
          
          {/* Language */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Globe className="h-5 w-5 text-blue-500" />
              <h3 className="font-medium text-sm">Language</h3>
            </div>
            
            <RadioGroup value={tempLanguage} onValueChange={(value) => setTempLanguage(value as any)}>
              <div className="flex items-center space-x-2 mb-2">
                <RadioGroupItem value="en" id="lang-en" />
                <Label htmlFor="lang-en">English</Label>
              </div>
              <div className="flex items-center space-x-2 mb-2">
                <RadioGroupItem value="it" id="lang-it" />
                <Label htmlFor="lang-it">Italian</Label>
              </div>
              <div className="flex items-center space-x-2 mb-2">
                <RadioGroupItem value="fr" id="lang-fr" />
                <Label htmlFor="lang-fr">French</Label>
              </div>
              <div className="flex items-center space-x-2 mb-2">
                <RadioGroupItem value="es" id="lang-es" />
                <Label htmlFor="lang-es">Spanish</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="de" id="lang-de" />
                <Label htmlFor="lang-de">German</Label>
              </div>
            </RadioGroup>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;
