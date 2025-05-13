
// Trigger for update_conversation_last_message
// This Edge Function simulates creating a trigger in Supabase
// In a real environment, you would create this directly in SQL
// with CREATE TRIGGER rather than an Edge Function.

/**
 * SQL equivalent:
 * 
 * CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
 * RETURNS TRIGGER AS $$
 * BEGIN
 *   UPDATE public.conversations
 *   SET last_message_text = NEW.text,
 *       last_message_timestamp = NEW.sent_at,
 *       updated_at = NEW.sent_at
 *   WHERE id = NEW.conversation_id;
 *   
 *   RETURN NEW;
 * END;
 * $$ LANGUAGE plpgsql;
 * 
 * DROP TRIGGER IF EXISTS update_conversation_last_message_trigger ON public.messages;
 * 
 * CREATE TRIGGER update_conversation_last_message_trigger
 * AFTER INSERT ON public.messages
 * FOR EACH ROW
 * EXECUTE FUNCTION public.update_conversation_last_message();
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  return new Response(
    JSON.stringify({
      message: "Questa è solo una funzione informativa. Il trigger deve essere creato direttamente nel database Supabase.",
      sql: `
CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations
  SET last_message_text = NEW.text,
      last_message_timestamp = NEW.sent_at,
      updated_at = NEW.sent_at
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_conversation_last_message_trigger ON public.messages;

CREATE TRIGGER update_conversation_last_message_trigger
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.update_conversation_last_message();
      `
    }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    },
  );
});
