
import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Send, X } from "lucide-react";

interface AudioRecorderProps {
  onSendAudio: (audioBlob: Blob) => Promise<void>;
  disabled: boolean;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ onSendAudio, disabled }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      alert("Il tuo browser non supporta la registrazione audio");
      return;
    }
    setIsRecording(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new window.MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioURL(URL.createObjectURL(blob));
      };
      mediaRecorder.start();
    } catch (e) {
      setIsRecording(false);
      alert("Errore nell'accedere al microfono");
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current?.stream.getTracks().forEach(t => t.stop());
  };

  const resetAudio = () => {
    setAudioBlob(null);
    setAudioURL(null);
  };

  return (
    <div>
      {audioURL ? (
        <div className="mb-2 flex items-center gap-2 bg-blue-50 px-3 py-2 rounded border">
          <audio src={audioURL} controls className="h-8" />
          <Button onClick={() => onSendAudio(audioBlob!)} disabled={disabled} className="ml-2">
            <Send className="h-4 w-4" />
          </Button>
          <Button onClick={resetAudio} variant="outline" className="ml-1" disabled={disabled}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : isRecording ? (
        <div className="mb-2 flex items-center gap-2 text-orange-700 font-semibold">
          ⏺ In registrazione...
          <Button variant="destructive" onClick={stopRecording} className="text-xs px-2 py-1 ml-3">Stop</Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={startRecording}
          disabled={disabled}
          className="h-[44px] px-1 border-drplant-green/30 hover:bg-drplant-green/10 rounded-2xl"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="#f97316"/></svg>
        </Button>
      )}
    </div>
  );
};

export default AudioRecorder;
