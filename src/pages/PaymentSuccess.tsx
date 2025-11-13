import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const { user, checkSubscription } = useAuth();
  const [isVerifying, setIsVerifying] = useState(true);
  const [paymentVerified, setPaymentVerified] = useState(false);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Verifica lo stato dell'abbonamento
        const { data, error } = await supabase.functions.invoke('check-subscription');
        
        if (error) {
          console.error("Errore verifica abbonamento:", error);
          toast.error("Errore durante la verifica del pagamento");
          setIsVerifying(false);
          return;
        }

        if (data?.subscribed) {
          setPaymentVerified(true);
          
          // Aggiorna lo stato dell'abbonamento nel contesto
          if (checkSubscription) {
            await checkSubscription();
          }
          
          toast.success("Pagamento completato con successo!");
          
          // Dopo 2 secondi, reindirizza alla home
          setTimeout(() => {
            navigate("/", { replace: true });
          }, 2000);
        } else {
          // Riprova dopo 1 secondo (il webhook potrebbe non aver ancora aggiornato)
          setTimeout(() => {
            verifyPayment();
          }, 1000);
        }
      } catch (err) {
        console.error("Errore verifica pagamento:", err);
        toast.error("Errore durante la verifica del pagamento");
        setIsVerifying(false);
      }
    };

    if (user) {
      verifyPayment();
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-drplant-blue-light via-white to-drplant-green/10 flex flex-col items-center justify-center px-4">
      <div className="absolute top-0 left-0 w-full h-64 bg-drplant-blue-light/30 -z-10 rounded-b-[50%]" />
      <div className="absolute bottom-0 right-0 w-full h-64 bg-drplant-green/20 -z-10 rounded-t-[30%]" />

      <Card className="max-w-md w-full border-none shadow-xl bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center">
          {isVerifying ? (
            <>
              <Loader2 className="h-16 w-16 mx-auto mb-4 text-drplant-green animate-spin" />
              <CardTitle className="text-2xl text-drplant-blue-dark">
                Verifica del pagamento in corso...
              </CardTitle>
              <CardDescription>
                Stiamo confermando il tuo abbonamento
              </CardDescription>
            </>
          ) : paymentVerified ? (
            <>
              <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-green-500" />
              <CardTitle className="text-2xl text-drplant-blue-dark">
                Pagamento Completato!
              </CardTitle>
              <CardDescription>
                Il tuo abbonamento è stato attivato con successo
              </CardDescription>
            </>
          ) : (
            <>
              <CardTitle className="text-2xl text-drplant-blue-dark">
                Verifica del pagamento
              </CardTitle>
              <CardDescription>
                Il pagamento è in elaborazione
              </CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {paymentVerified && (
            <>
              <p className="text-gray-600">
                Verrai reindirizzato alla home page tra pochi secondi...
              </p>
              <Button
                onClick={() => navigate("/", { replace: true })}
                className="w-full bg-gradient-to-r from-drplant-green to-drplant-green-dark"
              >
                Vai alla Home
              </Button>
            </>
          )}
          {!isVerifying && !paymentVerified && (
            <Button
              onClick={() => navigate("/plan-subscription-selection")}
              variant="outline"
              className="w-full"
            >
              Torna ai piani
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;
