
import React from "react";

interface ChatConnectionErrorProps {
  message?: string;
}

const ChatConnectionError: React.FC<ChatConnectionErrorProps> = ({ message }) => {
  if (!message) return null;
  return (
    <div className="absolute left-0 right-0 top-20 flex items-center justify-center z-30 rounded-b-2xl pointer-events-none">
      <span className="text-red-700 text-base font-semibold text-center px-4 bg-white/90 shadow border rounded-lg">
        {message}
      </span>
    </div>
  );
};

export default ChatConnectionError;
