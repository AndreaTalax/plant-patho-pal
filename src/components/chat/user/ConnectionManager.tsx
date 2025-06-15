
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UseConnectionManagerProps {
  currentConversationId: string | null;
  activeChat: string | null;
}

export const useConnectionManager = (currentConversationId: string | null, activeChat: string | null) => {
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!currentConversationId && activeChat === 'expert') {
      const timer = setTimeout(() => {
        setConnectionError("Impossibile connettersi alla chat. Errore di connessione con il server.");
        toast({
          title: "Errore di connessione alla chat",
          description: "Problemi di connessione o server (502). Riprova tra poco.",
          duration: 10000,
          variant: "destructive"
        });
      }, 4000);
      return () => clearTimeout(timer);
    } else {
      setConnectionError(null);
    }
  }, [currentConversationId, activeChat, toast]);

  return { connectionError };
};
