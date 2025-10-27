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
        if (params.get('tab')) return; // non sovrascrivere la scelta esplicita dell'utente (URL)
        if (suppressAutoOpenRef.current) return; // non sovrascrivere la scelta manuale dell'utente
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

  // Non forzare più il redirect; l'utente può navigare liberamente tra le tab
  useEffect(() => {
    // intentionally left blank
  }, [canAccessTabs, activeTab, isMasterAccount]);

  useEffect(() => {
    const handleSwitchTab = (event: CustomEvent) => {
      console.log("🎧 Index.tsx - handleSwitchTab called");
      console.log("🎧 Event received:", event);
      console.log("🎧 Event detail:", event.detail);
      console.log("🎧 Event type:", event.type);
      console.log("🎧 Current state - isMasterAccount:", isMasterAccount);
      console.log("🎧 Current state - canAccessTabs:", canAccessTabs);
      console.log("🎧 Current state - activeTab:", activeTab);
      
      const newTab = event.detail;
      console.log("🎧 New tab requested:", newTab);

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
      
      // Se l'utente chiede esplicitamente Diagnosi, non auto-aprire la chat
      if (newTab === "diagnose") {
        suppressAutoOpenRef.current = true;
        setActiveTab("diagnose");
        return;
      }
      
      // Per utenti normali, la chat è sempre accessibile
      if (newTab === "chat") {
        console.log("🎧 Chat requested - allowing access");
        suppressAutoOpenRef.current = false; // riabilita auto-open su prossimi caricamenti
        setActiveTab("chat");
        return;
      }
      
      // Accesso aperto alle altre tab anche se canAccessTabs è false
      // (nessun redirect automatico)
      // Non auto-aprire la chat quando l'utente sceglie altre tab
      suppressAutoOpenRef.current = newTab === 'chat' ? false : true;
      console.log("🎧 Setting active tab to:", newTab);
      setActiveTab(newTab);
      console.log("🎧 Tab switch completed");
    };

    console.log("🎧 Adding switchTab event listener");
    window.addEventListener('switchTab', handleSwitchTab as EventListener);

    return () => {
      console.log("🎧 Removing switchTab event listener");
      window.removeEventListener('switchTab', handleSwitchTab as EventListener);
    };
  }, [isMasterAccount, canAccessTabs, toast, t, activeTab]);

  const handleSetActiveTab = (tab: string) => {
    if (isMasterAccount && tab === "diagnose") {
      setActiveTab("expert");
      return;
    }
    // Consenti la navigazione a tutte le tab; nessun redirect forzato

    if (tab === 'chat') {
      suppressAutoOpenRef.current = false; // riabilita auto-open
    } else {
      suppressAutoOpenRef.current = true; // non auto-aprire la chat su altre tab
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

    // Per professionisti, solo chat diretta con fitopatologo
    if (selectedPlan === 'professionisti') {
      switch (activeTab) {
        case "chat":
          return <ChatTab />;
        case "profile":
          return <ProfileTab />;
        default:
          return <ChatTab />;
      }
    }
    
    // Per privati e business: diagnosi AI + chat esperto
    switch (activeTab) {
      case "diagnose":
        return <DiagnoseTab />;
      case "chat":
        return <ChatTab />;
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
