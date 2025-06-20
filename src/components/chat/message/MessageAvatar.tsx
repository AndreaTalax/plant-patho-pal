
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Bot } from 'lucide-react';

interface MessageAvatarProps {
  isUser: boolean;
  userAvatar?: string;
  userName?: string;
}

export const MessageAvatar = ({ isUser, userAvatar, userName }: MessageAvatarProps) => {
  if (isUser && userAvatar && userName) {
    const initials = userName.split(' ').map(n => n.charAt(0)).join('').toUpperCase();
    return (
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarImage src={userAvatar} alt={userName} />
        <AvatarFallback className="bg-blue-500 text-white text-xs">
          {initials}
        </AvatarFallback>
      </Avatar>
    );
  }

  if (isUser) {
    return (
      <Avatar className="h-8 w-8 flex-shrink-0 bg-drplant-blue">
        <AvatarFallback className="bg-drplant-blue text-white">
          <User className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
    );
  }

  return (
    <Avatar className="h-8 w-8 flex-shrink-0">
      <AvatarImage 
        src="/images/marco-nigro-avatar.jpg" 
        alt="Marco Nigro" 
      />
      <AvatarFallback className="bg-drplant-green text-white">
        <Bot className="h-4 w-4" />
      </AvatarFallback>
    </Avatar>
  );
};
