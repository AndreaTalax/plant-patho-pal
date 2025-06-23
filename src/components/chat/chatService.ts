
import { supabase } from '@/integrations/supabase/client';
import { Message, DatabaseMessage, DatabaseConversation } from './types';

// Rate limiting map
const rateLimitMap = new Map<string, number>();

const canMakeRequest = (key: string, minInterval: number = 1000) => {
  const now = Date.now();
  const lastRequest = rateLimitMap.get(key) || 0;
  if (now - lastRequest < minInterval) {
    console.log(`⏳ Rate limiting ${key}, skipping request`);
    return false;
  }
  rateLimitMap.set(key, now);
  return true;
};

export const loadMessages = async (conversationId: string): Promise<DatabaseMessage[]> => {
  try {
    // Rate limit message loading
    if (!canMakeRequest(`load-messages-${conversationId}`, 2000)) {
      throw new Error('Rate limited - too many requests');
    }

    console.log('📚 Loading messages for conversation:', conversationId);
    
    // Add request timeout using Promise.race
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 8000);
    });
    
    const queryPromise = supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('sent_at', { ascending: true });

    const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

    if (error) {
      console.error('❌ Error loading messages:', error);
      throw error;
    }

    console.log('✅ Messages loaded successfully:', data?.length || 0);
    return data || [];
  } catch (error) {
    if (error.message === 'Request timeout') {
      console.error('❌ Request timeout loading messages');
      throw new Error('Request timeout');
    }
    console.error('❌ Error in loadMessages:', error);
    throw error;
  }
};

export const convertToUIMessage = (dbMessage: DatabaseMessage): Message => {
  return {
    id: dbMessage.id,
    sender: dbMessage.sender_id === dbMessage.recipient_id ? 'expert' : 
           (dbMessage.sender_id ? 'user' : 'expert'),
    text: dbMessage.content || dbMessage.text || '',
    time: new Date(dbMessage.sent_at).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
    image_url: dbMessage.image_url || undefined,
    products: dbMessage.products || undefined
  };
};

export const sendMessage = async (
  conversationId: string,
  senderId: string,
  recipientId: string,
  text: string,
  imageUrl?: string,
  products?: any
): Promise<boolean> => {
  try {
    // Rate limit message sending
    if (!canMakeRequest(`send-message-${conversationId}`, 1000)) {
      throw new Error('Rate limited - sending too fast');
    }

    console.log('📤 Sending message via Supabase function:', {
      conversationId,
      senderId,
      recipientId,
      textLength: text?.length || 0,
      hasImage: !!imageUrl,
      hasProducts: !!products
    });

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.error('❌ No valid session found:', sessionError);
      throw new Error('User not authenticated');
    }

    // Add request timeout using Promise.race
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 10000);
    });

    const functionPromise = supabase.functions.invoke('send-message', {
      body: {
        conversationId,
        recipientId,
        text,
        imageUrl,
        products
      }
    });

    const { data, error } = await Promise.race([functionPromise, timeoutPromise]);

    if (error) {
      console.error('❌ Error from send-message function:', error);
      throw error;
    }

    console.log('✅ Message sent successfully:', data);
    return true;
  } catch (error) {
    if (error.message === 'Request timeout') {
      console.error('❌ Request timeout sending message');
      throw new Error('Request timeout');
    }
    console.error('❌ Error in sendMessage:', error);
    throw error;
  }
};

// Load conversations for expert view with rate limiting
export const loadConversations = async (expertId: string): Promise<DatabaseConversation[]> => {
  try {
    // Rate limit conversation loading
    if (!canMakeRequest(`load-conversations-${expertId}`, 3000)) {
      throw new Error('Rate limited - too many requests');
    }

    console.log('📚 Loading conversations for expert:', expertId);
    
    // Add request timeout using Promise.race
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 10000);
    });
    
    // Get conversations
    const queryPromise = supabase
      .from('conversations')
      .select('*')
      .eq('expert_id', expertId)
      .eq('status', 'active')
      .order('updated_at', { ascending: false });

    const { data: conversationsData, error: conversationsError } = await Promise.race([queryPromise, timeoutPromise]);

    if (conversationsError) {
      console.error('❌ Error loading conversations:', conversationsError);
      throw conversationsError;
    }

    console.log('✅ Conversations loaded successfully:', conversationsData?.length || 0);

    // Load user profiles with rate limiting
    const conversationsWithProfiles = await Promise.all(
      (conversationsData || []).map(async (conversation) => {
        // Rate limit profile loading
        if (!canMakeRequest(`load-profile-${conversation.user_id}`, 5000)) {
          return {
            ...conversation,
            user: undefined,
            user_profile: null
          };
        }

        try {
          const profileTimeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Profile timeout')), 5000);
          });

          const profileQueryPromise = supabase
            .from('profiles')
            .select('id, username, first_name, last_name, is_online, last_seen_at')
            .eq('id', conversation.user_id)
            .single();

          const { data: userProfile, error: profileError } = await Promise.race([profileQueryPromise, profileTimeoutPromise]);

          if (profileError) {
            console.error('⚠️ Error loading user profile:', profileError);
            return {
              ...conversation,
              user: undefined,
              user_profile: null
            };
          }

          return {
            ...conversation,
            user: userProfile,
            user_profile: userProfile
          };
        } catch (error) {
          console.error('⚠️ Error in profile loading:', error);
          return {
            ...conversation,
            user: undefined,
            user_profile: null
          };
        }
      })
    );

    return conversationsWithProfiles;
  } catch (error) {
    if (error.message === 'Request timeout') {
      console.error('❌ Request timeout loading conversations');
      throw new Error('Request timeout');
    }
    console.error('❌ Error in loadConversations:', error);
    throw error;
  }
};

// Find or create conversation for user with rate limiting
export const findOrCreateConversation = async (userId: string, expertId?: string): Promise<DatabaseConversation | null> => {
  try {
    const targetExpertId = expertId || (await import('@/integrations/supabase/client')).EXPERT_ID;
    
    // Rate limit conversation operations
    if (!canMakeRequest(`find-create-conversation-${userId}`, 3000)) {
      throw new Error('Rate limited - too many requests');
    }

    console.log('🔍 Finding or creating conversation:', { userId, expertId: targetExpertId });

    // Add request timeout using Promise.race
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 8000);
    });

    // First, try to find existing conversation
    const findQueryPromise = supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .eq('expert_id', targetExpertId)
      .eq('status', 'active')
      .single();

    const { data: existing, error: findError } = await Promise.race([findQueryPromise, timeoutPromise]);

    if (findError && findError.code !== 'PGRST116') {
      console.error('❌ Error finding conversation:', findError);
      throw findError;
    }

    if (existing) {
      console.log('✅ Found existing conversation:', existing.id);
      return existing;
    }

    // Create new conversation with timeout
    const createTimeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 8000);
    });

    const createQueryPromise = supabase
      .from('conversations')
      .insert({
        user_id: userId,
        expert_id: targetExpertId,
        title: 'Consulenza esperto',
        status: 'active'
      })
      .select()
      .single();

    const { data: newConversation, error: createError } = await Promise.race([createQueryPromise, createTimeoutPromise]);

    if (createError) {
      console.error('❌ Error creating conversation:', createError);
      throw createError;
    }

    console.log('✅ Created new conversation:', newConversation.id);
    return newConversation;
  } catch (error) {
    if (error.message === 'Request timeout') {
      console.error('❌ Request timeout in findOrCreateConversation');
      throw new Error('Request timeout');
    }
    console.error('❌ Error in findOrCreateConversation:', error);
    return null;
  }
};

// Update conversation status with rate limiting
export const updateConversationStatus = async (conversationId: string, status: string): Promise<boolean> => {
  try {
    // Rate limit status updates
    if (!canMakeRequest(`update-status-${conversationId}`, 2000)) {
      console.log('⏳ Rate limiting status update');
      return false;
    }

    console.log('🔄 Updating conversation status:', { conversationId, status });

    // Add request timeout using Promise.race
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 5000);
    });

    const updateQueryPromise = supabase
      .from('conversations')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    const { error } = await Promise.race([updateQueryPromise, timeoutPromise]);

    if (error) {
      console.error('❌ Error updating conversation status:', error);
      return false;
    }

    console.log('✅ Conversation status updated successfully');
    return true;
  } catch (error) {
    if (error.message === 'Request timeout') {
      console.error('❌ Request timeout updating conversation status');
    } else {
      console.error('❌ Error in updateConversationStatus:', error);
    }
    return false;
  }
};
