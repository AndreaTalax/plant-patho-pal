
import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Send, X, Mic, Square, AlertCircle } from "lucide-react";
import { enhancedToast } from "@/components/ui/enhanced-toast";
import { AudioWaveform } from "@/components/audio/AudioWaveform";
import { accessibilityManager, voiceOverAnnouncements } from "@/utils/accessibility";
import { triggerHaptic } from "@/utils/hapticFeedback";
import { supabase } from '@/integrations/supabase/client';

interface AudioRecorderProps {
  onSendAudio: (audioBlob: Blob) => Promise<void>;
  disabled: boolean;
  conversationId?: string;
  senderId?: string;
  recipientId?: string;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ 
  onSendAudio, 
  disabled, 
  conversationId, 
  senderId, 
  recipientId 
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const [recordingStream, setRecordingStream] = useState<MediaStream | null>(null);

  const checkMicrophonePermission = async () => {
    try {
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      if (result.state === 'denied') {
        setPermissionDenied(true);
        return false;
      }
      return true;
    } catch (error) {
      console.warn('⚠️ Impossibile verificare permessi microfono:', error);
      return true;
    }
  };

  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setPermissionDenied(false);
      return true;
    } catch (error) {
      console.error('❌ Permesso microfono negato:', error);
      setPermissionDenied(true);
      enhancedToast.error('Permesso microfono negato', {
        description: 'Abilita l\'accesso al microfono nelle impostazioni del browser.'
      });
      return false;
    }
  };

  const startRecording = async () => {
    console.log('🎤 Click registrazione audio per amministratore');
    if (!navigator.mediaDevices?.getUserMedia) {
      enhancedToast.error("Browser non supportato", {
        description: "Il tuo browser non supporta la registrazione audio"
      });
      return;
    }

    const hasPermission = await checkMicrophonePermission();
    if (!hasPermission) {
      const granted = await requestMicrophonePermission();
      if (!granted) return;
    }

    try {
      console.log('🎤 Avvio registrazione audio...');
      setIsRecording(true);
      setPermissionDenied(false);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 44100,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      streamRef.current = stream;
      setRecordingStream(stream);
      
      triggerHaptic('medium');
      voiceOverAnnouncements.audioRecordingStarted();
      audioChunksRef.current = [];
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        console.log('🔴 Registrazione terminata');
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
        setAudioBlob(blob);
        setAudioURL(URL.createObjectURL(blob));
        
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        setRecordingStream(null);
        
        triggerHaptic('success');
        voiceOverAnnouncements.audioRecordingStopped();
      };

      mediaRecorder.onerror = (event) => {
        console.error('❌ Errore MediaRecorder:', event);
        enhancedToast.error('Errore durante la registrazione');
        stopRecording();
      };

      mediaRecorder.start(100);
      console.log('✅ Registrazione avviata');
      enhancedToast.success('🎤 Registrazione avviata');
      
    } catch (error: any) {
      console.error('❌ Errore accesso microfono:', error);
      setIsRecording(false);
      
      if (error.name === 'NotAllowedError') {
        setPermissionDenied(true);
        enhancedToast.error('Permesso microfono negato', {
          description: 'Clicca sull\'icona del microfono nella barra dell\'indirizzo per abilitarlo.'
        });
      } else {
        enhancedToast.error("Errore microfono", {
          description: "Errore nell'accedere al microfono. Verifica le impostazioni del browser."
        });
      }
    }
  };

  const stopRecording = () => {
    console.log('⏹️ Stop registrazione...');
    setIsRecording(false);
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setRecordingStream(null);
  };

  const resetAudio = () => {
    console.log('🔄 Reset audio');
    setAudioBlob(null);
    if (audioURL) {
      URL.revokeObjectURL(audioURL);
    }
    setAudioURL(null);
  };

  const handleSendAudio = async () => {
    if (!audioBlob) return;
    
    console.log('📤 Invio audio...', audioBlob.size, 'bytes');
    setIsProcessing(true);
    
    try {
      if (conversationId && senderId && recipientId) {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error('Sessione non valida');
        }

        const formData = new FormData();
        formData.append('conversationId', conversationId);
        formData.append('senderId', senderId);
        formData.append('recipientId', recipientId);
        formData.append('audio', audioBlob, 'voice-message.webm');

        const { data, error } = await supabase.functions.invoke('upload-audio', {
          body: formData,
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (error || !data?.success) {
          throw new Error(error?.message || 'Errore invio audio');
        }

        console.log('✅ Audio inviato con successo');
        resetAudio();
        enhancedToast.success('🎵 Messaggio vocale inviato!');
        voiceOverAnnouncements.messageSent();
      } else {
        await onSendAudio(audioBlob);
        resetAudio();
        enhancedToast.success('🎵 Messaggio vocale inviato!');
        voiceOverAnnouncements.messageSent();
      }
    } catch (error) {
      console.error('❌ Errore invio audio:', error);
      enhancedToast.error('Errore invio messaggio vocale');
    } finally {
      setIsProcessing(false);
    }
  };

  React.useEffect(() => {
    return () => {
      if (audioURL) {
        URL.revokeObjectURL(audioURL);
      }
    };
  }, [audioURL]);

  if (permissionDenied) {
    return (
      <div className="mb-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-center gap-2 text-yellow-700">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm font-medium">Permesso microfono richiesto</span>
        </div>
        <p className="text-xs text-yellow-600 mt-1">
          Per registrare messaggi vocali, abilita l'accesso al microfono nelle impostazioni del browser.
        </p>
        <Button 
          onClick={requestMicrophonePermission}
          size="sm"
          className="mt-2 bg-yellow-600 hover:bg-yellow-700"
        >
          Richiedi Permesso
        </Button>
      </div>
    );
  }

  return (
    <div className="mb-2">
      {audioURL && audioBlob ? (
        <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
          <audio 
            src={audioURL} 
            controls 
            className="h-8 flex-1"
            preload="metadata"
          />
          <Button 
            onClick={handleSendAudio} 
            disabled={disabled || isProcessing} 
            size="sm"
            className="bg-drplant-green hover:bg-drplant-green-dark"
          >
            {isProcessing ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
          <Button 
            onClick={resetAudio} 
            variant="outline" 
            size="sm"
            disabled={disabled || isProcessing}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : isRecording ? (
        <div className="space-y-2">
          {/* Waveform Visualization */}
          <div className="h-12 bg-red-50 rounded-lg border border-red-200 overflow-hidden">
            <AudioWaveform
              audioStream={recordingStream}
              isRecording={true}
              className="w-full h-full"
              color="#dc2626"
              backgroundColor="rgba(220, 38, 38, 0.1)"
            />
          </div>
          
          {/* Recording Controls */}
          <div className="flex items-center gap-3 text-red-600 font-semibold bg-red-50 px-3 py-2 rounded-lg border border-red-200">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span>Registrazione in corso...</span>
            </div>
            <Button 
              variant="destructive" 
              onClick={stopRecording} 
              size="sm"
              className="ml-auto"
              aria-label="Ferma registrazione"
            >
              <Square className="h-4 w-4 mr-1" />
              Stop
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={startRecording}
          disabled={disabled}
          className="h-[44px] px-3 border-drplant-green/30 hover:bg-drplant-green/10 rounded-2xl flex items-center gap-2"
        >
          <Mic className="h-5 w-5 text-drplant-green" />
          <span className="text-sm">Registra Audio</span>
        </Button>
      )}
    </div>
  );
};

export default AudioRecorder;
