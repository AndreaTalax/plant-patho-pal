import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SubscriptionStatus {
  subscribed: boolean;
  subscription_tier?: string | null;
  subscription_end?: string | null;
}

export class SubscriptionService {
  /**
   * Controlla lo stato dell'abbonamento dell'utente
   */
  static async checkSubscription(): Promise<SubscriptionStatus> {
    try {
      console.log('🔍 Controllo stato abbonamento...');

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('❌ Utente non autenticato');
        return { subscribed: false };
      }

      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('❌ Errore controllo abbonamento:', error);
        throw error;
      }

      console.log('✅ Stato abbonamento:', data);
      return data as SubscriptionStatus;
    } catch (error) {
      console.error('❌ Errore nel controllo abbonamento:', error);
      toast.error('Errore nel controllo abbonamento');
      return { subscribed: false };
    }
  }

  /**
   * Crea una sessione di checkout per l'abbonamento
   */
  static async createCheckoutSession(): Promise<string | null> {
    try {
      console.log('💳 Creazione sessione checkout...');

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Devi essere autenticato per procedere');
        return null;
      }

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('❌ Errore creazione checkout:', error);
        toast.error('Errore nella creazione del checkout');
        return null;
      }

      console.log('✅ Checkout session creata:', data.url);
      return data.url;
    } catch (error) {
      console.error('❌ Errore nella creazione checkout:', error);
      toast.error('Errore nella creazione del checkout');
      return null;
    }
  }

  /**
   * Apre il customer portal di Stripe
   */
  static async openCustomerPortal(): Promise<string | null> {
    try {
      console.log('🏪 Apertura customer portal...');

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Devi essere autenticato per accedere');
        return null;
      }

      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('❌ Errore apertura portal:', error);
        toast.error('Errore nell\'apertura del portale');
        return null;
      }

      console.log('✅ Customer portal URL:', data.url);
      return data.url;
    } catch (error) {
      console.error('❌ Errore apertura customer portal:', error);
      toast.error('Errore nell\'apertura del portale');
      return null;
    }
  }

  /**
   * Controlla se l'utente ha un abbonamento attivo
   */
  static async hasActiveSubscription(): Promise<boolean> {
    const status = await this.checkSubscription();
    return status.subscribed;
  }
}