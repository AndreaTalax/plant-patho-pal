import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DatabaseMessage } from "@/services/chat/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft, Loader2, Send, AlertCircle,
  RefreshCw, MessageCircleOff
} from "lucide-react";
import { toast } from "sonner";
import { useRealtimeChat } from "@/hooks/useRealtimeChat";
import { MARCO_NIGRO_ID } from "@/components/phytopathologist";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ConversationService } from "@/services/chat/conversationService";
import { MessageService } from "@/services/chat/messageService";

const ExpertChatDetailView = ({ conversation, onBack }: {
  conversation: any;
  onBack: () => void;
}) => {
  const [messages, setMessages] = useState<DatabaseMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [conversationDeleted, setConversationDeleted] = useState(false);
  const [conversationArchived, setConversationArchived] = useState(false);

  const { isConnected, sendMessage } = useRealtimeChat({
    conversationId: conversation?.id,
    userId: MARCO_NIGRO_ID,
    onNewMessage: useCallback((message) => {
      setMessages(prev => {
        if (prev.some(msg => msg.id === message.id)) return prev;
        return [...prev, message];
      });
    }, [])
  });

  useEffect(() => {
    let isMounted = true;

    const loadMessages = async () => {
      if (!conversation?.id) {
        setError("ID conversazione mancante");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      setConversationDeleted(false);
      setConversationArchived(false);

      try {
        const conversationData = await ConversationService.getConversation(conversation.id);

        if (!conversationData) {
          setConversationDeleted(true);
          setError("Questa conversazione è stata eliminata");
          return;
        }

        if (conversationData?.is_archived) {
          setConversationArchived(true);
        }

        const messagesData = await MessageService.loadMessages(conversation.id);

        if (!isMounted) return;

        setMessages(messagesData || []);
      } catch (e: any) {
        if (!isMounted) return;

        if (e?.message?.includes("not found") || e?.message?.includes("deleted")) {
          setConversationDeleted(true);
          setError("Conversazione non trovata o eliminata");
        } else {
          setError(e?.message || "Errore nel caricamento della chat");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadMessages();

    return () => {
      isMounted = false;
    };
  }, [conversation?.id]);

  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() || sending || conversationDeleted || conversationArchived) {
      if (conversationDeleted) {
        toast.error("Impossibile inviare messaggi: conversazione eliminata");
      } else if (conversationArchived) {
        toast.warning("Questa conversazione è archiviata: non puoi inviare nuovi messaggi");
      }
      return;
    }

    try {
      setSending(true);
      await sendMessage(conversation.user_id, newMessage.trim());
      setNewMessage("");
      toast.success("Messaggio inviato!");
    } catch (error: any) {
      toast.error("Errore nell'invio del messaggio");
    } finally {
      setSending(false);
    }
  }, [newMessage, sending, sendMessage, conversation.user_id, conversationDeleted, conversationArchived]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    setConversationDeleted(false);
    setConversationArchived(false);
  };

  const handleGoBack = () => {
    onBack();
  };

  if (!conversation?.id) {
    return (
      <div className="max-w-2xl mx-auto mt-6 bg-white/95 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center mb-4">
          <Button variant="ghost" onClick={handleGoBack} className="mr-2">
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
          <Button variant="ghost" onClick={handleGoBack} className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-xl font-bold">
              Chat con: {conversation.user_profile
                ? `${conversation.user_profile.first_name || ""} ${conversation.user_profile.last_name || ""}`.trim()
                : "Utente"}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <div className={`w-2 h-2 rounded-full ${!conversationDeleted && isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-gray-500">
                {conversationDeleted
                  ? 'Conversazione eliminata'
                  : conversationArchived
                    ? 'Conversazione archiviata'
                    : isConnected
                      ? 'Connesso'
                      : 'Non connesso'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {conversationDeleted && (
        <Alert variant="destructive" className="mb-4">
          <MessageCircleOff className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium">Conversazione eliminata</div>
            <div className="text-sm mt-1">
              Questa conversazione è stata eliminata e non è più disponibile per nuove interazioni.
            </div>
          </AlertDescription>
        </Alert>
      )}

      {conversationArchived && !conversationDeleted && (
        <Alert variant="default" className="mb-4">
          <MessageCircleOff className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium">Conversazione archiviata</div>
            <div className="text-sm mt-1">
              Non è possibile inviare nuovi messaggi in una conversazione archiviata.
            </div>
          </AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="h-6 w-6 animate-spin text-drplant-green" />
          <span className="ml-2 text-gray-600">Caricamento messaggi...</span>
        </div>
      ) : error ? (
        <div className="flex flex-col justify-center items-center h-40 gap-4">
          <Alert variant={conversationDeleted ? "destructive" : "default"} className="w-full">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="flex gap-2">
            {!conversationDeleted && (
              <Button onClick={handleRetry} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Riprova
              </Button>
            )}
            <Button onClick={handleGoBack} variant="ghost">
              <ArrowLeft className="h-4 w-4 mr-2" />
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
              <div className="text-center text-gray-400">
                {conversationDeleted
                  ? "Conversazione eliminata"
                  : conversationArchived
                    ? "Conversazione archiviata - nessun messaggio disponibile"
                    : "Nessun messaggio"}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                conversationDeleted
                  ? "Conversazione eliminata"
                  : conversationArchived
                    ? "Conversazione archiviata"
                    : "Scrivi un messaggio..."
              }
              disabled={sending || !isConnected || conversationDeleted || conversationArchived}
              className={`flex-1 ${conversationDeleted || conversationArchived
                ? 'bg-gray-100 border-gray-200 text-gray-500 placeholder-gray-400'
                : ''}`}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sending || !isConnected || conversationDeleted || conversationArchived}
              size="icon"
              className={(conversationDeleted || conversationArchived)
                ? 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed'
                : ''}
            >
              {sending
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Send className="h-4 w-4" />}
            </Button>
          </div>

          {(conversationDeleted || conversationArchived) && (
            <div className="mt-2 text-center">
              <span className="text-sm text-yellow-700 bg-yellow-50 px-3 py-1 rounded-full">
                ⚠️ {conversationDeleted
                  ? "Impossibile inviare messaggi in una conversazione eliminata"
                  : "Impossibile inviare messaggi in una conversazione archiviata"}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ExpertChatDetailView;
