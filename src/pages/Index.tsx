
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import Header from "@/components/Header";
import DiagnoseTab from "@/components/DiagnoseTab";
import ChatTab from "@/components/ChatTab";
import LibraryTab from "@/components/LibraryTab";
import ShopTab from "@/components/ShopTab";
import ProfileTab from "@/components/ProfileTab";
import BottomNavigation from "@/components/BottomNavigation";
import ExpertDashboard from "@/components/expert/ExpertDashboard";
import { MARCO_NIGRO_ID } from "@/components/phytopathologist";

type TabType = 'diagnose' | 'shop' | 'profile' | 'chat' | 'library';

const Index = () => {
  const { isAuthenticated, userProfile, loading } = useAuth();
  const { t } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>("diagnose");

  // Check if current user is Marco Nigro (expert)
  const isMarcoNigro = userProfile?.id === MARCO_NIGRO_ID || 
                       userProfile?.email === 'agrotecnicomarconigro@gmail.com';

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = '/login';
    }

    // Handle URL tab parameter
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam && ['diagnose', 'shop', 'profile', 'chat', 'library'].includes(tabParam)) {
      setActiveTab(tabParam as TabType);
    }
  }, [isAuthenticated, loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-drplant-green"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // If user is Marco Nigro, show expert dashboard
  if (isMarcoNigro) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pb-16">
          <ExpertDashboard />
        </main>
      </div>
    );
  }

  // Regular user interface
  const renderActiveTab = () => {
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
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pb-16">
        {renderActiveTab()}
      </main>
      <BottomNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

export default Index;
