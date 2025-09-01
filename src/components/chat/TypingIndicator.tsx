
import React from 'react';

interface TypingIndicatorProps {
  userNames: string[];
  className?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  userNames,
  className = ""
}) => {
  if (userNames.length === 0) return null;

  const getTypingText = () => {
    if (userNames.length === 1) {
      return `${userNames[0]} sta scrivendo...`;
    } else if (userNames.length === 2) {
      return `${userNames[0]} e ${userNames[1]} stanno scrivendo...`;
    } else {
      return `${userNames[0]} e altri ${userNames.length - 1} stanno scrivendo...`;
    }
  };

  return (
    <div className={`flex items-center gap-2 px-4 py-2 text-sm text-gray-500 ${className}`}>
      <div className="flex gap-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span>{getTypingText()}</span>
    </div>
  );
};
