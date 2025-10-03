-- Add DELETE policies for conversations and messages tables
-- This allows users to permanently delete their conversations

-- Allow users to delete conversations they own
CREATE POLICY "Users can delete their own conversations"
ON public.conversations
FOR DELETE
TO authenticated
USING (auth.uid() = user_id OR auth.uid() = expert_id);

-- Improve messages delete policy (already exists but let's make sure it's correct)
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.messages;

CREATE POLICY "Users can delete messages in their conversations"
ON public.messages
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.id = messages.conversation_id
    AND (conversations.user_id = auth.uid() OR conversations.expert_id = auth.uid())
  )
);