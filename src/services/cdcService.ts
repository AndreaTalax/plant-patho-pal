import { supabase } from '@/integrations/supabase/client';
import React from 'react';

export interface CDCEvent {
  id: string;
  table_name: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  old_data?: any;
  new_data?: any;
  user_id?: string;
  occurred_at: string;
  processed: boolean;
  metadata?: any;
}

export interface CDCSubscription {
  unsubscribe: () => void;
}

/**
 * Service per gestire Change Data Capture (CDC) in tempo reale
 */
export class CDCService {
  private static subscriptions: Map<string, any> = new Map();

  /**
   * Sottoscrivi ai cambiamenti di una tabella specifica
   */
  static subscribeToTable(
    tableName: string, 
    callback: (event: any) => void,
    operation?: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
  ): CDCSubscription {
    console.log(`🔄 Subscribing to CDC events for table: ${tableName}`);

    const channel = supabase
      .channel(`cdc-${tableName}-${Date.now()}`)
      .on(
        'postgres_changes' as any,
        {
          event: operation || '*',
          schema: 'public',
          table: tableName
        },
        (payload) => {
          console.log(`📡 CDC Event received for ${tableName}:`, payload);
          
          // Trasforma il payload in formato CDCEvent
          const cdcEvent: Partial<CDCEvent> = {
            table_name: tableName,
            operation: (payload as any).eventType || 'UPDATE',
            new_data: (payload as any).new || payload,
            old_data: (payload as any).old,
            occurred_at: new Date().toISOString(),
            processed: false
          };

          callback(cdcEvent);
        }
      )
      .subscribe();

    this.subscriptions.set(`${tableName}-${operation || '*'}`, channel);

    return {
      unsubscribe: () => {
        supabase.removeChannel(channel);
        this.subscriptions.delete(`${tableName}-${operation || '*'}`);
        console.log(`🔄 Unsubscribed from CDC events for table: ${tableName}`);
      }
    };
  }

  /**
   * Sottoscrivi agli eventi CDC elaborati
   */
  static subscribeToCDCEvents(callback: (event: CDCEvent) => void): CDCSubscription {
    console.log('🔄 Subscribing to processed CDC events');

    const channel = supabase
      .channel('cdc-events-subscription')
      .on(
        'postgres_changes' as any,
        {
          event: 'INSERT',
          schema: 'public',
          table: 'cdc_events'
        },
        (payload) => {
          console.log('📡 New CDC event logged:', payload);
          callback((payload as any).new as CDCEvent);
        }
      )
      .subscribe();

    return {
      unsubscribe: () => {
        supabase.removeChannel(channel);
        console.log('🔄 Unsubscribed from CDC events');
      }
    };
  }

  /**
   * Ottieni gli eventi CDC non elaborati
   */
  static async getUnprocessedEvents(limit = 50): Promise<CDCEvent[]> {
    try {
      const { data, error } = await supabase
        .from('cdc_events')
        .select('*')
        .eq('processed', false)
        .order('occurred_at', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('❌ Error fetching unprocessed CDC events:', error);
        throw error;
      }

      return (data || []).map(event => ({
        ...event,
        operation: event.operation as 'INSERT' | 'UPDATE' | 'DELETE'
      }));
    } catch (error) {
      console.error('❌ Error in getUnprocessedEvents:', error);
      throw error;
    }
  }

  /**
   * Marca gli eventi come elaborati
   */
  static async markEventsProcessed(eventIds: string[]): Promise<void> {
    try {
      const { error } = await supabase
        .from('cdc_events')
        .update({ processed: true })
        .in('id', eventIds);

      if (error) {
        console.error('❌ Error marking events as processed:', error);
        throw error;
      }

      console.log(`✅ Marked ${eventIds.length} events as processed`);
    } catch (error) {
      console.error('❌ Error in markEventsProcessed:', error);
      throw error;
    }
  }

  /**
   * Elabora gli eventi CDC tramite microservizio
   */
  static async processEvents(): Promise<{ processed_count: number; total_events: number }> {
    try {
      console.log('🔄 Processing CDC events via microservice...');
      
      const response = await fetch(`${window.location.origin}/.netlify/functions/invoke-supabase-function`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          functionName: 'cdc-event-processor',
          payload: {}
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ CDC events processed:', result);
      
      return result;
    } catch (error) {
      console.error('❌ Error processing CDC events:', error);
      throw error;
    }
  }

  /**
   * Invia webhook per evento CDC
   */
  static async sendWebhook(
    tableName: string, 
    operation: string, 
    eventData: any, 
    userId?: string
  ): Promise<void> {
    try {
      console.log(`📡 Sending CDC webhook for ${operation} on ${tableName}`);
      
      const response = await fetch(`${window.location.origin}/.netlify/functions/invoke-supabase-function`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          functionName: 'cdc-webhook-handler',
          payload: {
            tableName,
            operation,
            eventData,
            userId
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Webhook failed with status: ${response.status}`);
      }

      console.log('✅ CDC webhook sent successfully');
    } catch (error) {
      console.error('❌ Error sending CDC webhook:', error);
      throw error;
    }
  }

  /**
   * Pulisci tutte le sottoscrizioni
   */
  static cleanup(): void {
    this.subscriptions.forEach((channel) => {
      supabase.removeChannel(channel);
    });
    this.subscriptions.clear();
    console.log('🧹 All CDC subscriptions cleaned up');
  }
}

/**
 * Hook React per gestire CDC in componenti
 */
export function useCDC(tableName: string, operation?: 'INSERT' | 'UPDATE' | 'DELETE' | '*') {
  const [events, setEvents] = React.useState<CDCEvent[]>([]);
  const [isConnected, setIsConnected] = React.useState(false);

  React.useEffect(() => {
    const subscription = CDCService.subscribeToTable(
      tableName,
      (event) => {
        setEvents(prev => [event as CDCEvent, ...prev].slice(0, 100)); // Keep last 100 events
      },
      operation
    );

    setIsConnected(true);

    return () => {
      subscription.unsubscribe();
      setIsConnected(false);
    };
  }, [tableName, operation]);

  return { events, isConnected };
}

// Types for microservice endpoints
export interface MessageMicroservice {
  processNewMessage: (messageData: any) => Promise<void>;
  updateConversation: (conversationId: string, lastMessage: string) => Promise<void>;
}

export interface DiagnosisMicroservice {
  processNewDiagnosis: (diagnosisData: any) => Promise<void>;
  notifyExperts: (diagnosisId: string) => Promise<void>;
  updateAnalytics: (plantType: string, symptoms: string[]) => Promise<void>;
}

export interface ConsultationMicroservice {
  routeToExpert: (consultationData: any) => Promise<void>;
  determinePriority: (symptoms: string, plantType: string) => 'low' | 'medium' | 'high';
  sendNotification: (expertId: string, consultationId: string) => Promise<void>;
}