import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Crown, 
  MessageCircle, 
  CheckCircle, 
  CreditCard,
  Users,
  Sparkles
} from 'lucide-react';
import { SubscriptionService } from '@/services/subscriptionService';
import { toast } from 'sonner';

interface PaymentRequiredModalProps {
  open: boolean;
  onClose: () => void;
  onSubscribed?: () => void;
}

export const PaymentRequiredModal: React.FC<PaymentRequiredModalProps> = ({
  open,
  onClose,
  onSubscribed
}) => {
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);

  // Controlla lo stato dell'abbonamento quando la finestra diventa attiva
  useEffect(() => {
    if (!open) return;

    const handleFocus = async () => {
      if (checkingPayment) return;
      
      setCheckingPayment(true);
      try {
        const hasSubscription = await SubscriptionService.hasActiveSubscription();
        if (hasSubscription && onSubscribed) {
          console.log('✅ Abbonamento attivato, eseguendo callback...');
          onSubscribed();
        }
      } catch (error) {
        console.error('Errore controllo abbonamento:', error);
      } finally {
        setCheckingPayment(false);
      }
    };

    window.addEventListener('focus', handleFocus);
    
    // Controllo periodico ogni 3 secondi quando il modal è aperto
    const interval = setInterval(handleFocus, 3000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, [open, onSubscribed, checkingPayment]);

  const handleSubscribe = async () => {
    setIsCreatingCheckout(true);
    try {
      const checkoutUrl = await SubscriptionService.createCheckoutSession();
      if (checkoutUrl) {
        // Apri Stripe checkout in una nuova finestra
        window.open(checkoutUrl, '_blank');
        
        toast.success('Redirecting to Stripe checkout...', {
          description: 'Completa il pagamento per attivare il tuo abbonamento Premium'
        });

        // Chiudi il modal
        onClose();
      }
    } catch (error) {
      console.error('Errore subscription:', error);
      toast.error('Errore nella creazione dell\'abbonamento');
    } finally {
      setIsCreatingCheckout(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-4">
            <Crown className="h-8 w-8 text-white" />
          </div>
          <DialogTitle className="text-xl font-bold">
            Abbonamento Premium Richiesto
          </DialogTitle>
          <DialogDescription>
            Per accedere alle consulenze illimitate con il nostro fitopatologo esperto, 
            attiva il tuo abbonamento Premium.
          </DialogDescription>
        </DialogHeader>

        <Card className="border-2 border-gradient-to-r from-yellow-200 to-orange-200 bg-gradient-to-br from-yellow-50 to-orange-50">
          <CardContent className="p-6">
            <div className="text-center mb-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-yellow-600" />
                <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                  Premium
                </Badge>
                <Sparkles className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                €9.99<span className="text-lg font-normal text-gray-600">/mese</span>
              </div>
              <p className="text-sm text-gray-600">Consulenze illimitate</p>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span className="text-sm">Consulenze illimitate con Marco Nigro</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span className="text-sm">Chat privata con esperto fitopatologo</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span className="text-sm">Analisi dettagliate delle tue piante</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span className="text-sm">Risposta entro 24 ore</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span className="text-sm">Cancellazione in qualsiasi momento</span>
              </div>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={handleSubscribe}
                disabled={isCreatingCheckout}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold"
                size="lg"
              >
                {isCreatingCheckout ? (
                  <>
                    <CreditCard className="h-4 w-4 mr-2 animate-pulse" />
                    Caricamento...
                  </>
                ) : (
                  <>
                    <Crown className="h-4 w-4 mr-2" />
                    Attiva Premium - €9.99/mese
                  </>
                )}
              </Button>
              
              <Button 
                variant="ghost" 
                onClick={onClose}
                className="w-full"
              >
                Non ora
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Users className="h-4 w-4" />
            <span>Unisciti a centinaia di appassionati di piante</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};