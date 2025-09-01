import React, { useRef, useEffect, useState } from 'react';

interface AudioWaveformProps {
  audioStream?: MediaStream;
  isRecording: boolean;
  audioUrl?: string;
  className?: string;
  color?: string;
  backgroundColor?: string;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  audioStream,
  isRecording,
  audioUrl,
  className = "w-full h-16",
  color = "#10b981",
  backgroundColor = "rgba(16, 185, 129, 0.1)"
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationIdRef = useRef<number>();
  const analyserRef = useRef<AnalyserNode>();
  const audioContextRef = useRef<AudioContext>();
  const [waveformData, setWaveformData] = useState<number[]>([]);

  // Initialize audio analysis for live recording
  useEffect(() => {
    if (!audioStream || !isRecording) {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      return;
    }

    const setupAudioAnalysis = async () => {
      try {
        const audioContext = new AudioContext();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(audioStream);
        
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;
        source.connect(analyser);
        
        audioContextRef.current = audioContext;
        analyserRef.current = analyser;
        
        drawWaveform();
      } catch (error) {
        console.error('Error setting up audio analysis:', error);
      }
    };

    setupAudioAnalysis();

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [audioStream, isRecording]);

  // Draw waveform for recorded audio
  useEffect(() => {
    if (audioUrl && !isRecording) {
      drawStaticWaveform();
    }
  }, [audioUrl, isRecording]);

  const drawWaveform = () => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    
    if (!canvas || !analyser) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const draw = () => {
      analyser.getByteFrequencyData(dataArray);
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Background
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Waveform bars
      const barWidth = canvas.width / bufferLength;
      let barHeight;
      let x = 0;
      
      ctx.fillStyle = color;
      
      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height * 0.8;
        
        const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, `${color}80`);
        ctx.fillStyle = gradient;
        
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
        x += barWidth;
      }
      
      if (isRecording) {
        animationIdRef.current = requestAnimationFrame(draw);
      }
    };
    
    draw();
  };

  const drawStaticWaveform = async () => {
    if (!audioUrl) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      // Create audio context to analyze the recorded audio
      const audioContext = new AudioContext();
      const response = await fetch(audioUrl);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      const channelData = audioBuffer.getChannelData(0);
      const samples = canvas.width;
      const blockSize = Math.floor(channelData.length / samples);
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Background
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Waveform
      ctx.fillStyle = color;
      
      for (let i = 0; i < samples; i++) {
        let sum = 0;
        for (let j = 0; j < blockSize; j++) {
          sum += Math.abs(channelData[i * blockSize + j]);
        }
        const average = sum / blockSize;
        const barHeight = average * canvas.height;
        
        const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, `${color}80`);
        ctx.fillStyle = gradient;
        
        ctx.fillRect(i * 2, (canvas.height - barHeight) / 2, 1, barHeight);
      }
      
      audioContext.close();
    } catch (error) {
      console.error('Error drawing static waveform:', error);
    }
  };

  const handleCanvasResize = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }
  };

  useEffect(() => {
    handleCanvasResize();
    window.addEventListener('resize', handleCanvasResize);
    return () => window.removeEventListener('resize', handleCanvasResize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: '100%', height: '100%' }}
      aria-label={isRecording ? 'Visualizzazione in tempo reale dell\'audio' : 'Forma d\'onda del messaggio audio'}
    />
  );
};