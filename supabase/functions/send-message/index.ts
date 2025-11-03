import { createClient } from "[https://esm.sh/@supabase/supabase-js@2.49.4](https://esm.sh/@supabase/supabase-js@2.49.4)";

const supabaseClient = createClient(
Deno.env.get('SUPABASE_URL') ?? '',
Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

export async function sendMessage(conversationId: string, senderId: string, recipientId: string, text?: string, imageUrl?: string, products?: any, attachments?: any) {
try {
if (!conversationId || !recipientId || !text) {
throw new Error("Missing required fields: conversationId, recipientId, text");
}

```
// Controlla se la conversazione esiste
let { data: conversation } = await supabaseClient
  .from('conversations')
  .select('*')
  .eq('id', conversationId)
  .maybeSingle();

// Se non esiste, creala
if (!conversation) {
  const { data: newConversation, error: createError } = await supabaseClient
    .from('conversations')
    .insert({
      id: conversationId,
      user_id: senderId,
      expert_id: "07c7fe19-33c3-4782-b9a0-4e87c8aa7044",
      status: 'active',
      title: 'Consulenza esperto'
    })
    .select()
    .single();

  if (createError) throw createError;
  conversation = newConversation;
}

// Inserisci il messaggio
const { data: message, error: messageError } = await supabaseClient
  .from('messages')
  .insert({
    conversation_id: conversationId,
    sender_id: senderId,
    recipient_id: recipientId,
    text,
    content: text,
    image_url: imageUrl || null,
    products: products || null,
    metadata: {
      timestamp: new Date().toISOString(),
      messageType: imageUrl ? 'image' : (attachments ? 'attachment' : 'text'),
      attachments: attachments || null
    }
  })
  .select()
  .single();

if (messageError) throw messageError;

// Aggiorna la conversazione con ultimo messaggio
await supabaseClient
  .from('conversations')
  .update({
    last_message_text: text,
    last_message_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    status: 'active'
  })
  .eq('id', conversationId);

// Chiama funzione serverless per notifiche
const notificationResponse = await fetch(`${Deno.env.get('SUPABASE_FUNCTION_URL')}`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
  },
  body: JSON.stringify({ messageId: message.id })
});

const notificationResult = await notificationResponse.json();

return {
  success: true,
  message: 'Messaggio inviato e notifiche triggerate',
  messageData: message,
  conversationId,
  notificationResult
};
```

} catch (error) {
console.error('❌ Errore sendMessage:', error);
return { success: false, error: error.message };
}
}
