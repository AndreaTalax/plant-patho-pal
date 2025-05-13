
import { 
  supabase, 
  EXPERT_ID, 
  isNotNullOrUndefined, 
  asUUID, 
  DbMessage, 
  DbConversation,
  DbConversationInsert,
  DbMessageInsert,
  DbConversationUpdate,
  asFilterValue,
  asDbInsert,
  asDbUpdate
} from '@/integrations/supabase/client';
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
        .select('*, user:profiles!conversations_user_id_fkey(id, username, first_name, last_name)')
        .eq('expert_id', EXPERT_ID)
        .order('updated_at', { ascending: false });
    } else {
      // Regular users fetch their conversations
      query = supabase
        .from('conversations')
        .select('*, expert:profiles!conversations_expert_id_fkey(id, username, first_name, last_name)')
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
    const newConversationData: DbConversationInsert = {
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
  // For mock conversations, always return success
  if (conversationId === "mock-conversation-id") {
    return true;
  }
  
  const messageData: DbMessageInsert = {
    conversation_id: conversationId,
    sender_id: senderId,
    recipient_id: recipientId,
    text,
    products: convertProductsToJson(products)
  };
  
  const { error } = await supabase
    .from('messages')
    .insert(messageData);
    
  return !error;
};

// Update conversation status (archive, block, unblock)
export const updateConversationStatus = async (conversationId: string, status: string) => {
  const update: DbConversationUpdate = { status };
  
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
