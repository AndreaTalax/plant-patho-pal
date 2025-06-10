
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import { EXPERT } from '../types';
import { useTheme } from '@/context/ThemeContext';

interface ChatHeaderProps {
  onBackClick: () => void;
}

/**
 * Renders a chat header component for displaying expert information and a back button.
 * @example
 * chatHeader({ onBackClick: handleBackClick })
 * Returns a React component representing the chat header.
 * @param {function} onBackClick - The callback function to be called when the back button is clicked.
 * @returns {JSX.Element} A React component rendered as the chat header.
 * @description
 *   - Utilizes the `useTheme` hook for accessing translation functionality.
 *   - Displays an expert's avatar with fallback text if the image is unavailable.
 *   - Shows expert's name and online status with localization support.
 */
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
        <AvatarFallback>MN</AvatarFallback>
      </Avatar>
      <div>
        <h3 className="font-medium text-sm">{EXPERT.name}</h3>
        <p className="text-xs text-green-600">{t("online") || "Online"}</p>
      </div>
    </div>
  );
};

export default ChatHeader;
