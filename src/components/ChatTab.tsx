
import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import UserChatView from '@/components/chat/UserChatView';
import { NavigationUtils } from '@/utils/navigationUtils';
import { useAuth } from '@/context/AuthContext';

const ChatTab = () => {
  const { user } = useAuth();
  
  const handleNewDiagnosis = () => {
    console.log('🔄 Redirecting to new diagnosis...');
    NavigationUtils.redirectToTab('diagnose');
  };

  // If no user, show loading or login message
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-6 pt-8 pb-24">
        <div className="text-center">
          <p className="text-gray-600">Effettua il login per vedere le tue conversazioni</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 pt-8 pb-24">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Le tue conversazioni attive</h1>
        <p className="text-gray-600 mb-4">
          Continua le conversazioni con il fitopatologo Marco Nigro
        </p>
        
        <Button 
          onClick={handleNewDiagnosis}
          className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          <FileText className="w-4 h-4" />
          Nuova Diagnosi
        </Button>
      </div>
      
      <div className="h-96 border rounded-lg">
        <UserChatView userId={user.id} />
      </div>
    </div>
  );
};

export default ChatTab;
