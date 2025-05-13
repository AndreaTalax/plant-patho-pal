
import { MessageSquare } from 'lucide-react';

const EmptyConversationState = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
      <MessageSquare className="h-10 w-10 mb-3 text-gray-300" />
      <p className="text-sm">Select a conversation to start</p>
    </div>
  );
};

export default EmptyConversationState;
