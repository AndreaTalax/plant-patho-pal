
import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DatabaseMessage } from "@/services/chat/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Loader2, Send, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useRealtimeChat } from "@/hooks/useRealtimeChat";
import { MARCO_NIGRO_ID } from "@/components/phytopathologist";
import { Alert, AlertDescription } from "@/components/ui/alert";

/**
 * Dettaglio Chat Esperto (singola conversazione) con messaggistica real-time
 */
const ExpertChatDetailView = ({ conversation, onBack }: {
  conversation: any;
  onBack: () => void;
}) => {
  const [messages, setMessages] = useState<DatabaseMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);

  // Setup real-time chat
  const { isConnected, sendMessage } = useRealtimeChat({
    conversationId: conversation?.id,
    userId: MARCO_NIGRO_ID,
    onNewMessage: (message) => {
      setMessages(prev => {
        // Avoid duplicates
        const exists = prev.some(msg => msg.id === message.id);
        if (exists) return prev;
        return [...prev, message];
      });
    }
  });

  // Carica messaggi della conversazione
  useEffect(() => {
    let isMounted = true; // Previene aggiornamenti se il componente è smontato

    const loadMessages = async () => {
      if (!conversation?.id) {
        setError("ID conversazione mancante");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        console.log('🔄 Loading conversation messages for:', conversation.id);
        
        // Verifica sessione
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw new Error(`Errore sessione: ${sessionError.message}`);
        }
        
        if (!session) {
          throw new Error('Sessione scaduta, effettua di nuovo il login');
        }
        
        console.log('📤 Calling get-conversation function...');
        
        const response = await supabase.functions.invoke('get-conversation', {
          body: { conversationId: conversation.id }
        });

        console.log('📨 Response received:', {
          hasData: !!response.data,
          hasError: !!response.error
        });

        if (response.error) {
          console.error('❌ Function error:', response.error);
          
          // Gestione specifica per conversazione eliminata - controlla il messaggio di errore
          if (response.error.message?.includes("not found") || 
              response.error.message?.includes("deleted") ||
              response.error.message?.includes("Conversation not found or has been deleted")) {
            console.log('🗑️ Conversation was deleted, going back');
            toast.error('Questa conversazione è stata eliminata');
            onBack(); // Torna automaticamente alla lista
            return;
          }
          
          throw new Error(response.error.message || "Errore nel caricamento messaggi");
        }

        // Controlla se il componente è ancora montato prima di aggiornare lo stato
        if (!isMounted) return;

        if (response.data?.messages) {
          console.log('✅ Messages loaded:', response.data.messages.length);
          setMessages(response.data.messages);
        } else {
          console.log('📭 No messages found');
          setMessages([]);
        }

      } catch (e: any) {
        console.error('❌ Error in loadMessages:', e);
        
        // Controlla se il componente è ancora montato prima di aggiornare lo stato
        if (!isMounted) return;
        
        // Gestisci specificamente l'errore "conversazione non trovata"
        if (e?.message?.includes("PGRST116") || 
            e?.message?.includes("0 rows") ||
            e?.message?.includes("not found") ||
            e?.message?.includes("deleted")) {
          console.log('🗑️ Conversation not found, probably deleted');
          toast.error('Conversazione non trovata o eliminata');
          onBack(); // Torna automaticamente alla lista
          return;
        } else {
          setError(e?.message || "Errore nel caricamento della chat");
          toast.error(e?.message || "Errore caricamento chat");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadMessages();

    // Cleanup function per prevenire memory leaks
    return () => {
      isMounted = false;
    };
  }, [conversation?.id, onBack]); // Aggiungo onBack alle dipendenze

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      await sendMessage(conversation.user_id, newMessage.trim());
      setNewMessage("");
      toast.success("Messaggio inviato!");
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast.error("Errore nell'invio del messaggio");
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleRetry = () => {
    console.log('🔄 Retry button clicked - reloading messages...');
    // Forza il reload resettando lo stato e richiamando useEffect
    setLoading(true);
    setError(null);
    // useEffect si riattiva automaticamente quando cambia lo stato
  };

  // Se non abbiamo un ID conversazione valido
  if (!conversation?.id) {
    return (
      <div className="max-w-2xl mx-auto mt-6 bg-white/95 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center mb-4">
          <Button variant="ghost" onClick={onBack} className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-xl font-bold">Errore</h2>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Dati della conversazione non validi. Torna indietro e riprova.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto mt-6 bg-white/95 rounded-2xl p-6 shadow-lg">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" onClick={onBack} className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-xl font-bold">Chat con: {conversation.user_profile
              ? `${conversation.user_profile.first_name || ""} ${conversation.user_profile.last_name || ""}`.trim()
              : "Utente"}</h2>
            <div className="flex items-center gap-2 mt-1">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-gray-500">
                {isConnected ? 'Connesso' : 'Non connesso'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-drplant-green" />
            <span className="text-gray-600">Caricamento messaggi...</span>
          </div>
        </div>
      ) : error ? (
        <div className="flex flex-col justify-center items-center h-40 gap-4">
          <Alert variant="destructive" className="w-full">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="flex gap-2">
            <Button onClick={handleRetry} variant="outline">
              Riprova
            </Button>
            <Button onClick={onBack} variant="ghost">
              Torna alla lista
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="h-80 overflow-y-auto space-y-4 px-2 mb-4">
            {messages.length > 0 ? messages.map(m => (
              <div
                key={m.id}
                className={`p-3 rounded-xl max-w-[80%] ${m.sender_id === conversation.user_id
                    ? "bg-drplant-green/10 text-left ml-0 mr-auto"
                    : "bg-blue-100/80 text-right ml-auto mr-0"
                  }`}
              >
                <div className="text-xs text-gray-500 mb-1">
                  {m.sender_id === conversation.user_id ? "Utente" : "Marco Nigro"}
                  <span className="ml-2">
                    {new Date(m.sent_at).toLocaleTimeString('it-IT', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
                <div className="font-medium">{m.text || m.content}</div>
                {m.image_url && (
                  <img src={m.image_url} alt="Allegato" className="mt-2 max-h-24 rounded-lg" />
                )}
              </div>
            )) : (
              <div className="text-center text-gray-400">Nessun messaggio</div>
            )}
          </div>

          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Scrivi un messaggio..."
              disabled={sending || !isConnected}
              className="flex-1"
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sending || !isConnected}
              size="icon"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default ExpertChatDetailView;
