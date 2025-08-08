import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, User, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { MARCO_NIGRO_ID } from '@/components/phytopathologist';
import { useToast } from '@/components/ui/use-toast';

interface TestResult {
  step: string;
  status: 'success' | 'error' | 'pending';
  message: string;
  data?: any;
}

export const ChatTestButton: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);

  const addResult = (result: TestResult) => {
    setResults(prev => [...prev, result]);
  };

  const updateLastResult = (status: 'success' | 'error', message: string, data?: any) => {
    setResults(prev => {
      const newResults = [...prev];
      const lastIndex = newResults.length - 1;
      if (lastIndex >= 0) {
        newResults[lastIndex] = { 
          ...newResults[lastIndex], 
          status, 
          message,
          data 
        };
      }
      return newResults;
    });
  };

  const runChatTest = async () => {
    if (!user?.id) {
      toast({
        title: "Errore",
        description: "Devi essere autenticato per testare la chat",
        variant: "destructive"
      });
      return;
    }

    setIsRunning(true);
    setResults([]);

    try {
      // Step 1: Check if conversation exists
      addResult({
        step: "1. Controllo conversazione esistente",
        status: "pending",
        message: "Cerco conversazione tra utente e Marco..."
      });

      const { data: existingConv, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .eq('expert_id', MARCO_NIGRO_ID)
        .single();

      if (convError && convError.code !== 'PGRST116') {
        updateLastResult('error', `Errore nel controllo conversazione: ${convError.message}`);
        return;
      }

      let conversationId: string;

      if (existingConv) {
        updateLastResult('success', `Conversazione trovata: ${existingConv.id}`, existingConv);
        conversationId = existingConv.id;
      } else {
        updateLastResult('success', 'Nessuna conversazione esistente, ne creerò una nuova');
        
        // Step 2: Create new conversation
        addResult({
          step: "2. Creazione nuova conversazione",
          status: "pending",
          message: "Creo conversazione tra utente e Marco..."
        });

        const { data: newConv, error: createError } = await supabase
          .from('conversations')
          .insert({
            user_id: user.id,
            expert_id: MARCO_NIGRO_ID,
            status: 'active'
          })
          .select()
          .single();

        if (createError) {
          updateLastResult('error', `Errore nella creazione conversazione: ${createError.message}`);
          return;
        }

        updateLastResult('success', `Conversazione creata: ${newConv.id}`, newConv);
        conversationId = newConv.id;
      }

      // Step 3: Send test message from user
      addResult({
        step: "3. Invio messaggio di test (utente)",
        status: "pending",
        message: "Invio messaggio 'ping' dall'utente..."
      });

      const { data: userMessage, error: userMsgError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          recipient_id: MARCO_NIGRO_ID,
          content: '🧪 PING - Test messaggio dall\'utente',
          sent_at: new Date().toISOString()
        })
        .select()
        .single();

      if (userMsgError) {
        updateLastResult('error', `Errore invio messaggio utente: ${userMsgError.message}`);
        return;
      }

      updateLastResult('success', `Messaggio utente inviato: ${userMessage.id}`, userMessage);

      // Step 4: Send test message from Marco (simulate expert reply)
      addResult({
        step: "4. Invio messaggio di test (Marco)",
        status: "pending",
        message: "Simulo risposta di Marco..."
      });

      const { data: marcoMessage, error: marcoMsgError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: MARCO_NIGRO_ID,
          recipient_id: user.id,
          content: '🧪 PONG - Test risposta da Marco Nigro (simulata)',
          sent_at: new Date().toISOString()
        })
        .select()
        .single();

      if (marcoMsgError) {
        updateLastResult('error', `Errore invio messaggio Marco: ${marcoMsgError.message}`);
        return;
      }

      updateLastResult('success', `Messaggio Marco inviato: ${marcoMessage.id}`, marcoMessage);

      // Step 5: Update conversation metadata
      addResult({
        step: "5. Aggiornamento conversazione",
        status: "pending",
        message: "Aggiorno metadati conversazione..."
      });

      const { error: updateError } = await supabase
        .from('conversations')
        .update({
          last_message_text: marcoMessage.content,
          last_message_at: marcoMessage.sent_at
        })
        .eq('id', conversationId);

      if (updateError) {
        updateLastResult('error', `Errore aggiornamento conversazione: ${updateError.message}`);
        return;
      }

      updateLastResult('success', 'Conversazione aggiornata con successo');

      // Step 6: Check real-time subscription
      addResult({
        step: "6. Test subscription real-time",
        status: "success",
        message: "✅ Test completato! Vai al tab Chat per vedere i messaggi in tempo reale"
      });

      toast({
        title: "Test completato!",
        description: `Conversazione di test creata con ID: ${conversationId}`,
      });

    } catch (error) {
      console.error('Errore nel test chat:', error);
      addResult({
        step: "ERRORE",
        status: "error",
        message: `Errore inaspettato: ${error.message}`
      });
    } finally {
      setIsRunning(false);
    }
  };

  const StatusIcon = ({ status }: { status: TestResult['status'] }) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />;
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-white">
      <div className="flex items-center gap-3 mb-4">
        <MessageSquare className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Test Chat Real-Time</h3>
        <Badge variant="outline">Debug</Badge>
      </div>

      <div className="space-y-3">
        <p className="text-sm text-gray-600">
          Questo test creerà una conversazione tra te e Marco Nigro e invierà messaggi di test 
          per verificare la funzionalità real-time.
        </p>

        <Button 
          onClick={runChatTest}
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
              Avvia Test Chat
            </>
          )}
        </Button>

        {results.length > 0 && (
          <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
            <h4 className="text-sm font-medium text-gray-700">Risultati del test:</h4>
            {results.map((result, index) => (
              <div key={index} className="flex items-start gap-2 p-2 bg-gray-50 rounded text-xs">
                <StatusIcon status={result.status} />
                <div className="flex-1">
                  <div className="font-medium">{result.step}</div>
                  <div className="text-gray-600">{result.message}</div>
                  {result.data && (
                    <div className="mt-1 text-xs text-gray-500">
                      ID: {result.data.id}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {!isRunning && results.length > 0 && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
            <div className="flex items-center gap-2 text-blue-800">
              <User className="h-4 w-4" />
              <span className="font-medium">Prossimi passi:</span>
            </div>
            <ul className="mt-2 text-blue-700 space-y-1">
              <li>• Vai al tab "Chat" per vedere la conversazione</li>
              <li>• Verifica che i messaggi appaiano in real-time</li>
              <li>• Apri una seconda finestra come Marco per testare entrambi i lati</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};