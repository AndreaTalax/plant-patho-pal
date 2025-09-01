
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Send, X, Pause, Play } from 'lucide-react';
import { useEnhancedChat } from '@/hooks/useEnhancedChat';

interface VoiceRecorderProps {
  conversationId: string;
  senderId: string;
  recipientId: string;
  onSendVoiceMessage: (audioUrl: string) => void;
  disabled?: boolean;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  conversationId,
  senderId,
  recipientId,
  onSendVoiceMessage,
  disabled = false
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const {
    isRecording,
    recordingTime,
    startVoiceRecording,
    stopVoiceRecording,
    cancelVoiceRecording
  } = useEnhancedChat();

  const handleStartRecording = async () => {
    setIsVisible(true);
    await startVoiceRecording();
  };

  const handleStopAndSend = async () => {
    const audioUrl = await stopVoiceRecording({
      conversationId,
      senderId,
      recipientId,
      onSend: onSendVoiceMessage
    });
    
    if (audioUrl) {
      setIsVisible(false);
      setIsPaused(false);
    }
  };

  const handleCancel = () => {
    cancelVoiceRecording();
    setIsVisible(false);
    setIsPaused(false);
  };

  if (!isVisible) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleStartRecording}
        disabled={disabled}
        className="h-10 w-10 rounded-full hover:bg-gray-100"
      >
        <Mic className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-10 w-10 bg-red-500 rounded-full">
            <Mic className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-medium text-red-700">
              Registrazione in corso
            </div>
            <div className="text-xs text-red-600">
              {recordingTime}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="h-8 w-8 p-0 hover:bg-red-100"
          >
            <X className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4">
        <Button
          variant="outline"
          onClick={handleCancel}
          className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
        >
          <X className="h-4 w-4 mr-2" />
          Annulla
        </Button>

        <Button
          onClick={handleStopAndSend}
          className="flex-1 bg-red-500 hover:bg-red-600 text-white"
        >
          <Send className="h-4 w-4 mr-2" />
          Invia
        </Button>
      </div>

      {/* Visualizzazione delle onde sonore */}
      <div className="flex items-center justify-center gap-1 mt-3 h-8">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="w-1 bg-red-400 rounded-full animate-pulse"
            style={{
              height: `${Math.random() * 100 + 20}%`,
              animationDelay: `${i * 50}ms`
            }}
          />
        ))}
      </div>
    </div>
  );
};
