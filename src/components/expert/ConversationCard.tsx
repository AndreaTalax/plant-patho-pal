
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MessageSquare, Trash2, Circle } from 'lucide-react';
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
  onDeleteConversation: (conversationId: string) => void;
  deletingConversation: string | null;
}

export default function ConversationCard({
  conversation,
  getInitials,
  getUserDisplayName,
  handleOpenChat,
  onDeleteConversation,
  deletingConversation,
}: ConversationCardProps) {
  // Usa lo stato online reale dal profilo utente
  const isUserOnline = conversation.user_profile?.is_online || false;

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
                <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap flex-shrink-0 ${
                  isUserOnline 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {isUserOnline ? 'Online' : 'Offline'}
                </span>
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
                  className="text-red-500 hover:text-red-700 border-red-200 hover:border-red-300 px-2"
                  disabled={deletingConversation === conversation.id}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Elimina Conversazione</AlertDialogTitle>
                  <AlertDialogDescription>
                    Sei sicuro di voler eliminare questa conversazione con {getUserDisplayName(conversation.user_profile)}? 
                    Questa azione eliminerà anche tutti i messaggi associati e non può essere annullata.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annulla</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDeleteConversation(conversation.id)}
                    className="bg-red-600 hover:bg-red-700"
                    disabled={deletingConversation === conversation.id}
                  >
                    {deletingConversation === conversation.id ? 'Eliminazione...' : 'Elimina'}
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
