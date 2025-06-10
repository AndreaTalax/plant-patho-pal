
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
import { ensureStorageBuckets } from "@/utils/storageSetup";

/**
* Renders the main application page with tab navigation and dynamic content based on active tab.
* @example
* Index()
* Renders the default diagnose tab, header, and bottom navigation.
* @returns {JSX.Element} The rendered application page component.
* @description
*   - Initializes storage buckets using a side-effect upon application startup.
*   - Sets up event listeners for custom tab switch events to update activeTab state.
*   - Conditionally renders the expert tab based on the user's account type.
*   - Ensures smooth user interaction through dynamic tab content rendering.
*/
const Index = () => {
  const [activeTab, setActiveTab] = useState<string>("diagnose");
  const { isMasterAccount } = useAuth();

  // Initialize storage buckets on app start
  useEffect(() => {
    ensureStorageBuckets();
  }, []);

  // Listen for custom tab switch events
  useEffect(() => {
    const handleSwitchTab = (event: CustomEvent) => {
      setActiveTab(event.detail);
    };

    window.addEventListener('switchTab', handleSwitchTab as EventListener);
    
    return () => {
      window.removeEventListener('switchTab', handleSwitchTab as EventListener);
    };
  }, []);

  /**
   * Renders a component based on the active tab selected
   * @example
   * functionName("chat")
   * <ChatTab />
   * @param {string} activeTab - The name of the currently active tab.
   * @returns {JSX.Element} The corresponding tab component to render.
   * @description
   *   - If the activeTab is "expert", it checks the isMasterAccount flag to determine which tab to render.
   *   - Defaults to rendering <DiagnoseTab /> if activeTab doesn't match any case.
   */
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-drplant-green/5">
      <Header />
      <main className="pb-20 pt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-lg border border-drplant-green/10 overflow-hidden">
            {renderTabContent()}
          </div>
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
