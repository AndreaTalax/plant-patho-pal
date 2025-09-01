
import { Volume2, Download } from 'lucide-react';
import { AdvancedAudioPlayer } from '@/components/audio/AdvancedAudioPlayer';

interface AudioMessageProps {
  audioUrl: string;
}

export const AudioMessage = ({ audioUrl }: AudioMessageProps) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Volume2 className="h-4 w-4" />
        <span>Messaggio vocale</span>
      </div>
      <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 border border-white/30">
        <AdvancedAudioPlayer 
          audioUrl={audioUrl}
          className="w-full max-w-md"
        />
      </div>
    </div>
  );
};
