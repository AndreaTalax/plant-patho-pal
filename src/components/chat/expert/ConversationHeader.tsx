
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User, ShoppingBag, Ban, Trash2 } from 'lucide-react';

interface ConversationHeaderProps {
  username: string;
  isBlocked: boolean;
  onRecommendProduct: () => void;
  onToggleBlockUser: () => void;
  onDeleteConversation: () => void;
}

/**
 * Renders a conversation header with user interaction buttons.
 * @example
 * ConversationHeader({
 *   username: "JohnDoe",
 *   isBlocked: false,
 *   onRecommendProduct: () => {},
 *   onToggleBlockUser: () => {},
 *   onDeleteConversation: () => {}
 * })
 * // Returns a JSX element representing the conversation header with buttons.
 * @param {string} username - The username of the conversation participant.
 * @param {boolean} isBlocked - Indicates if the user is blocked, affecting button states.
 * @param {function} onRecommendProduct - Callback for when the "Recommend" button is clicked.
 * @param {function} onToggleBlockUser - Callback for toggling user block status.
 * @param {function} onDeleteConversation - Callback for deleting the conversation.
 * @returns {JSX.Element} A header element with user interaction buttons.
 * @description
 *   - The "Recommend" button is disabled if the user is blocked.
 *   - Block status affects button appearance and hover text.
 *   - Provides tooltips to guide users on button functionalities.
 */
const ConversationHeader = ({
  username,
  isBlocked,
  onRecommendProduct,
  onToggleBlockUser,
  onDeleteConversation
}: ConversationHeaderProps) => {
  return (
    <div className="bg-white p-2 shadow-sm flex items-center justify-between border-b">
      <div className="flex items-center gap-2">
        <Avatar className="h-6 w-6">
          <AvatarFallback>
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-medium text-sm">
            {username}
            {isBlocked && <span className="ml-1 text-xs bg-red-100 text-red-600 px-1 rounded">Blocked</span>}
          </h3>
        </div>
      </div>
      
      <div className="flex items-center space-x-1">
        <Button 
          size="sm" 
          variant="outline"
          className="gap-1 text-xs py-1 h-7"
          onClick={onRecommendProduct}
          disabled={isBlocked}
        >
          <ShoppingBag className="h-3 w-3" />
          Recommend
        </Button>
        
        <Button 
          variant="ghost" 
          size="icon"
          className="h-6 w-6 text-red-500 hover:bg-red-50"
          onClick={onToggleBlockUser}
          title={isBlocked ? "Unblock user" : "Block user"}
        >
          <Ban className="h-3 w-3" />
        </Button>
        
        <Button 
          variant="ghost" 
          size="icon"
          className="h-6 w-6 text-red-500 hover:bg-red-50"
          onClick={onDeleteConversation}
          title="Delete conversation"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};

export default ConversationHeader;
