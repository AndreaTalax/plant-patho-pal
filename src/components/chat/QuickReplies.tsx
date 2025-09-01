
import React from 'react';
import { Button } from '@/components/ui/button';

interface QuickRepliesProps {
  replies: string[];
  onSelect: (reply: string) => void;
  className?: string;
}

export const QuickReplies: React.FC<QuickRepliesProps> = ({
  replies,
  onSelect,
  className = ""
}) => {
  const handleSelect = (reply: string) => {
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(25);
    }
    onSelect(reply);
  };

  return (
    <div className={`flex flex-wrap gap-2 p-3 bg-gray-50 border-t ${className}`}>
      {replies.map((reply, index) => (
        <Button
          key={index}
          variant="outline"
          size="sm"
          onClick={() => handleSelect(reply)}
          className="text-xs rounded-full bg-white hover:bg-gray-100 border-gray-200 px-3 py-1 h-auto"
        >
          {reply}
        </Button>
      ))}
    </div>
  );
};
