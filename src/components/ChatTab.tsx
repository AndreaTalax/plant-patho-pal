
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { UserChatViewRealtime } from './chat/UserChatViewRealtime';
import { ConnectionStatus } from './ConnectionStatus';
import { MessageCircle } from 'lucide-react';

const ChatTab = () => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated || !user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <MessageCircle className="h-16 w-16 mx-auto mb-6 text-drplant-green" />
          <h2 className="text-2xl font-bold mb-4">Accedi per utilizzare la chat</h2>
          <p className="text-gray-600">
            Effettua l'accesso per chattare con i nostri esperti di fitopatie
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)]">
      <ConnectionStatus />
      <UserChatViewRealtime userId={user.id} />
    </div>
  );
};

export default ChatTab;
