
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Smile, Plus } from 'lucide-react';

interface Reaction {
  emoji: string;
  count: number;
  userReacted: boolean;
}

interface MessageReactionsProps {
  messageId: string;
  reactions?: Reaction[];
  onAddReaction: (messageId: string, emoji: string) => void;
  onRemoveReaction: (messageId: string, emoji: string) => void;
}

const COMMON_EMOJIS = ['👍', '❤️', '😍', '😂', '😮', '😢', '🤔', '👏'];

export const MessageReactions: React.FC<MessageReactionsProps> = ({
  messageId,
  reactions = [],
  onAddReaction,
  onRemoveReaction
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleReactionClick = (emoji: string, userReacted: boolean) => {
    if (userReacted) {
      onRemoveReaction(messageId, emoji);
    } else {
      onAddReaction(messageId, emoji);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    onAddReaction(messageId, emoji);
    setShowEmojiPicker(false);
  };

  return (
    <div className="flex items-center gap-1 mt-1">
      {reactions.map((reaction, index) => (
        <Button
          key={index}
          variant={reaction.userReacted ? "secondary" : "ghost"}
          size="sm"
          onClick={() => handleReactionClick(reaction.emoji, reaction.userReacted)}
          className={`h-6 px-2 rounded-full text-xs ${
            reaction.userReacted 
              ? 'bg-blue-100 text-blue-600 border border-blue-200' 
              : 'hover:bg-gray-100'
          }`}
        >
          <span className="mr-1">{reaction.emoji}</span>
          <span>{reaction.count}</span>
        </Button>
      ))}

      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="h-6 w-6 p-0 rounded-full hover:bg-gray-100"
        >
          <Plus className="h-3 w-3" />
        </Button>

        {showEmojiPicker && (
          <div className="absolute bottom-8 left-0 bg-white rounded-lg shadow-lg border p-2 z-50">
            <div className="grid grid-cols-4 gap-1">
              {COMMON_EMOJIS.map((emoji) => (
                <Button
                  key={emoji}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEmojiSelect(emoji)}
                  className="h-8 w-8 p-0 hover:bg-gray-100"
                >
                  {emoji}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
