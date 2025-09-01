
import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Download, Volume2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface EnhancedAudioMessageProps {
  audioUrl: string;
  duration?: number;
  transcription?: string;
  onTranscribe?: () => void;
}

export const EnhancedAudioMessage: React.FC<EnhancedAudioMessageProps> = ({
  audioUrl,
  duration,
  transcription,
  onTranscribe
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration || 0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showTranscription, setShowTranscription] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setAudioDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);

    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(25);
    }
  };

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const changePlaybackRate = () => {
    const rates = [1, 1.25, 1.5, 2, 0.75];
    const currentIndex = rates.indexOf(playbackRate);
    const nextRate = rates[(currentIndex + 1) % rates.length];
    
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const downloadAudio = () => {
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = `voice_message_${Date.now()}.webm`;
    a.click();
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 max-w-xs">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      <div className="flex items-center gap-3 mb-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={togglePlayPause}
          className="h-10 w-10 rounded-full bg-white/20 hover:bg-white/30"
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4 ml-0.5" />
          )}
        </Button>

        <div className="flex-1">
          <Slider
            value={[currentTime]}
            max={audioDuration}
            step={0.1}
            onValueChange={handleSeek}
            className="w-full"
          />
        </div>

        <span className="text-xs opacity-70 min-w-[35px]">
          {formatTime(currentTime)} / {formatTime(audioDuration)}
        </span>
      </div>

      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Volume2 className="h-3 w-3" />
          <span className="opacity-70">Messaggio vocale</span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={changePlaybackRate}
            className="h-6 px-2 text-xs opacity-70 hover:opacity-100"
          >
            {playbackRate}x
          </Button>

          {onTranscribe && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowTranscription(!showTranscription);
                if (!transcription) onTranscribe();
              }}
              className="h-6 px-2 text-xs opacity-70 hover:opacity-100"
            >
              Aa
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={downloadAudio}
            className="h-6 px-2 opacity-70 hover:opacity-100"
          >
            <Download className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {showTranscription && transcription && (
        <div className="mt-3 p-2 bg-black/20 rounded text-xs">
          <div className="flex items-center gap-1 mb-1 opacity-70">
            <RotateCcw className="h-3 w-3" />
            <span>Trascrizione:</span>
          </div>
          <p>{transcription}</p>
        </div>
      )}
    </div>
  );
};
