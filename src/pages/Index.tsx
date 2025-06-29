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
      const newTab = event.detail;

      if (isMasterAccount && newTab === "diagnose") {
        setActiveTab("expert");
        return;
      }
      if (!isMasterAccount && !canAccessTabs && newTab !== "diagnose" && newTab !== "chat") {
        toast({
          title: t("completeDiagnosisFirst"),
          description: t("afterUploadChoose"),
          duration: 3500,
          variant: "destructive",
        });
        setActiveTab("diagnose");
        return;
      }
      setActiveTab(newTab);
    };

    window.addEventListener('switchTab', handleSwitchTab as EventListener);

    return () => {
      window.removeEventListener('switchTab', handleSwitchTab as EventListener);
    };
  }, [isMasterAccount, canAccessTabs, toast, t]);

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
