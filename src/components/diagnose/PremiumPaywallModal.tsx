
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Zap, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface PremiumPaywallModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const PremiumPaywallModal: React.FC<PremiumPaywallModalProps> = ({
  open,
  onClose,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          successUrl: `${window.location.origin}/payment-success`,
          cancelUrl: `${window.location.origin}/payment-canceled`
        }
      });
      if (error || !data?.url) throw new Error(error?.message || "Errore creazione sessione Stripe");
      window.open(data.url, "_blank");
      toast.info("Verifica il pagamento nella nuova finestra/tab.");

      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error("Errore durante la sottoscrizione Premium.");
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-drplant-blue">
            <Crown className="w-5 h-5" /> Passa a DrPlant Premium
          </DialogTitle>
          <DialogDescription>
            Ottieni l'accesso istantaneo alla diagnosi AI, aggiornamenti futuri e supporto prioritario.<br/>
            <span className="text-drplant-green font-medium block mt-2">Abbonamento mensile, annullabile in ogni momento!</span>
          </DialogDescription>
        </DialogHeader>
        <ul className="mt-4 space-y-3">
          <li className="flex items-center gap-2 text-green-700">
            <Check className="w-4 h-4" /> Diagnosi AI illimitata e istantanea
          </li>
          <li className="flex items-center gap-2 text-green-700">
            <Check className="w-4 h-4" /> Accesso anticipato a nuove funzionalità
          </li>
          <li className="flex items-center gap-2 text-green-700">
            <Check className="w-4 h-4" /> Supporto prioritario con esperto
          </li>
        </ul>
        <div className="my-6 text-center">
          <span className="text-2xl font-bold text-drplant-blue mr-2">€7,99</span>
          <span className="text-gray-600 font-medium">/mese</span>
        </div>
        <Button
          onClick={handleSubscribe}
          className="w-full bg-drplant-green hover:bg-drplant-green-dark text-lg"
          disabled={loading}
        >
          <Zap className="mr-2 w-5 h-5" /> Abbonati ora
        </Button>
        <Button
          onClick={onClose}
          className="w-full mt-2"
          variant="ghost"
        >Annulla</Button>
      </DialogContent>
    </Dialog>
  );
};
