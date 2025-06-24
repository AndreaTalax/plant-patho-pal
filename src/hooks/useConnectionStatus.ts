
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useConnectionStatus = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const checkConnection = async () => {
    try {
      // Simple health check query
      const { error } = await supabase.from('profiles').select('id').limit(1);
      
      if (error) {
        if (error.code === 'PGRST002' || error.message.includes('schema cache')) {
          setIsConnected(false);
          return false;
        }
      }
      
      setIsConnected(true);
      setRetryCount(0);
      return true;
    } catch (error) {
      console.error('❌ Connection check failed:', error);
      setIsConnected(false);
      return false;
    }
  };

  const retryConnection = async () => {
    if (isRetrying) return;
    
    setIsRetrying(true);
    setRetryCount(prev => prev + 1);
    
    console.log(`🔄 Tentativo di riconnessione ${retryCount + 1}/3...`);
    
    // Exponential backoff
    const delay = Math.min(1000 * Math.pow(2, retryCount), 5000);
    await new Promise(resolve => setTimeout(resolve, delay));
    
    const connected = await checkConnection();
    
    if (connected) {
      toast.success('Connessione ristabilita!');
      setRetryCount(0);
    } else if (retryCount < 2) {
      setTimeout(retryConnection, 2000);
    } else {
      toast.error('Impossibile connettersi al database. Riprova più tardi.');
    }
    
    setIsRetrying(false);
  };

  useEffect(() => {
    if (!isConnected && retryCount === 0) {
      retryConnection();
    }
  }, [isConnected]);

  return {
    isConnected,
    isRetrying,
    retryCount,
    checkConnection,
    retryConnection
  };
};
