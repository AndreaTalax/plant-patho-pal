
import { Volume2, Download } from 'lucide-react';

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
      <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 border border-white/30">
        <audio 
          controls 
          className="w-full max-w-xs h-10"
          preload="metadata"
          controlsList="nodownload"
        >
          <source src={audioUrl} type="audio/webm" />
          <source src={audioUrl} type="audio/mpeg" />
          <source src={audioUrl} type="audio/wav" />
          Il tuo browser non supporta l'audio.
        </audio>
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={() => window.open(audioUrl, '_blank')}
            className="text-xs opacity-70 hover:opacity-100 flex items-center gap-1"
          >
            <Download className="h-3 w-3" />
            Scarica
          </button>
        </div>
      </div>
    </div>
  );
};
