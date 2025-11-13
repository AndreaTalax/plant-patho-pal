import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Check, Clock, Calendar, CreditCard } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

export type PlanType = 'privati' | 'business' | 'professionisti';

interface PlanSubscriptionOptionsProps {
  planType: PlanType;
  onSubscriptionSelect: (option: string) => void;
  onBack: () => void;
}

const PlanSubscriptionOptions = ({ planType, onSubscriptionSelect, onBack }: PlanSubscriptionOptionsProps) => {
  const { language } = useTheme();
  const { user, checkSubscription } = useAuth();
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Account di test che non richiedono pagamento
  const testAccounts = ['test@gmail.com', 'premium@gmail.com'];
  const isTestAccount = user?.email && testAccounts.includes(user.email.toLowerCase());

  const privatiOptions = [
    {
      id: 'token-5',
      title: language === 'it' ? 'Carnèt 5 Analisi' : '5 Analysis Pack',
      price: '€49.99',
      description: language === 'it' ? '5 analisi complete' : '5 complete analysis',
      icon: CreditCard
    },
    {
      id: 'token-10',
      title: language === 'it' ? 'Carnèt 10 Analisi' : '10 Analysis Pack',
      price: '€89.99',
      originalPrice: '€99.90',
      description: language === 'it' ? '10 analisi complete' : '10 complete analysis',
      icon: CreditCard,
      popular: true,
      savings: language === 'it' ? 'Risparmi €9.91!' : 'Save €9.91!'
    },
    {
      id: 'weekly',
      title: language === 'it' ? 'Settimanale' : 'Weekly',
      price: '€19.99',
      period: language === 'it' ? '/settimana' : '/week',
      description: language === 'it' ? 'Analisi illimitate per 7 giorni' : 'Unlimited analysis for 7 days',
      icon: Calendar
    },
    {
      id: 'monthly-private',
      title: language === 'it' ? 'Mensile' : 'Monthly',
      price: '€59.99',
      period: language === 'it' ? '/mese' : '/month',
      description: language === 'it' ? 'Analisi illimitate + priorità' : 'Unlimited analysis + priority',
      icon: Calendar
    },
    {
      id: 'yearly-private',
      title: language === 'it' ? 'Annuale' : 'Yearly',
      price: '€599.99',
      period: language === 'it' ? '/anno' : '/year',
      originalPrice: '€719.88',
      description: language === 'it' ? 'Tutto incluso + supporto dedicato' : 'Everything included + dedicated support',
      icon: Calendar,
      savings: language === 'it' ? 'Risparmi €119.89!' : 'Save €119.89!'
    }
  ];

  const businessOptions = [
    {
      id: 'monthly-business',
      title: language === 'it' ? 'Mensile Business' : 'Monthly Business',
      price: '€299.99',
      period: language === 'it' ? '/mese' : '/month',
      description: language === 'it' ? 'Analisi illimitate + priorità' : 'Unlimited analysis + priority',
      icon: Calendar,
      popular: true
    },
    {
      id: 'yearly-business',
      title: language === 'it' ? 'Annuale Business' : 'Yearly Business',
      price: '€2999.99',
      period: language === 'it' ? '/anno' : '/year',
      originalPrice: '€3599.88',
      description: language === 'it' ? 'Tutto incluso + supporto dedicato' : 'Everything included + dedicated support',
      icon: Calendar,
      savings: language === 'it' ? 'Risparmi €599.89!' : 'Save €599.89!'
    }
  ];

  const options = planType === 'privati' ? privatiOptions : businessOptions;

  const handleContinue = async () => {
    if (!selectedOption) {
      console.log("❌ Nessuna opzione selezionata");
      return;
    }
    
    console.log("🚀 Inizio processo per:", selectedOption);
    console.log("👤 Account utente:", user?.email, "- Test account:", isTestAccount);
    
    // Per account di test, salta il pagamento e attiva l'abbonamento
    if (isTestAccount) {
      console.log("✅ Account di test rilevato - skip pagamento");
      setIsLoading(true);
      
      try {
        // Aggiorna il database subscribers per l'account di test
        const { error: updateError } = await supabase
          .from('subscribers')
          .upsert({
            email: user.email!,
            user_id: user.id,
            stripe_customer_id: null,
            subscribed: true,
            subscription_tier: planType,
            subscription_end: null, // Account di test senza scadenza
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'email'
          });

        if (updateError) {
          console.error("❌ Errore aggiornamento subscribers:", updateError);
          throw updateError;
        }

        console.log("✅ Database subscribers aggiornato per account di test");
        
        // Aggiorna lo stato dell'abbonamento nel contesto
        if (checkSubscription) {
          await checkSubscription();
        }
        
        localStorage.setItem('selectedSubscriptionOption', selectedOption);
        toast.success("Account di test - abbonamento attivato senza pagamento");
        
        // Piccolo ritardo per permettere al contesto di aggiornarsi
        setTimeout(() => {
          onSubscriptionSelect(selectedOption);
        }, 500);
      } catch (err: any) {
        console.error("❌ Errore attivazione account test:", err);
        toast.error("Errore durante l'attivazione dell'abbonamento");
        setIsLoading(false);
      }
      return;
    }
    
    // Avvia il processo di pagamento Stripe per utenti normali
    setIsLoading(true);
    try {
      console.log("📞 Chiamata a create-checkout...");
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          successUrl: `${window.location.origin}/payment-success`,
          cancelUrl: `${window.location.origin}/payment-canceled`
        }
      });
      
      console.log("📦 Risposta da create-checkout:", { data, error });
      
      if (error || !data?.url) {
        console.error("❌ Errore nella risposta:", error);
        throw new Error(error?.message || "Errore creazione sessione Stripe");
      }
      
      console.log("✅ URL Stripe ricevuto:", data.url);
      
      // Salva l'opzione selezionata per dopo il pagamento
      localStorage.setItem('selectedSubscriptionOption', selectedOption);
      console.log("💾 Opzione salvata in localStorage");
      
      // Apri Stripe checkout
      console.log("🔄 Reindirizzamento a Stripe...");
      window.location.href = data.url;
    } catch (err: any) {
      console.error("❌ Errore pagamento:", err);
      toast.error(err?.message || "Errore durante l'avvio del pagamento. Riprova.");
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-drplant-blue-dark mb-4">
          {language === 'it' ? `Opzioni ${planType === 'privati' ? 'Privati' : 'Business'}` : `${planType === 'privati' ? 'Private' : 'Business'} Options`}
        </h2>
        <p className="text-gray-600">
          {language === 'it' 
            ? 'Scegli la modalità di abbonamento più adatta alle tue esigenze'
            : 'Choose the subscription mode that best suits your needs'
          }
        </p>
      </div>

      <RadioGroup value={selectedOption} onValueChange={setSelectedOption} className="grid md:grid-cols-2 gap-6 mb-8">
        {options.map((option) => {
          const Icon = option.icon;
          const isSelected = selectedOption === option.id;
          
          return (
            <div key={option.id} className="relative">
              <Label htmlFor={option.id} className="cursor-pointer">
                <Card className={`transition-all duration-300 hover:shadow-lg ${
                  isSelected 
                    ? 'border-drplant-green shadow-lg ring-2 ring-drplant-green/20' 
                    : 'border-gray-200 hover:border-drplant-green/50'
                } ${option.popular ? 'border-drplant-green' : ''}`}>
                  
                  {option.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-drplant-green to-drplant-green-dark text-white px-3 py-1">
                        {language === 'it' ? 'Consigliato' : 'Recommended'}
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-drplant-blue/10 rounded-lg">
                          <Icon className="h-6 w-6 text-drplant-blue" />
                        </div>
                        <div>
                          <CardTitle className="text-xl">{option.title}</CardTitle>
                          {option.savings && (
                            <Badge variant="secondary" className="mt-1 text-green-600">
                              {option.savings}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <RadioGroupItem value={option.id} id={option.id} />
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="mb-4">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-drplant-blue-dark">{option.price}</span>
                        {option.period && (
                          <span className="text-gray-500">{option.period}</span>
                        )}
                      </div>
                      {option.originalPrice && (
                        <span className="text-sm text-gray-400 line-through">{option.originalPrice}</span>
                      )}
                    </div>
                    
                    <CardDescription className="text-base">
                      {option.description}
                    </CardDescription>

                    <div className="mt-4 space-y-2">
                      <div className="flex items-center gap-2 text-sm text-drplant-green">
                        <Check className="h-4 w-4" />
                        <span>
                          {language === 'it' ? '2 prove gratuite di diagnosi AI' : '2 free AI diagnosis trials'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-drplant-green">
                        <Check className="h-4 w-4" />
                        <span>
                          {planType === 'privati' 
                            ? (language === 'it' ? 'Diagnosi AI + Chat Esperto' : 'AI Diagnosis + Expert Chat')
                            : (language === 'it' ? 'Tutte le funzionalità illimitate incluse' : 'All unlimited features included')
                          }
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Label>
            </div>
          );
        })}
      </RadioGroup>

      <div className="flex gap-4 justify-center">
        <Button 
          variant="outline" 
          onClick={onBack}
          className="px-8"
        >
          {language === 'it' ? 'Indietro' : 'Back'}
        </Button>
        <Button 
          onClick={handleContinue}
          disabled={!selectedOption || isLoading}
          className="px-8 bg-gradient-to-r from-drplant-blue to-drplant-blue-dark hover:from-drplant-green hover:to-drplant-green-dark"
        >
          {isLoading 
            ? (language === 'it' ? 'Reindirizzamento al pagamento...' : 'Redirecting to payment...') 
            : isTestAccount
            ? (language === 'it' ? 'Continua (Test)' : 'Continue (Test)')
            : (language === 'it' ? 'Procedi al Pagamento' : 'Proceed to Payment')
          }
        </Button>
      </div>
    </div>
  );
};

export default PlanSubscriptionOptions;