
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/Header";
import DiagnoseTab from "@/components/DiagnoseTab";
import ChatTab from "@/components/ChatTab";
import LibraryTab from "@/components/LibraryTab";
import ShopTab from "@/components/ShopTab";
import ProfileTab from "@/components/ProfileTab";
import ExpertTab from "@/components/ExpertTab";
import BottomNavigation from "@/components/BottomNavigation";

const Index = () => {
  const [activeTab, setActiveTab] = useState<string>("diagnose");
  const { isMasterAccount } = useAuth();

  // Ascolta eventi personalizzati per il cambio tab
  useEffect(() => {
    const handleSwitchTab = (event: CustomEvent) => {
      setActiveTab(event.detail);
    };

    window.addEventListener('switchTab', handleSwitchTab as EventListener);
    
    return () => {
      window.removeEventListener('switchTab', handleSwitchTab as EventListener);
    };
  }, []);

  const renderTabContent = () => {
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
      case "expert":
        return isMasterAccount ? <ExpertTab /> : <DiagnoseTab />;
      default:
        return <DiagnoseTab />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="pb-20 pt-16">
        <div className="container mx-auto px-4 py-4">
          {renderTabContent()}
        </div>
      </main>
      <BottomNavigation 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        showExpertTab={isMasterAccount}
      />
    </div>
  );
};

export default Index;
