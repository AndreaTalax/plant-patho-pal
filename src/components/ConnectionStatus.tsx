
import React from 'react';
import { useConnectionStatus } from '@/hooks/useConnectionStatus';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

export const ConnectionStatus: React.FC = () => {
  const { isConnected, isRetrying, retryCount, retryConnection } = useConnectionStatus();

  if (isConnected) {
    return null;
  }

  return (
    <Alert variant="destructive" className="mb-4">
      <WifiOff className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <div>
          <p className="font-medium">Problemi di connessione al database</p>
          <p className="text-sm mt-1">
            {isRetrying 
              ? `Tentativo di riconnessione ${retryCount}/3...`
              : 'Impossibile connettersi al database'
            }
          </p>
        </div>
        <Button
          onClick={retryConnection}
          variant="outline"
          size="sm"
          disabled={isRetrying}
          className="ml-4"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
          Riprova
        </Button>
      </AlertDescription>
    </Alert>
  );
};
