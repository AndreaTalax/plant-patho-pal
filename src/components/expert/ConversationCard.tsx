
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Archive, Circle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ConversationCardProps {
  conversation: any;
  getInitials: (firstName?: string, lastName?: string) => string;
  getUserDisplayName: (userProfile?: { first_name: string; last_name: string; email: string } | null) => string;
  handleOpenChat: (conv: any) => void;
  onArchiveConversation: (conversationId: string) => void;
  archivingConversation: string | null;
}

export default function ConversationCard({
  conversation,
  getInitials,
  getUserDisplayName,
  handleOpenChat,
  onArchiveConversation,
  archivingConversation,
}: ConversationCardProps) {
  // Usa lo stato online reale dal profilo utente
  const isUserOnline = conversation.user_profile?.is_online || false;

  // Get priority badge for conversation
  const getPriorityBadge = () => {
    const lastMessageTime = conversation.last_message_timestamp ? new Date(conversation.last_message_timestamp) : null;
    const now = new Date();
    const hoursDiff = lastMessageTime ? Math.abs(now.getTime() - lastMessageTime.getTime()) / (1000 * 60 * 60) : 0;
    
    if (!lastMessageTime) {
      return <Badge variant="secondary" className="text-xs">Nuovo</Badge>;
    }
    
    if (hoursDiff > 24) {
      return <Badge variant="destructive" className="text-xs">Urgente</Badge>;
    } else if (hoursDiff > 12) {
      return <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-700">Attesa risposta</Badge>;
    }
    
    return <Badge variant="default" className="text-xs bg-green-100 text-green-700">Recente</Badge>;
  };

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="relative flex-shrink-0">
              <Avatar className="h-10 w-10">
                <AvatarFallback>
                  {getInitials(conversation.user_profile?.first_name, conversation.user_profile?.last_name)}
                </AvatarFallback>
              </Avatar>
              {/* Indicatore stato online */}
              <div className="absolute -bottom-1 -right-1">
                <Circle 
                  className={`h-4 w-4 ${isUserOnline ? 'text-green-500 fill-green-500' : 'text-gray-400 fill-gray-400'}`} 
                />
              </div>
            </div>
            <div className="min-w-0 flex-1 overflow-hidden">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <div className="font-medium text-sm truncate min-w-0">
                  {getUserDisplayName(conversation.user_profile)}
                </div>
                <div className="flex gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap flex-shrink-0 ${
                    isUserOnline 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {isUserOnline ? 'Online' : 'Offline'}
                  </span>
                  {getPriorityBadge()}
                </div>
              </div>
              <div className="text-sm text-gray-500 break-words overflow-wrap-anywhere line-clamp-2">
                {conversation.last_message_text || 'Nessun messaggio'}
              </div>
              <div className="text-xs text-gray-400 mt-1 truncate">
                {conversation.last_message_timestamp && 
                  formatDistanceToNow(new Date(conversation.last_message_timestamp), {
                    addSuffix: true,
                    locale: it
                  })
                }
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-2 flex-shrink-0 ml-2">
            <Button 
              size="sm" 
              variant="outline" 
              className="gap-1 whitespace-nowrap text-xs px-2"
              onClick={() => handleOpenChat(conversation)}
            >
              <MessageSquare className="h-3 w-3" />
              Visualizza
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-purple-700 hover:text-purple-800 border-purple-200 hover:border-purple-300 px-2"
                  disabled={archivingConversation === conversation.id}
                >
                  <Archive className="h-3 w-3" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Concludi e Archivia Conversazione</AlertDialogTitle>
                  <AlertDialogDescription>
                    Sei sicuro di voler concludere e archiviare questa conversazione con {getUserDisplayName(conversation.user_profile)}? 
                    La conversazione sarà spostata nell'archivio e marcata come completata.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annulla</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onArchiveConversation(conversation.id)}
                    className="bg-purple-600 hover:bg-purple-700"
                    disabled={archivingConversation === conversation.id}
                  >
                    {archivingConversation === conversation.id ? 'Archiviazione...' : 'Concludi + Archivia'}
                  </AlertDialogAction>
                </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
