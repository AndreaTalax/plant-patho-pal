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
import { MARCO_NIGRO_ID } from '@/components/phytopathologist';

// Load conversations from database
export const loadConversations = async (isMasterAccount: boolean, userId: string) => {
  try {
    // Validazione input
    if (!userId || typeof userId !== 'string') {
      console.error("Invalid userId provided");
      return [];
    }

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
    // Validazione input
    if (!userId || typeof userId !== 'string') {
      console.error("Invalid userId provided to findOrCreateConversation");
      return null;
    }

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
    // Validazione input
    if (!conversationId || typeof conversationId !== 'string') {
      console.error("Invalid conversationId provided");
      return [];
    }

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
  
  try {
    const serializedProducts = products.map(product => ({
      id: product.id?.toString() || '',
      name: product.name || '',
      price: typeof product.price === 'number' ? product.price : parseFloat(String(product.price) || '0'),
      description: product.description || '',
      image_url: product.image_url || ''
    }));
    
    return serializedProducts as unknown as Json;
  } catch (error) {
    console.error("Error converting products to JSON:", error);
    return null;
  }
};

// Fixed send message function with better error handling
export const sendMessage = async (
  conversationId: string,
  senderId: string,
  recipientId: string,
  text: string,
  products?: Product[]
) => {
  try {
    console.log(`💬 Sending message in conversation ${conversationId}`);
    console.log(`👤 From: ${senderId} → To: ${recipientId}`);

    // Validation
    if (!conversationId || !senderId || !recipientId || !text) {
      const errorMsg = "Missing required parameters for sendMessage";
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    const trimmedText = text.trim();
    if (trimmedText.length === 0) {
      throw new Error("Message text cannot be empty");
    }

    // For mock conversations, always return success
    if (conversationId === "mock-conversation-id") {
      console.log("📝 Mock conversation - returning success");
      return true;
    }

    // Prepare message data
    const messageData = {
      conversation_id: conversationId,
      sender_id: senderId,
      recipient_id: recipientId,
      text: trimmedText,
      products: convertProductsToJson(products),
      sent_at: new Date().toISOString(),
      read: false
    };

    console.log("📨 Inserting message data");

    // Insert message
    const { data, error } = await supabase
      .from('messages')
      .insert(messageData)
      .select()
      .single();

    if (error) {
      console.error("❌ Database error inserting message:", error);
      
      if (error.message.includes('row-level security')) {
        throw new Error('Permission denied: Cannot send message. Please check your authentication.');
      }
      
      throw new Error(`Database error: ${error.message}`);
    }

    console.log("✅ Message sent successfully:", data);

    // Update conversation timestamp (non-blocking)
    try {
      await supabase
        .from('conversations')
        .update({ 
          updated_at: new Date().toISOString(),
          last_message_text: trimmedText,
          last_message_at: new Date().toISOString()
        })
        .eq('id', conversationId);
    } catch (updateError) {
      console.warn("⚠️ Failed to update conversation timestamp:", updateError);
    }

    // Send notification (non-blocking)
    try {
      if (senderId === MARCO_NIGRO_ID && recipientId !== MARCO_NIGRO_ID) {
        console.log("📧 Expert sending notification to regular user");
        await supabase.functions.invoke('send-specialist-notification', {
          body: {
            conversation_id: conversationId,
            sender_id: senderId,
            recipient_id: recipientId,
            message_text: trimmedText
          }
        });
      } else if (senderId !== MARCO_NIGRO_ID && recipientId === MARCO_NIGRO_ID) {
        console.log("📧 Regular user sending notification to expert");
        await supabase.functions.invoke('send-specialist-notification', {
          body: {
            conversation_id: conversationId,
            sender_id: senderId,
            recipient_id: MARCO_NIGRO_ID,
            message_text: trimmedText
          }
        });
      }
    } catch (notificationError) {
      console.warn("⚠️ Failed to send notification:", notificationError);
    }

    return true;

  } catch (error) {
    console.error("❌ Unexpected error in sendMessage:", error);
    throw error;
  }
};

// Update conversation status (archive, block, unblock)
export const updateConversationStatus = async (conversationId: string, status: string) => {
  try {
    // Validazione input
    if (!conversationId || !status) {
      console.error("Missing required parameters for updateConversationStatus");
      return false;
    }

    const validStatuses = ['active', 'archived', 'blocked'];
    if (!validStatuses.includes(status)) {
      console.error("Invalid status provided:", status);
      return false;
    }

    const update = { 
      status,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('conversations')
      .update(update)
      .eq('id', conversationId);

    if (error) {
      console.error("Error updating conversation status:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in updateConversationStatus:", error);
    return false;
  }
};

// Convert database message to UI message
export const convertToUIMessage = (dbMessage: DatabaseMessage): Message => {
  try {
    return {
      id: dbMessage.id,
      sender: dbMessage.sender_id === EXPERT_ID ? 'expert' : 'user',
      text: dbMessage.text || '',
      time: new Date(dbMessage.sent_at).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      products: (dbMessage.products as unknown as Product[]) || undefined
    };
  } catch (error) {
    console.error("Error converting database message to UI message:", error);
    // Ritorna un messaggio di fallback
    return {
      id: dbMessage.id || 'unknown',
      sender: 'user',
      text: 'Error loading message',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      products: undefined
    };
  }
};
