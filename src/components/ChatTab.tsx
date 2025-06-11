
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePlantInfo } from '@/context/PlantInfoContext';
import ExpertChatView from './chat/ExpertChatView';
import UserChatView from './chat/UserChatView';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { EXPERT } from '@/components/chat/types';
import { MessageSquare, Users, Sparkles } from 'lucide-react';

const ChatTab = () => {
  const { userProfile, isMasterAccount } = useAuth();
  const { plantInfo } = usePlantInfo();
  const [refreshKey, setRefreshKey] = useState(Date.now());
  const [synced, setSynced] = useState(false);
  
  // Force refresh when switching tabs or on chat issues
  useEffect(() => {
    const handleRefreshChat = () => {
      console.log("Forcing chat refresh...");
      setRefreshKey(Date.now());
    };
    
    const handleTabSwitch = (event: any) => {
      if (event.detail === 'chat') {
        console.log("Switching to chat tab, refreshing...");
        setRefreshKey(Date.now());
      }
    };
    
    window.addEventListener('refreshChat', handleRefreshChat);
    window.addEventListener('switchTab', handleTabSwitch);
    
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        (payload) => {
          console.log('Message change detected:', payload.eventType);
          setRefreshKey(Date.now());
        }
      )
      .subscribe();
      
    const conversationsChannel = supabase
      .channel('conversations-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations' },
        (payload) => {
          console.log('Conversation change detected:', payload.eventType);
          setRefreshKey(Date.now());
        }
      )
      .subscribe();
      
    return () => {
      window.removeEventListener('refreshChat', handleRefreshChat);
      window.removeEventListener('switchTab', handleTabSwitch);
      supabase.removeChannel(channel);
      supabase.removeChannel(conversationsChannel);
    };
  }, []);
  
  useEffect(() => {
    if (plantInfo && !plantInfo.infoComplete) {
      setSynced(false);
    }
  }, [plantInfo]);
  
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
  
  return (
    <div className="min-h-[calc(100vh-8rem)] bg-gradient-to-br from-gray-50/50 via-white/30 to-drplant-green/5">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-drplant-green to-drplant-blue rounded-full flex items-center justify-center">
                {isMasterAccount ? (
                  <Users className="h-8 w-8 text-white" />
                ) : (
                  <MessageSquare className="h-8 w-8 text-white" />
                )}
              </div>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-drplant-green to-drplant-blue bg-clip-text text-transparent mb-2">
              {isMasterAccount ? 'Dashboard Esperto' : 'Chat con Fitopatologo'}
            </h1>
            <p className="text-gray-600 text-lg">
              {isMasterAccount 
                ? 'Gestisci le conversazioni con i tuoi pazienti' 
                : 'Consulenza professionale per le tue piante'
              }
            </p>
            {!isMasterAccount && (
              <div className="flex items-center justify-center gap-2 mt-2">
                <Sparkles className="h-4 w-4 text-drplant-green" />
                <span className="text-sm text-drplant-green font-medium">Supporto specializzato disponibile</span>
              </div>
            )}
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-lg border border-drplant-green/10 overflow-hidden">
            <div className="h-[calc(100vh-20rem)]">
              {isMasterAccount ? (
                <ExpertChatView key={`expert-${refreshKey}-${userProfile.id}`} userId={userProfile.id} />
              ) : (
                <UserChatView key={`user-${refreshKey}-${userProfile.id}`} userId={userProfile.id} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatTab;
