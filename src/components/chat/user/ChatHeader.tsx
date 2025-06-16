
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Wifi, WifiOff } from 'lucide-react';
import { EXPERT } from '../types';
import { useTheme } from '@/context/ThemeContext';
import { useExpertPresence } from '@/hooks/useExpertPresence';

interface ChatHeaderProps {
  onBackClick: () => void;
  isConnected: boolean;
}

const ChatHeader = ({ onBackClick, isConnected }: ChatHeaderProps) => {
  const { t } = useTheme();
  const { isExpertOnline } = useExpertPresence();
  
  return (
    <div className="bg-white p-4 shadow-sm flex items-center gap-3 border-b border-gray-200">
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-10 w-10 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0" 
        onClick={onBackClick}
      >
        <ArrowLeft className="h-5 w-5 text-gray-600" />
      </Button>
      
      <Avatar className="h-10 w-10 border-2 border-drplant-green/20 flex-shrink-0">
        <AvatarImage src={EXPERT.avatar} alt={EXPERT.name} />
        <AvatarFallback className="bg-drplant-green/10 text-drplant-green font-semibold">MN</AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 truncate">{EXPERT.name}</h3>
        <div className="flex items-center gap-2">
          {isExpertOnline ? (
            <Wifi className="w-3 h-3 text-green-500 flex-shrink-0" />
          ) : (
            <WifiOff className="w-3 h-3 text-red-500 flex-shrink-0" />
          )}
          <p className="text-xs text-gray-600 truncate">
            {isExpertOnline ? (t("online") || "Online") : (t("offline") || "Offline")}
          </p>
          {isConnected && (
            <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" title="Connesso alla chat" />
          )}
        </div>
      </div>
      
      <div className="text-right flex-shrink-0">
        <p className="text-xs text-gray-500">Fitopatologo</p>
        <p className="text-xs text-drplant-green font-medium">Esperto certificato</p>
      </div>
    </div>
  );
};

export default ChatHeader;
