import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "@/components/Header";
import DiagnoseTab from "@/components/DiagnoseTab";
import ChatTab from "@/components/ChatTab";
import LibraryTabWithLocation from "@/components/LibraryTabWithLocation";
import ShopTab from "@/components/ShopTab";
import ProfileTab from "@/components/ProfileTab";
import ExpertTab from "@/components/ExpertTab";
import BottomNavigation from "@/components/BottomNavigation";
import { ensureStorageBuckets } from "@/utils/storageSetup";
import { usePlantInfo } from "@/context/PlantInfoContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const { isMasterAccount, isAuthenticated, isProfileComplete, loading, userProfile } = useAuth();
  const { plantInfo } = usePlantInfo();
  const { toast } = useToast();
  const { t } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState<string>(isMasterAccount ? "expert" : "diagnose");
  const suppressAutoOpenRef = useRef(false);
  
  // ✅ AGGIUNGI QUESTI STATE PER LA CHAT PROFESSIONALE
  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>();
  const [isProfessionalChat, setIsProfessionalChat] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, loading, navigate]);

  useEffect(() => {
    if (!loading && isAuthenticated && !isProfileComplete && !isMasterAccount) {
      console.log('📝 Profilo incompleto, reindirizzamento al completamento profilo...');
      navigate('/complete-profile');
    }
  }, [isAuthenticated, isProfileComplete, isMasterAccount, loading, navigate]);

  const hasFirstDiagnosis =
    typeof window !== 'undefined' && (
      localStorage.getItem('firstDiagnosisDone') === 'true' ||
      (userProfile?.id ? localStorage.getItem(`firstDiagnosisDone:${userProfile.id}`) === 'true' : false)
    );
  const canAccessTabs = hasFirstDiagnosis || (plantInfo.infoComplete && (plantInfo.useAI || plantInfo.sendToExpert));

  useEffect(() => {
    ensureStorageBuckets();
  }, []);

  // Legge il tab dalla querystring (es. /?tab=diagnose) e lo applica con priorità
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam) {
      if (isMasterAccount && tabParam === 'diagnose') {
        setActiveTab('expert');
      } else {
        setActiveTab(tabParam);
        
        // Se è la tab chat, controlla se c'è una conversazione da aprire
        if (tabParam === 'chat') {
          const convId = localStorage.getItem('openConversationId');
          const isProfessional = localStorage.getItem('isProfessionalChat') === 'true';
          
          if (convId) {
            console.log('✅ Opening conversation from URL:', convId);
            setSelectedConversationId(convId);
            setIsProfessionalChat(isProfessional);
            
            // Pulisci localStorage
            localStorage.removeItem('openConversationId');
            localStorage.removeItem('isProfessionalChat');
          }
        }
      }
    }
  }, [location.search, isMasterAccount]);

  useEffect(() => {
    if (isMasterAccount && activeTab === "diagnose") {
      setActiveTab("expert");
    }
  }, [isMasterAccount, activeTab]);

  // Se l'utente ha una conversazione attiva, apri automaticamente la chat
  useEffect(() => {
    const autoOpenChatIfMessages = async () => {
      try {
        const params = new URLSearchParams(location.search);
        if (params.get('tab')) return;
        if (suppressAutoOpenRef.current) return;
        if (isMasterAccount || !isAuthenticated || !userProfile?.id) return;
        
        const { data, error } = await supabase
          .from('conversations' as any)
          .select('id,last_message_at,status')
          .eq('user_id', userProfile.id)
          .eq('status', 'active')
          .order('last_message_at', { ascending: false })
          .limit(1);
        
        if (!error && data && data.length > 0) {
          setActiveTab('chat');
        }
      } catch (e) {
        console.log('ℹ️ Auto-open chat check error:', e);
      }
    };
    autoOpenChatIfMessages();
  }, [isAuthenticated, userProfile?.id, isMasterAccount, activeTab, location.search]);

  useEffect(() => {
    const handleSwitchTab = (event: CustomEvent) => {
      console.log("🎧 Index.tsx - handleSwitchTab called");
      console.log("🎧 Event detail:", event.detail);
      
      const newTab = event.detail;
      
      // ✅ AGGIUNGI QUESTO BLOCCO PER GESTIRE L'APERTURA DELLA CHAT
      if (newTab === 'chat') {
        // Controlla se c'è una conversazione da aprire dal localStorage
        const convId = localStorage.getItem('openConversationId');
        const isProfessional = localStorage.getItem('isProfessionalChat') === 'true';
        
        console.log('🔍 Checking for conversation to open:', { convId, isProfessional });
        
        if (convId) {
          console.log('✅ Opening specific conversation:', convId);
          setSelectedConversationId(convId);
          setIsProfessionalChat(isProfessional);
          
          // Pulisci localStorage
          localStorage.removeItem('openConversationId');
          localStorage.removeItem('isProfessionalChat');
        } else {
          // Reset se non c'è una conversazione specifica da aprire
          setSelectedConversationId(undefined);
          setIsProfessionalChat(false);
        }
        
        suppressAutoOpenRef.current = false;
        setActiveTab('chat');
        return;
      }

      // Handle professional quote request
      if (newTab === "professional-quote") {
        console.log("🎧 Professional quote requested - navigating to plan selection");
        navigate("/plan-selection?direct=professional");
        return;
      }

      if (isMasterAccount && newTab === "diagnose") {
        console.log("🎧 Master account + diagnose -> Setting to expert");
        setActiveTab("expert");
        return;
      }
      
      if (newTab === "diagnose") {
        suppressAutoOpenRef.current = true;
        setActiveTab("diagnose");
        return;
      }
      
      suppressAutoOpenRef.current = newTab === 'chat' ? false : true;
      console.log("🎧 Setting active tab to:", newTab);
      setActiveTab(newTab);
    };

    console.log("🎧 Adding switchTab event listener");
    window.addEventListener('switchTab', handleSwitchTab as EventListener);

    return () => {
      console.log("🎧 Removing switchTab event listener");
      window.removeEventListener('switchTab', handleSwitchTab as EventListener);
    };
  }, [isMasterAccount, canAccessTabs, toast, t, activeTab, navigate]);

  const handleSetActiveTab = (tab: string) => {
    if (isMasterAccount && tab === "diagnose") {
      setActiveTab("expert");
      return;
    }

    if (tab === 'chat') {
      // ✅ AGGIUNGI QUESTO: Reset della conversazione quando apri la chat manualmente
      setSelectedConversationId(undefined);
      setIsProfessionalChat(false);
      suppressAutoOpenRef.current = false;
    } else {
      suppressAutoOpenRef.current = true;
    }
    setActiveTab(tab);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-drplant-green/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-drplant-green mx-auto mb-4"></div>
          <p className="text-gray-600">{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || (!isProfileComplete && !isMasterAccount)) {
    return null;
  }

  const renderTabContent = () => {
    const selectedPlan = localStorage.getItem('selectedPlanType') as 'privati' | 'business' | 'professionisti' | null;
    
    if (isMasterAccount) {
      switch (activeTab) {
        case "expert":
          return <ExpertTab />;
        case "shop":
          return <ShopTab />;
        case "profile":
          return <ProfileTab />;
        default:
          return <ExpertTab />;
      }
    }

    if (selectedPlan === 'professionisti') {
      switch (activeTab) {
        case "chat":
          // ✅ MODIFICA QUI: Passa i parametri al ChatTab
          return (
            <ChatTab 
              conversationId={selectedConversationId}
              isProfessionalChat={isProfessionalChat}
            />
          );
        case "profile":
          return <ProfileTab />;
        default:
          // ✅ MODIFICA QUI: Passa i parametri anche nel default
          return (
            <ChatTab 
              conversationId={selectedConversationId}
              isProfessionalChat={isProfessionalChat}
            />
          );
      }
    }
    
    switch (activeTab) {
      case "diagnose":
        return <DiagnoseTab />;
      case "chat":
        // ✅ MODIFICA QUI: Passa i parametri al ChatTab
        return (
          <ChatTab 
            conversationId={selectedConversationId}
            isProfessionalChat={isProfessionalChat}
          />
        );
      case "library":
        return <LibraryTabWithLocation />;
      case "shop":
        return <ShopTab />;
      case "profile":
        return <ProfileTab />;
      default:
        return <DiagnoseTab />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-drplant-green/5">
      <Header />
      <div className="pb-20">
        {renderTabContent()}
      </div>
      <BottomNavigation 
        activeTab={activeTab} 
        setActiveTab={handleSetActiveTab}
        showExpertTab={isMasterAccount}
        plantInfoComplete={plantInfo.infoComplete}
        canAccessTabs={canAccessTabs}
        selectedPlan={localStorage.getItem('selectedPlanType') as 'privati' | 'business' | 'professionisti' | null}
      />
    </div>
  );
};

export default Index;
