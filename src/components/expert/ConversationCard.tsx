
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
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
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
            <div>
              <div className="flex items-center gap-2">
                <div className="font-medium">
                  {getUserDisplayName(conversation.user_profile)}
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  isUserOnline 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {isUserOnline ? 'Online' : 'Offline'}
                </span>
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
              <div className="flex gap-2 mt-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="gap-1"
                  onClick={() => handleOpenChat(conversation)}
                >
                  <MessageSquare className="h-4 w-4" />
                  Apri Chat
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-red-500 hover:text-red-700 border-red-200 hover:border-red-300"
                      disabled={deletingConversation === conversation.id}
                    >
                      <Trash2 className="h-4 w-4" />
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
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
