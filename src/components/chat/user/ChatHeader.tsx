
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import { EXPERT } from '../types';
import { useTheme } from '@/context/ThemeContext';

interface ChatHeaderProps {
  onBackClick: () => void;
}

const ChatHeader = ({ onBackClick }: ChatHeaderProps) => {
  const { t } = useTheme();
  
  return (
    <div className="bg-white p-3 shadow-sm flex items-center gap-3 border-b">
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-7 w-7" 
        onClick={onBackClick}
      >
        <ChevronRight className="rotate-180 h-4 w-4" />
      </Button>
      <Avatar className="h-8 w-8">
        <AvatarImage src={EXPERT.avatar} alt={EXPERT.name} />
      </Avatar>
      <div>
        <h3 className="font-medium text-sm">{EXPERT.name}</h3>
        <p className="text-xs text-green-600">{t("online") || "Online"}</p>
      </div>
    </div>
  );
};

export default ChatHeader;
