
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useTheme } from "@/context/ThemeContext";
import { useState } from "react";
import { Sun, Moon, Globe, Settings } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

type SettingsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const SettingsModal = ({ open, onOpenChange }: SettingsModalProps) => {
  const { mode, setMode, language, setLanguage, t } = useTheme();
  const { toast } = useToast();
  
  const [tempMode, setTempMode] = useState<"light" | "dark">(mode);
  const [tempLanguage, setTempLanguage] = useState(language);
  
  const handleSave = () => {
    setMode(tempMode);
    setLanguage(tempLanguage);
    
    toast({
      title: "Settings saved",
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
            {t("settings")}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Appearance */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm">{t("appearance")}</h3>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {tempMode === "light" ? (
                  <Sun className="h-5 w-5 text-amber-500" />
                ) : (
                  <Moon className="h-5 w-5 text-indigo-400" />
                )}
                <Label htmlFor="theme-mode">
                  {tempMode === "light" ? t("lightMode") : t("darkMode")}
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
              <h3 className="font-medium text-sm">{t("language")}</h3>
            </div>
            
            <RadioGroup value={tempLanguage} onValueChange={(value) => setTempLanguage(value as any)}>
              <div className="flex items-center space-x-2 mb-2">
                <RadioGroupItem value="en" id="lang-en" />
                <Label htmlFor="lang-en">{t("english")}</Label>
              </div>
              <div className="flex items-center space-x-2 mb-2">
                <RadioGroupItem value="it" id="lang-it" />
                <Label htmlFor="lang-it">{t("italian")}</Label>
              </div>
              <div className="flex items-center space-x-2 mb-2">
                <RadioGroupItem value="fr" id="lang-fr" />
                <Label htmlFor="lang-fr">{t("french")}</Label>
              </div>
              <div className="flex items-center space-x-2 mb-2">
                <RadioGroupItem value="es" id="lang-es" />
                <Label htmlFor="lang-es">{t("spanish")}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="de" id="lang-de" />
                <Label htmlFor="lang-de">{t("german")}</Label>
              </div>
            </RadioGroup>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button onClick={handleSave}>
            {t("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;
