import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, SkipBack, SkipForward, Volume2, Download } from 'lucide-react';
import { AudioWaveform } from './AudioWaveform';

interface AdvancedAudioPlayerProps {
  audioUrl: string;
  className?: string;
}

export const AdvancedAudioPlayer: React.FC<AdvancedAudioPlayerProps> = ({
  audioUrl,
  className = ""
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const playbackSpeeds = [0.75, 1, 1.25, 1.5, 2];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleLoadStart = () => {
      setIsLoading(true);
    };

    const handleCanPlayThrough = () => {
      setIsLoading(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplaythrough', handleCanPlayThrough);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplaythrough', handleCanPlayThrough);
    };
  }, [audioUrl]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(console.error);
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;

    const newTime = (value[0] / 100) * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newVolume = value[0] / 100;
    audio.volume = newVolume;
    setVolume(newVolume);
  };

  const changePlaybackRate = () => {
    const audio = audioRef.current;
    if (!audio) return;

    const currentIndex = playbackSpeeds.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % playbackSpeeds.length;
    const newRate = playbackSpeeds[nextIndex];
    
    audio.playbackRate = newRate;
    setPlaybackRate(newRate);
  };

  const skipTime = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`space-y-4 ${className}`}>
      <audio 
        ref={audioRef} 
        src={audioUrl} 
        preload="metadata"
        className="hidden"
      />

      {/* Waveform Visualization */}
      <div className="relative h-16 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
        <AudioWaveform 
          audioUrl={audioUrl}
          isRecording={false}
          className="w-full h-full"
          color="#10b981"
          backgroundColor="rgba(16, 185, 129, 0.1)"
        />
        
        {/* Progress overlay */}
        <div 
          className="absolute top-0 left-0 h-full bg-primary/20 transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <Slider
          value={[progress]}
          onValueChange={handleSeek}
          max={100}
          step={0.1}
          className="w-full"
          disabled={isLoading}
          aria-label="Posizione riproduzione audio"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            onClick={() => skipTime(-10)}
            variant="ghost"
            size="sm"
            disabled={isLoading}
            aria-label="Indietro di 10 secondi"
          >
            <SkipBack className="h-4 w-4" />
          </Button>

          <Button
            onClick={togglePlayPause}
            variant="outline"
            size="lg"
            disabled={isLoading}
            className="w-12 h-12 rounded-full"
            aria-label={isPlaying ? 'Pausa' : 'Riproduci'}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5 ml-0.5" />
            )}
          </Button>

          <Button
            onClick={() => skipTime(10)}
            variant="ghost"
            size="sm"
            disabled={isLoading}
            aria-label="Avanti di 10 secondi"
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-4">
          {/* Playback Speed */}
          <Button
            onClick={changePlaybackRate}
            variant="ghost"
            size="sm"
            disabled={isLoading}
            className="text-xs font-mono min-w-12"
            aria-label={`Velocità riproduzione ${playbackRate}x`}
          >
            {playbackRate}x
          </Button>

          {/* Volume Control */}
          <div className="flex items-center gap-2">
            <Volume2 className="h-4 w-4 text-gray-500" />
            <Slider
              value={[volume * 100]}
              onValueChange={handleVolumeChange}
              max={100}
              step={1}
              className="w-20"
              aria-label="Volume"
            />
          </div>

          {/* Download Button */}
          <Button
            onClick={() => window.open(audioUrl, '_blank')}
            variant="ghost"
            size="sm"
            aria-label="Scarica file audio"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};