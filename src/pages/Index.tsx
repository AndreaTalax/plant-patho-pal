import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import DiagnoseTab from "@/components/DiagnoseTab";
import ChatTab from "@/components/ChatTab";
import LibraryTab from "@/components/LibraryTab";
import ShopTab from "@/components/ShopTab";
import ProfileTab from "@/components/ProfileTab";
import ExpertTab from "@/components/ExpertTab";
import BottomNavigation from "@/components/BottomNavigation";
import { ensureStorageBuckets } from "@/utils/storageSetup";
import { usePlantInfo } from "@/context/PlantInfoContext";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const { isMasterAccount, isAuthenticated, isProfileComplete, loading } = useAuth();
  const { plantInfo } = usePlantInfo();
  const { toast } = useToast();
  const { t } = useTheme();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<string>(isMasterAccount ? "expert" : "diagnose");

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      console.log('🔒 Utente non autenticato, reindirizzamento al login...');
      navigate('/login');
    }
  }, [isAuthenticated, loading, navigate]);

  useEffect(() => {
    if (!loading && isAuthenticated && !isProfileComplete && !isMasterAccount) {
      console.log('📝 Profilo incompleto, reindirizzamento al completamento profilo...');
      navigate('/complete-profile');
    }
  }, [isAuthenticated, isProfileComplete, isMasterAccount, loading, navigate]);

  const canAccessTabs = plantInfo.infoComplete && (plantInfo.useAI || plantInfo.sendToExpert);

  useEffect(() => {
    ensureStorageBuckets();
  }, []);

  useEffect(() => {
    if (isMasterAccount && activeTab === "diagnose") {
      setActiveTab("expert");
    }
  }, [isMasterAccount, activeTab]);

  useEffect(() => {
    if (!canAccessTabs && activeTab !== "diagnose" && !isMasterAccount) {
      setActiveTab("diagnose");
    }
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

      if (isMasterAccount && newTab === "diagnose") {
        console.log("🎧 Master account + diagnose -> Setting to expert");
        setActiveTab("expert");
        return;
      }
      
      // Per utenti normali, la chat è sempre accessibile
      if (newTab === "chat") {
        console.log("🎧 Chat requested - allowing access");
        setActiveTab("chat");
        return;
      }
      
      if (!isMasterAccount && !canAccessTabs && newTab !== "diagnose" && newTab !== "chat") {
        console.log("🎧 Access denied - showing toast and setting to diagnose");
        toast({
          title: t("completeDiagnosisFirst"),
          description: t("afterUploadChoose"),
          duration: 3500,
          variant: "destructive",
        });
        setActiveTab("diagnose");
        return;
      }
      
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
    if (!isMasterAccount && !canAccessTabs && tab !== "diagnose" && tab !== "chat") {
      toast({
        title: t("completeDiagnosisFirst"),
        description: t("afterUploadChoose"),
        duration: 3500,
        variant: "destructive",
      });
      setActiveTab("diagnose");
      return;
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
    
    switch (activeTab) {
      case "diagnose":
        return <DiagnoseTab />;
      case "chat":
        return <ChatTab />;
      case "library":
        return <LibraryTab />;
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
      />
    </div>
  );
};

export default Index;
