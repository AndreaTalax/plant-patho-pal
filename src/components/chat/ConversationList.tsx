
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { User, Trash2, Ban } from 'lucide-react';
import { Conversation } from './types';

interface ConversationListProps {
  conversations: Conversation[];
  currentConversationId?: string | null;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onToggleBlockUser: (id: string) => void;
}

const ConversationList = ({
  conversations,
  currentConversationId,
  onSelectConversation,
  onDeleteConversation,
  onToggleBlockUser
}: ConversationListProps) => {
  return (
    <div className="p-2">
      <h3 className="font-medium text-sm mb-2">Conversations</h3>
      <div className="space-y-1">
        {conversations.map(conversation => (
          <div 
            key={conversation.id}
            className={`p-2 rounded-lg cursor-pointer flex items-center ${
              currentConversationId === conversation.id 
                ? 'bg-drplant-green/10 border border-drplant-green/30' 
                : 'hover:bg-gray-100'
            } ${conversation.blocked ? 'opacity-50' : ''}`}
            onClick={() => onSelectConversation(conversation.id)}
          >
            <Avatar className="h-8 w-8 mr-2">
              <User className="h-5 w-5" />
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center">
                <span className="font-medium text-sm">
                  {conversation.username}
                  {conversation.blocked && <span className="ml-1 text-xs bg-red-100 text-red-600 px-1 rounded">Blocked</span>}
                </span>
                {conversation.unread && (
                  <span className="bg-drplant-green text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    •
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 truncate">{conversation.lastMessage}</p>
            </div>
            <div className="flex space-x-1 ml-1">
              <Button 
                variant="ghost" 
                size="icon"
                className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteConversation(conversation.id);
                }}
                title="Delete conversation"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                className={`h-6 w-6 ${conversation.blocked ? 'text-green-500 hover:text-green-700 hover:bg-green-50' : 'text-red-500 hover:text-red-700 hover:bg-red-50'}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleBlockUser(conversation.id);
                }}
                title={conversation.blocked ? "Unblock user" : "Block user"}
              >
                <Ban className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConversationList;
