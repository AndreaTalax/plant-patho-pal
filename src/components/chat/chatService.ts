
import { 
  supabase, 
  EXPERT_ID, 
  isNotNullOrUndefined, 
  asUUID, 
  DbMessage, 
  DbConversation 
} from '@/integrations/supabase/client';
import type { 
  DatabaseConversation, 
  DatabaseMessage, 
  Message,
  Product
} from './types';

// Load conversations from database
export const loadConversations = async (isMasterAccount: boolean, userId: string) => {
  try {
    let query;
    
    if (isMasterAccount) {
      // Expert fetches all conversations where they're the expert
      query = supabase
        .from('conversations')
        .select('*, user:profiles!conversations_user_id_fkey(id, username, first_name, last_name)')
        .eq('expert_id', asUUID(EXPERT_ID))
        .order('updated_at', { ascending: false });
    } else {
      // Regular users fetch their conversations
      query = supabase
        .from('conversations')
        .select('*, expert:profiles!conversations_expert_id_fkey(id, username, first_name, last_name)')
        .eq('user_id', asUUID(userId))
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
    // Check if conversation already exists
    const { data: existingConversations, error: fetchError } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', asUUID(userId))
      .eq('expert_id', asUUID(EXPERT_ID))
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
      user_id: userId as any,
      expert_id: EXPERT_ID as any,
      status: 'active'
    };
    
    const { data: newConversation, error: createError } = await supabase
      .from('conversations')
      .insert(newConversationData as any)
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
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', asUUID(conversationId))
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

// Send a message
export const sendMessage = async (
  conversationId: string, 
  senderId: string, 
  recipientId: string, 
  text: string,
  products?: Product[]
) => {
  const messageData: DbMessageInsert = {
    conversation_id: conversationId as any,
    sender_id: senderId as any,
    recipient_id: recipientId as any,
    text,
    products: products || null
  };
  
  const { error } = await supabase
    .from('messages')
    .insert(messageData as any);
    
  return !error;
};

// Update conversation status (archive, block, unblock)
export const updateConversationStatus = async (conversationId: string, status: string) => {
  const update: DbConversationUpdate = { status };
  
  const { error } = await supabase
    .from('conversations')
    .update(update as any)
    .eq('id', asUUID(conversationId));
    
  return !error;
};

// Convert database message to UI message
export const convertToUIMessage = (dbMessage: DatabaseMessage): Message => {
  return {
    id: dbMessage.id,
    sender: dbMessage.sender_id === EXPERT_ID ? 'expert' : 'user',
    text: dbMessage.text,
    time: new Date(dbMessage.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    products: dbMessage.products || undefined
  };
};
