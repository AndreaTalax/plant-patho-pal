
import { 
  supabase, 
  EXPERT_ID, 
  DbMessage, 
  DbConversation,
  DbConversationInsert,
  DbMessageInsert,
  DbConversationUpdate
} from '@/integrations/supabase/client';
import {
  isNotNullOrUndefined,
  asUUID,
  asFilterValue,
  asDbInsert,
  asDbUpdate
} from '@/integrations/supabase/utils';
import type { 
  DatabaseConversation, 
  DatabaseMessage, 
  Message,
  Product,
  EXPERT
} from './types';
import { Json } from '@/integrations/supabase/types';

// Load conversations from database
export const loadConversations = async (isMasterAccount: boolean, userId: string) => {
  try {
    let query;
    
    if (isMasterAccount) {
      // Expert fetches all conversations where they're the expert
      query = supabase
        .from('conversations')
        .select('*, user:user_id(id, username, first_name, last_name)')
        .eq('expert_id', EXPERT_ID)
        .order('updated_at', { ascending: false });
    } else {
      // Regular users fetch their conversations
      query = supabase
        .from('conversations')
        .select('*, expert:expert_id(id, username, first_name, last_name)')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error("Error loading conversations:", error);
      return [];
    }
    
    return (data || []) as unknown as DatabaseConversation[];
  } catch (error) {
    console.error("Error in loadConversations:", error);
    return [];
  }
};

// Find or create conversation between user and expert
export const findOrCreateConversation = async (userId: string) => {
  try {
    // For testing accounts, create a mock conversation ID
    if (userId === "test@gmail.com" || userId === "test-user-id") {
      return {
        id: "mock-conversation-id",
        user_id: userId,
        expert_id: EXPERT_ID,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as DatabaseConversation;
    }
    
    // Check if conversation already exists
    const { data: existingConversations, error: fetchError } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .eq('expert_id', EXPERT_ID)
      .limit(1);
      
    if (fetchError) {
      console.error("Error fetching conversations:", fetchError);
      return null;
    }
    
    if (existingConversations && existingConversations.length > 0) {
      return existingConversations[0] as unknown as DatabaseConversation;
    }
    
    // Create new conversation
    const newConversationData = {
      user_id: userId,
      expert_id: EXPERT_ID,
      status: 'active'
    };
    
    const { data: newConversation, error: createError } = await supabase
      .from('conversations')
      .insert(newConversationData)
      .select()
      .single();
      
    if (createError) {
      console.error("Error creating conversation:", createError);
      return null;
    }
    
    return newConversation as unknown as DatabaseConversation;
  } catch (error) {
    console.error("Error in findOrCreateConversation:", error);
    return null;
  }
};

// Load messages for a specific conversation
export const loadMessages = async (conversationId: string) => {
  try {
    // For mock conversations, return empty array
    if (conversationId === "mock-conversation-id") {
      return [];
    }
    
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('sent_at', { ascending: true });
      
    if (error) {
      console.error("Error loading messages:", error);
      return [];
    }
    
    return (data || []) as unknown as DatabaseMessage[];
  } catch (error) {
    console.error("Error in loadMessages:", error);
    return [];
  }
};

// Convert product array to Json type
const convertProductsToJson = (products?: Product[]): Json => {
  if (!products || products.length === 0) return null;
  
  return products as unknown as Json;
};

// Send a message
export const sendMessage = async (
  conversationId: string, 
  senderId: string, 
  recipientId: string, 
  text: string,
  products?: Product[]
) => {
  console.log(`Sending message in conversation ${conversationId}: ${text}`);
  console.log(`Sender ID: ${senderId}, Recipient ID: ${recipientId}`);
  
  // For mock conversations, always return success
  if (conversationId === "mock-conversation-id") {
    return true;
  }
  
  const messageData = {
    conversation_id: conversationId,
    sender_id: senderId,
    recipient_id: recipientId,
    text,
    products: convertProductsToJson(products)
  };
  
  const { error } = await supabase
    .from('messages')
    .insert(messageData);
  
  if (error) {
    console.error("Error sending message:", error);
    return false;
  }

  // Invia notifica quando:
  // 1. Il mittente è un utente normale (non l'esperto) E il destinatario è l'esperto
  // 2. Il mittente è l'esperto E il destinatario è un utente normale
  if (senderId === EXPERT_ID && recipientId !== EXPERT_ID) {
    // Esperto che scrive a utente normale
    console.log("Expert sending notification to regular user");
    try {
      await supabase.functions.invoke('send-specialist-notification', {
        body: {
          conversation_id: conversationId,
          sender_id: senderId,
          recipient_id: recipientId,
          message_text: text
        }
      });
    } catch (notificationError) {
      console.error("Error sending expert notification to user:", notificationError);
      // Continuiamo anche se la notifica fallisce
    }
  } 
  else if (senderId !== EXPERT_ID && recipientId === EXPERT_ID) {
    // Utente normale che scrive all'esperto
    console.log("Regular user sending notification to expert");
    try {
      await supabase.functions.invoke('send-specialist-notification', {
        body: {
          conversation_id: conversationId,
          sender_id: senderId,
          recipient_id: recipientId,
          message_text: text
        }
      });
    } catch (notificationError) {
      console.error("Error sending user notification to expert:", notificationError);
      // Continuiamo anche se la notifica fallisce
    }
  }
    
  return true;
};

// Update conversation status (archive, block, unblock)
export const updateConversationStatus = async (conversationId: string, status: string) => {
  const update = { status };
  
  const { error } = await supabase
    .from('conversations')
    .update(update)
    .eq('id', conversationId);
    
  return !error;
};

// Convert database message to UI message
export const convertToUIMessage = (dbMessage: DatabaseMessage): Message => {
  return {
    id: dbMessage.id,
    sender: dbMessage.sender_id === EXPERT_ID ? 'expert' : 'user',
    text: dbMessage.text,
    time: new Date(dbMessage.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    products: dbMessage.products as unknown as Product[] || undefined
  };
};
