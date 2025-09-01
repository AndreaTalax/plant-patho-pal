
import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface VoiceMessageOptions {
  conversationId: string;
  senderId: string;
  recipientId: string;
  onSend?: (audioUrl: string) => void;
}

export const useEnhancedChat = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Voice message recording
  const startVoiceRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      });

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }

      // Start recording timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error starting voice recording:', error);
      toast.error('Impossibile avviare la registrazione audio');
    }
  }, []);

  const stopVoiceRecording = useCallback(async (options: VoiceMessageOptions) => {
    if (!mediaRecorderRef.current || !isRecording) return;

    return new Promise<string | null>((resolve) => {
      const mediaRecorder = mediaRecorderRef.current!;

      mediaRecorder.addEventListener('stop', async () => {
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          
          // Upload audio to Supabase Storage
          const fileName = `voice_${Date.now()}.webm`;
          const filePath = `voice-messages/${options.conversationId}/${fileName}`;

          const { data, error } = await supabase.storage
            .from('chat-files')
            .upload(filePath, audioBlob);

          if (error) throw error;

          const { data: { publicUrl } } = supabase.storage
            .from('chat-files')
            .getPublicUrl(filePath);

          // Haptic feedback
          if ('vibrate' in navigator) {
            navigator.vibrate([50, 100, 50]);
          }

          options.onSend?.(publicUrl);
          resolve(publicUrl);
        } catch (error) {
          console.error('Error uploading voice message:', error);
          toast.error('Errore nell\'invio del messaggio vocale');
          resolve(null);
        }
      });

      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    });
  }, [isRecording]);

  const cancelVoiceRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      setRecordingTime(0);
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }

      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(100);
      }
    }
  }, [isRecording]);

  // Typing indicator
  const startTyping = useCallback((conversationId: string, userId: string) => {
    const channel = supabase.channel(`typing_${conversationId}`);
    channel.subscribe();
    channel.track({ user_id: userId, typing: true });
  }, []);

  const stopTyping = useCallback((conversationId: string, userId: string) => {
    const channel = supabase.channel(`typing_${conversationId}`);
    channel.track({ user_id: userId, typing: false });
    channel.unsubscribe();
  }, []);

  // Quick replies
  const quickReplies = [
    "👍 Perfetto, grazie!",
    "❓ Puoi spiegare meglio?",
    "📸 Invio una foto",
    "⏰ A dopo",
    "✅ Fatto!",
    "❌ Non funziona"
  ];

  // Message reactions - temporaneamente disabilitata fino al prossimo deploy Supabase
  const addReaction = useCallback(async (messageId: string, emoji: string, userId: string) => {
    try {
      // Temporarily disabled until Supabase types are updated
      console.log('Adding reaction:', { messageId, emoji, userId });
      
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(25);
      }
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  }, []);

  const formatRecordingTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    // Voice recording
    isRecording,
    recordingTime: formatRecordingTime(recordingTime),
    startVoiceRecording,
    stopVoiceRecording,
    cancelVoiceRecording,
    
    // Typing
    typingUsers,
    startTyping,
    stopTyping,
    
    // Quick replies
    quickReplies,
    
    // Reactions
    addReaction
  };
};
