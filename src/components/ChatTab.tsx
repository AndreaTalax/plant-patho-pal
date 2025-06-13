
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ExpertRealTimeChat } from './chat/expert/ExpertRealTimeChat';
import { UserChatViewRealtime } from './chat/UserChatViewRealtime';
import { MessageSquare, Users, Sparkles } from 'lucide-react';
import { MARCO_NIGRO_ID } from '@/components/phytopathologist';

const ChatTab = () => {
  const { userProfile, isMasterAccount } = useAuth();
  
  if (!userProfile || !userProfile.id) {
    return (
      <div className="min-h-[calc(100vh-8rem)] bg-gradient-to-br from-gray-50/50 via-white/30 to-drplant-green/5">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-lg border border-drplant-green/10 overflow-hidden">
              <div className="flex flex-col items-center justify-center h-96 p-8">
                <div className="w-20 h-20 bg-gradient-to-r from-drplant-green to-drplant-blue rounded-full flex items-center justify-center mb-6">
                  <MessageSquare className="h-10 w-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-drplant-green to-drplant-blue bg-clip-text text-transparent mb-2">
                  Accesso Richiesto
                </h2>
                <p className="text-gray-600 text-center">
                  Effettua l'accesso per utilizzare la chat con i nostri esperti
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  const isExpert = userProfile.id === MARCO_NIGRO_ID || isMasterAccount;
  
  return (
    <div className="min-h-[calc(100vh-8rem)] bg-gradient-to-br from-gray-50/50 via-white/30 to-drplant-green/5">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-drplant-green to-drplant-blue rounded-full flex items-center justify-center">
                {isExpert ? (
                  <Users className="h-8 w-8 text-white" />
                ) : (
                  <MessageSquare className="h-8 w-8 text-white" />
                )}
              </div>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-drplant-green to-drplant-blue bg-clip-text text-transparent mb-2">
              {isExpert ? 'Dashboard Esperto - Chat Real-Time' : 'Chat Real-Time con Fitopatologo'}
            </h1>
            <p className="text-gray-600 text-lg">
              {isExpert 
                ? 'Gestisci le conversazioni in tempo reale con i tuoi pazienti' 
                : 'Consulenza professionale in tempo reale per le tue piante'
              }
            </p>
            {!isExpert && (
              <div className="flex items-center justify-center gap-2 mt-2">
                <Sparkles className="h-4 w-4 text-drplant-green" />
                <span className="text-sm text-drplant-green font-medium">
                  Comunicazione istantanea con Marco Nigro
                </span>
              </div>
            )}
            <div className="flex items-center justify-center gap-2 mt-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-sm text-green-600 font-medium">Sistema Real-Time Attivo</span>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-lg border border-drplant-green/10 overflow-hidden">
            <div className="h-[calc(100vh-20rem)]">
              {isExpert ? (
                <ExpertRealTimeChat />
              ) : (
                <UserChatViewRealtime userId={userProfile.id} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatTab;
