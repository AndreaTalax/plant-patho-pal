import { useEffect, useState, useCallback } from 'react';
import { CDCService, CDCEvent } from '../services/cdcService';

export interface UseCDCRealtimeOptions {
  tableName: string;
  operation?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  autoProcess?: boolean;
  processInterval?: number;
}

export function useCDCRealtime({
  tableName,
  operation = '*',
  autoProcess = false,
  processInterval = 30000 // 30 seconds
}: UseCDCRealtimeOptions) {
  const [events, setEvents] = useState<CDCEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastProcessed, setLastProcessed] = useState<Date | null>(null);
  const [processingStats, setProcessingStats] = useState<{
    processed_count: number;
    total_events: number;
  } | null>(null);

  // Handle new CDC events
  const handleCDCEvent = useCallback((event: Partial<CDCEvent>) => {
    console.log(`📡 New ${event.operation} event on ${event.table_name}:`, event);
    
    setEvents(prev => [{
      id: crypto.randomUUID(),
      ...event,
      occurred_at: event.occurred_at || new Date().toISOString(),
      processed: false
    } as CDCEvent, ...prev].slice(0, 100)); // Keep last 100 events
  }, []);

  // Process events manually
  const processEvents = useCallback(async () => {
    try {
      const stats = await CDCService.processEvents();
      setProcessingStats(stats);
      setLastProcessed(new Date());
      console.log('✅ Manual CDC processing completed:', stats);
      return stats;
    } catch (error) {
      console.error('❌ Error processing CDC events:', error);
      throw error;
    }
  }, []);

  // Auto process events
  useEffect(() => {
    if (!autoProcess) return;

    const interval = setInterval(async () => {
      try {
        await processEvents();
      } catch (error) {
        console.error('❌ Auto CDC processing failed:', error);
      }
    }, processInterval);

    return () => clearInterval(interval);
  }, [autoProcess, processInterval, processEvents]);

  // Subscribe to table changes
  useEffect(() => {
    console.log(`🔄 Setting up CDC subscription for ${tableName}`);
    
    const subscription = CDCService.subscribeToTable(
      tableName,
      handleCDCEvent,
      operation
    );

    setIsConnected(true);

    return () => {
      subscription.unsubscribe();
      setIsConnected(false);
      console.log(`🔄 CDC subscription cleaned up for ${tableName}`);
    };
  }, [tableName, operation, handleCDCEvent]);

  // Send webhook for event
  const sendWebhook = useCallback(async (
    eventData: any,
    userId?: string
  ) => {
    try {
      await CDCService.sendWebhook(tableName, operation, eventData, userId);
    } catch (error) {
      console.error('❌ Error sending webhook:', error);
      throw error;
    }
  }, [tableName, operation]);

  // Get unprocessed events
  const getUnprocessedEvents = useCallback(async (limit?: number) => {
    try {
      return await CDCService.getUnprocessedEvents(limit);
    } catch (error) {
      console.error('❌ Error getting unprocessed events:', error);
      throw error;
    }
  }, []);

  return {
    // State
    events,
    isConnected,
    lastProcessed,
    processingStats,
    
    // Actions
    processEvents,
    sendWebhook,
    getUnprocessedEvents,
    
    // Utils
    clearEvents: () => setEvents([]),
    getEventsByOperation: (op: string) => events.filter(e => e.operation === op),
    getLatestEvent: () => events[0] || null
  };
}

// Specialized hooks for different tables
export function useMessagesCDC(autoProcess = true) {
  return useCDCRealtime({
    tableName: 'messages',
    operation: '*',
    autoProcess,
    processInterval: 10000 // 10 seconds for messages
  });
}

export function useConversationsCDC(autoProcess = true) {
  return useCDCRealtime({
    tableName: 'conversations',
    operation: '*',
    autoProcess,
    processInterval: 15000 // 15 seconds for conversations
  });
}

export function useDiagnosesCDC(autoProcess = true) {
  return useCDCRealtime({
    tableName: 'diagnoses',
    operation: '*',
    autoProcess,
    processInterval: 20000 // 20 seconds for diagnoses
  });
}

export function useConsultationsCDC(autoProcess = true) {
  return useCDCRealtime({
    tableName: 'consultations',
    operation: '*',
    autoProcess,
    processInterval: 15000 // 15 seconds for consultations
  });
}

export function useProfilesCDC(autoProcess = false) {
  return useCDCRealtime({
    tableName: 'profiles',
    operation: 'UPDATE', // Only track updates for profiles
    autoProcess,
    processInterval: 60000 // 1 minute for profiles
  });
}