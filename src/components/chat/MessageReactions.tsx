import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Heart, ThumbsUp, ThumbsDown, Smile, Frown, Star } from 'lucide-react';
import { triggerHaptic } from '@/utils/hapticFeedback';
import { cn } from '@/lib/utils';

interface Reaction {
  type: string;
  count: number;
  users: string[];
  emoji: string;
}

interface MessageReactionsProps {
  messageId: string;
  reactions?: Reaction[];
  currentUserId: string;
  onAddReaction: (messageId: string, reactionType: string) => void;
  onRemoveReaction: (messageId: string, reactionType: string) => void;
  className?: string;
}

const REACTION_TYPES = [
  { type: 'like', icon: ThumbsUp, emoji: '👍', label: 'Mi piace' },
  { type: 'love', icon: Heart, emoji: '❤️', label: 'Amo' },
  { type: 'smile', icon: Smile, emoji: '😊', label: 'Sorrido' },
  { type: 'star', icon: Star, emoji: '⭐', label: 'Utile' },
  { type: 'dislike', icon: ThumbsDown, emoji: '👎', label: 'Non mi piace' },
  { type: 'sad', icon: Frown, emoji: '😢', label: 'Triste' },
];

export const MessageReactions: React.FC<MessageReactionsProps> = ({
  messageId,
  reactions = [],
  currentUserId,
  onAddReaction,
  onRemoveReaction,
  className
}) => {
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  const handleReactionClick = (reactionType: string) => {
    // Feedback tattile per ogni reazione
    triggerHaptic('light');
    
    const userReacted = reactions.find(r => r.type === reactionType)?.users.includes(currentUserId);
    
    if (userReacted) {
      onRemoveReaction(messageId, reactionType);
      triggerHaptic('light'); // Feedback diverso per rimozione
    } else {
      onAddReaction(messageId, reactionType);
      triggerHaptic('success'); // Feedback positivo per aggiunta
    }
    
    setShowReactionPicker(false);
  };

  const getReactionIcon = (type: string) => {
    const reactionConfig = REACTION_TYPES.find(r => r.type === type);
    return reactionConfig?.emoji || '👍';
  };

  const hasUserReacted = (reactionType: string) => {
    return reactions.find(r => r.type === reactionType)?.users.includes(currentUserId) || false;
  };

  return (
    <div className={cn("flex flex-wrap gap-1 mt-2", className)}>
      {/* Mostra reazioni esistenti */}
      {reactions.filter(r => r.count > 0).map((reaction) => (
        <Button
          key={reaction.type}
          variant="ghost"
          size="sm"
          className={cn(
            "h-6 px-2 text-xs rounded-full transition-all duration-200",
            hasUserReacted(reaction.type) 
              ? "bg-primary/10 text-primary border border-primary/20 scale-105" 
              : "bg-muted/50 hover:bg-muted/80 hover:scale-105"
          )}
          onClick={() => handleReactionClick(reaction.type)}
          onMouseEnter={() => triggerHaptic('light')}
        >
          <span className="mr-1">{getReactionIcon(reaction.type)}</span>
          <span>{reaction.count}</span>
        </Button>
      ))}

      {/* Pulsante per aggiungere reazione */}
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 rounded-full bg-muted/30 hover:bg-muted/60 hover:scale-110 transition-all duration-200"
          onClick={() => {
            triggerHaptic('medium');
            setShowReactionPicker(!showReactionPicker);
          }}
          onMouseEnter={() => triggerHaptic('light')}
        >
          <span className="text-xs">+</span>
        </Button>

        {/* Picker reazioni */}
        {showReactionPicker && (
          <div className="absolute bottom-full left-0 mb-2 p-2 bg-white rounded-lg shadow-lg border border-gray-200 flex gap-1 z-50 animate-scale-in">
            {REACTION_TYPES.map((reaction) => (
              <Button
                key={reaction.type}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-full hover:bg-muted/80 hover:scale-125 transition-all duration-200"
                onClick={() => handleReactionClick(reaction.type)}
                onMouseEnter={() => triggerHaptic('light')}
                title={reaction.label}
              >
                <span className="text-sm">{reaction.emoji}</span>
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Overlay per chiudere il picker */}
      {showReactionPicker && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowReactionPicker(false)}
        />
      )}
    </div>
  );
};

export default MessageReactions;