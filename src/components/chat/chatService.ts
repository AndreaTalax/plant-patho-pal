
import { supabase } from '@/integrations/supabase/client';
import { Message, DatabaseMessage, DatabaseConversation } from './types';

export const loadMessages = async (conversationId: string): Promise<DatabaseMessage[]> => {
  try {
    console.log('📚 Loading messages for conversation:', conversationId);
    
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('sent_at', { ascending: true });

    if (error) {
      console.error('❌ Error loading messages:', error);
      throw error;
    }

    console.log('✅ Messages loaded successfully:', data?.length || 0);
    return data || [];
  } catch (error) {
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

    const { data, error } = await supabase.functions.invoke('send-message', {
      body: {
        conversationId,
        recipientId,
        text,
        imageUrl,
        products
      }
    });

    if (error) {
      console.error('❌ Error from send-message function:', error);
      throw error;
    }

    console.log('✅ Message sent successfully:', data);
    return true;
  } catch (error) {
    console.error('❌ Error in sendMessage:', error);
    throw error;
  }
};

// Load conversations for expert view with user presence
export const loadConversations = async (expertId: string): Promise<DatabaseConversation[]> => {
  try {
    console.log('📚 Loading conversations for expert:', expertId);
    
    // Get conversations
    const { data: conversationsData, error: conversationsError } = await supabase
      .from('conversations')
      .select('*')
      .eq('expert_id', expertId)
      .eq('status', 'active')
      .order('updated_at', { ascending: false });

    if (conversationsError) {
      console.error('❌ Error loading conversations:', conversationsError);
      throw conversationsError;
    }

    console.log('✅ Conversations loaded successfully:', conversationsData?.length || 0);

    // Get user profiles with online status
    const conversationsWithProfiles = await Promise.all(
      (conversationsData || []).map(async (conversation) => {
        const { data: userProfile, error: profileError } = await supabase
          .from('profiles')
          .select('id, username, first_name, last_name, is_online, last_seen_at')
          .eq('id', conversation.user_id)
          .single();

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
      })
    );

    return conversationsWithProfiles;
  } catch (error) {
    console.error('❌ Error in loadConversations:', error);
    throw error;
  }
};

// Find or create conversation for user
export const findOrCreateConversation = async (userId: string, expertId?: string): Promise<DatabaseConversation | null> => {
  try {
    const targetExpertId = expertId || (await import('@/integrations/supabase/client')).EXPERT_ID;
    console.log('🔍 Finding or creating conversation:', { userId, expertId: targetExpertId });

    // First, try to find existing conversation
    const { data: existing, error: findError } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .eq('expert_id', targetExpertId)
      .eq('status', 'active')
      .single();

    if (findError && findError.code !== 'PGRST116') {
      console.error('❌ Error finding conversation:', findError);
      throw findError;
    }

    if (existing) {
      console.log('✅ Found existing conversation:', existing.id);
      return existing;
    }

    // Create new conversation
    const { data: newConversation, error: createError } = await supabase
      .from('conversations')
      .insert({
        user_id: userId,
        expert_id: targetExpertId,
        title: 'Consulenza esperto',
        status: 'active'
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ Error creating conversation:', createError);
      throw createError;
    }

    console.log('✅ Created new conversation:', newConversation.id);
    return newConversation;
  } catch (error) {
    console.error('❌ Error in findOrCreateConversation:', error);
    return null;
  }
};

// Update conversation status
export const updateConversationStatus = async (conversationId: string, status: string): Promise<boolean> => {
  try {
    console.log('🔄 Updating conversation status:', { conversationId, status });

    const { error } = await supabase
      .from('conversations')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    if (error) {
      console.error('❌ Error updating conversation status:', error);
      return false;
    }

    console.log('✅ Conversation status updated successfully');
    return true;
  } catch (error) {
    console.error('❌ Error in updateConversationStatus:', error);
    return false;
  }
};
