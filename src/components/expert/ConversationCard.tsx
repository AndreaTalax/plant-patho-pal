
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';

interface ConversationCardProps {
  conversation: any;
  getInitials: (firstName?: string, lastName?: string) => string;
  getUserDisplayName: (userProfile?: { first_name: string; last_name: string; email: string } | null) => string;
  handleOpenChat: (conv: any) => void;
}

export default function ConversationCard({
  conversation,
  getInitials,
  getUserDisplayName,
  handleOpenChat,
}: ConversationCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback>
                {getInitials(conversation.user_profile?.first_name, conversation.user_profile?.last_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">
                {getUserDisplayName(conversation.user_profile)}
              </div>
              <div className="text-sm text-gray-500 truncate max-w-xs">
                {conversation.last_message_text || 'Nessun messaggio'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="text-sm text-gray-500">
                {conversation.last_message_timestamp && 
                  formatDistanceToNow(new Date(conversation.last_message_timestamp), {
                    addSuffix: true,
                    locale: it
                  })
                }
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                className="mt-2"
                onClick={() => handleOpenChat(conversation)}
              >
                <MessageSquare className="h-4 w-4 mr-1" />
                Apri Chat
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
