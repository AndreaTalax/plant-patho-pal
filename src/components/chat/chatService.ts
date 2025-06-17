
import { supabase } from '@/integrations/supabase/client';
import { Message, DatabaseMessage, DatabaseConversation } from './types';

export const loadMessages = async (conversationId: string): Promise<DatabaseMessage[]> => {
  try {
    console.log('📚 Loading messages for conversation:', conversationId);
    
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

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
    time: new Date(dbMessage.created_at).toLocaleTimeString([], { 
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
  imageUrl?: string
): Promise<boolean> => {
  try {
    console.log('📤 Sending message via Supabase function:', {
      conversationId,
      senderId,
      recipientId,
      textLength: text?.length || 0,
      hasImage: !!imageUrl
    });

    // Get the current session to ensure we have a valid token
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
        imageUrl
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
