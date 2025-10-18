import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

const CookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false);
  const { language } = useTheme();

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setShowBanner(false);
  };

  const handleReject = () => {
    localStorage.setItem("cookie-consent", "rejected");
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom">
      <Card className="max-w-4xl mx-auto p-6 shadow-lg border-primary/20">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-2">
              {language === "it" ? "Utilizzo dei Cookie" : "Cookie Usage"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {language === "it" 
                ? "Utilizziamo cookie tecnici essenziali per il funzionamento del sito e cookie analitici per migliorare la tua esperienza. Puoi scegliere di accettare o rifiutare i cookie non essenziali." 
                : "We use essential technical cookies for the site to function and analytical cookies to improve your experience. You can choose to accept or reject non-essential cookies."}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleAccept} size="sm">
                {language === "it" ? "Accetta tutti" : "Accept all"}
              </Button>
              <Button onClick={handleReject} variant="outline" size="sm">
                {language === "it" ? "Solo essenziali" : "Essential only"}
              </Button>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleReject}
            className="flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default CookieConsent;
