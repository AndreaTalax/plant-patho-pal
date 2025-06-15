
import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DatabaseMessage } from "@/services/chat/types";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

/**
 * Dettaglio Chat Esperto (singola conversazione)
 */
const ExpertChatDetailView = ({ conversation, onBack }: {
  conversation: any;
  onBack: () => void;
}) => {
  const [messages, setMessages] = useState<DatabaseMessage[]>([]);
  const [loading, setLoading] = useState(true);

  // Carica messaggi della conversazione (usando edge function già pronta)
  useEffect(() => {
    const loadMessages = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          toast.error('Sessione scaduta, effettua di nuovo il login');
          return;
        }
        // API edge function
        const res = await fetch(
          `https://otdmqmpxukifoxjlgzmq.supabase.co/functions/v1/get-conversation/${conversation.id}`,
          {
            method: "GET",
            headers: { Authorization: `Bearer ${session.access_token}` },
          }
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Errore nel caricamento messaggi");
        setMessages(data.messages || []);
      } catch (e: any) {
        toast.error(e?.message || "Errore caricamento chat");
      }
      setLoading(false);
    };
    if (conversation?.id) loadMessages();
  }, [conversation]);

  return (
    <div className="max-w-2xl mx-auto mt-6 bg-white/95 rounded-2xl p-6 shadow-lg">
      <div className="mb-4 flex items-center">
        <Button variant="ghost" onClick={onBack} className="mr-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-xl font-bold">Chat con: {conversation.user_profile
          ? `${conversation.user_profile.first_name || ""} ${conversation.user_profile.last_name || ""}`.trim()
          : "Utente"}</h2>
      </div>
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="animate-spin h-6 w-6 text-gray-500" />
        </div>
      ) : (
        <div className="h-80 overflow-y-auto space-y-4 px-2">
          {messages.length > 0 ? messages.map(m => (
            <div
              key={m.id}
              className={`p-3 rounded-xl ${m.sender_id === conversation.user_id
                  ? "bg-drplant-green/10 text-left"
                  : "bg-blue-100/80 text-right"
                }`}
            >
              <div className="text-xs text-gray-500">{m.sender_id === conversation.user_id ? "Utente" : "Esperto"}</div>
              <div className="mt-1 font-medium">{m.text}</div>
              {m.image_url &&
                <img src={m.image_url} alt="Allegato" className="mt-1 max-h-24 rounded-lg" />
              }
            </div>
          )) : (
            <div className="text-center text-gray-400">Nessun messaggio</div>
          )}
        </div>
      )}
      {/* Qui potresti aggiungere input per rispondere, invio allegati, ecc */}
    </div>
  );
};
export default ExpertChatDetailView;
