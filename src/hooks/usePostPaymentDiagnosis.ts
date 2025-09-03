import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AutoExpertNotificationService } from '@/components/chat/AutoExpertNotificationService';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export const usePostPaymentDiagnosis = () => {
  const { user } = useAuth();

  useEffect(() => {
    const handlePostPayment = async () => {
      // Controlla se c'è una diagnosi pendente dopo il pagamento
      const pendingDiagnosis = localStorage.getItem('pendingDiagnosis');
      
      if (!pendingDiagnosis || !user) return;

      try {
        const diagnosisData = JSON.parse(pendingDiagnosis);
        
        // Verifica che la diagnosi non sia troppo vecchia (max 1 ora)
        const timeLimit = 60 * 60 * 1000; // 1 ora in millisecondi
        if (Date.now() - diagnosisData.timestamp > timeLimit) {
          console.log('⏰ Diagnosi pendente troppo vecchia, ignorata');
          localStorage.removeItem('pendingDiagnosis');
          return;
        }

        // Verifica che l'utente sia lo stesso
        if (diagnosisData.userId !== user.id) {
          console.log('⚠️ Utente diverso, rimuovo diagnosi pendente');
          localStorage.removeItem('pendingDiagnosis');
          return;
        }

        // Controlla se l'utente ora ha accesso premium
        console.log('🔍 Verificando stato abbonamento post-pagamento...');
        const { data: subscriptionData, error } = await supabase.functions.invoke('check-subscription');
        
        if (error) {
          console.error('❌ Errore verifica abbonamento:', error);
          return;
        }

        if (subscriptionData?.subscribed) {
          console.log('✅ Abbonamento verificato, invio diagnosi all\'esperto...');
          
          // Invia la diagnosi all'esperto
          const success = await AutoExpertNotificationService.sendDiagnosisToExpert(
            user.id,
            diagnosisData.diagnosisData
          );

          if (success) {
            console.log('🎉 Diagnosi inviata con successo all\'esperto!');
            toast.success('Pagamento completato!', {
              description: 'La tua diagnosi è stata inviata automaticamente al fitopatologo Marco Nigro.'
            });
            
            // Rimuovi la diagnosi pendente
            localStorage.removeItem('pendingDiagnosis');
            
            // Reindirizza alla chat
            setTimeout(() => {
              const event = new CustomEvent('switchTab', { detail: 'chat' });
              window.dispatchEvent(event);
            }, 2000);
          } else {
            console.error('❌ Errore nell\'invio della diagnosi');
            toast.error('Pagamento completato ma errore nell\'invio della diagnosi', {
              description: 'Contatta il supporto per assistenza'
            });
          }
        } else {
          console.log('⚠️ Abbonamento non ancora attivo, ricontrollo più tardi...');
          // Riprova dopo qualche secondo (a volte Stripe impiega del tempo)
          setTimeout(handlePostPayment, 5000);
        }
      } catch (error) {
        console.error('❌ Errore nel gestire la diagnosi post-pagamento:', error);
        localStorage.removeItem('pendingDiagnosis');
      }
    };

    // Controlla sia al mount che quando cambia l'URL (per gestire il ritorno da Stripe)
    handlePostPayment();

    // Listener per i cambiamenti nell'URL (successo pagamento)
    const handleUrlChange = () => {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('subscription') === 'success') {
        console.log('🎊 Rilevato successo pagamento dall\'URL');
        // Attendi un po' per dare tempo a Stripe di aggiornare lo stato
        setTimeout(handlePostPayment, 3000);
        
        // Pulisci l'URL
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      }
    };

    handleUrlChange();

    // Listener per i cambiamenti di hash/URL
    window.addEventListener('popstate', handleUrlChange);
    
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, [user]);
};