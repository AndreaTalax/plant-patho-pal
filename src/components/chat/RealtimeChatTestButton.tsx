
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, Send, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface TestStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message?: string;
  duration?: number;
}

export const RealtimeChatTestButton: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const [steps, setSteps] = useState<TestStep[]>([]);

  const updateStep = (id: string, updates: Partial<TestStep>) => {
    setSteps(prev => prev.map(step => 
      step.id === id ? { ...step, ...updates } : step
    ));
  };

  const runRealtimeTest = async () => {
    if (!user?.id) {
      toast({
        title: "Errore",
        description: "Devi essere autenticato per testare",
        variant: "destructive"
      });
      return;
    }

    setIsRunning(true);
    const testSteps: TestStep[] = [
      { id: 'connection', name: 'Test connessione real-time', status: 'pending' },
      { id: 'subscription', name: 'Test subscription canali', status: 'pending' },
      { id: 'message-send', name: 'Test invio messaggio', status: 'pending' },
      { id: 'message-receive', name: 'Test ricezione real-time', status: 'pending' }
    ];
    
    setSteps(testSteps);

    try {
      // Step 1: Test connection
      updateStep('connection', { status: 'running', message: 'Verifico connessione Supabase...' });
      const startTime = Date.now();
      
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        updateStep('connection', { 
          status: 'error', 
          message: 'Sessione non valida',
          duration: Date.now() - startTime 
        });
        return;
      }

      updateStep('connection', { 
        status: 'success', 
        message: 'Connessione OK',
        duration: Date.now() - startTime 
      });

      // Step 2: Test subscription
      updateStep('subscription', { status: 'running', message: 'Creo subscription test...' });
      const subStartTime = Date.now();
      
      let messageReceived = false;
      const testChannel = supabase.channel('realtime-test')
        .on('broadcast', { event: 'test-message' }, (payload) => {
          console.log('Test message received:', payload);
          messageReceived = true;
          updateStep('message-receive', { 
            status: 'success', 
            message: 'Messaggio ricevuto in real-time!',
            duration: Date.now() - msgStartTime 
          });
        })
        .subscribe();

      updateStep('subscription', { 
        status: 'success', 
        message: 'Subscription attiva',
        duration: Date.now() - subStartTime 
      });

      // Step 3: Send test message
      updateStep('message-send', { status: 'running', message: 'Invio messaggio di test...' });
      const msgStartTime = Date.now();

      await new Promise(resolve => setTimeout(resolve, 500)); // Wait for subscription to be ready

      await testChannel.send({
        type: 'broadcast',
        event: 'test-message',
        payload: { 
          message: 'Test real-time message',
          sender: user.id,
          timestamp: new Date().toISOString()
        }
      });

      updateStep('message-send', { 
        status: 'success', 
        message: 'Messaggio inviato',
        duration: Date.now() - msgStartTime 
      });

      // Wait for real-time response
      setTimeout(() => {
        if (!messageReceived) {
          updateStep('message-receive', { 
            status: 'error', 
            message: 'Timeout: messaggio non ricevuto',
            duration: Date.now() - msgStartTime 
          });
        }
        testChannel.unsubscribe();
      }, 3000);

      toast({
        title: "Test Real-time completato!",
        description: "Controlla i risultati dei singoli step",
      });

    } catch (error) {
      console.error('Errore nel test real-time:', error);
      toast({
        title: "Errore nel test",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  const StatusIcon = ({ status }: { status: TestStep['status'] }) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'running':
        return <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-white">
      <div className="flex items-center gap-3 mb-4">
        <Zap className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Test Real-Time Chat</h3>
        <Badge variant="outline">Advanced</Badge>
      </div>

      <div className="space-y-3">
        <p className="text-sm text-gray-600">
          Test avanzato per verificare la funzionalità real-time della chat,
          inclusi subscription, invio e ricezione messaggi.
        </p>

        <Button 
          onClick={runRealtimeTest}
          disabled={isRunning || !user?.id}
          className="w-full"
          variant="outline"
        >
          {isRunning ? (
            <>
              <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
              Test in corso...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Test Real-Time
            </>
          )}
        </Button>

        {steps.length > 0 && (
          <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
            <h4 className="text-sm font-medium text-gray-700">Risultati del test:</h4>
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-start gap-2 p-2 bg-gray-50 rounded text-xs">
                <StatusIcon status={step.status} />
                <div className="flex-1">
                  <div className="font-medium">{step.name}</div>
                  {step.message && (
                    <div className="text-gray-600">{step.message}</div>
                  )}
                  {step.duration && (
                    <div className="text-xs text-gray-500">
                      Completato in {step.duration}ms
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
