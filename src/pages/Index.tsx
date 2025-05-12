
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import DiagnoseTab from '@/components/DiagnoseTab';
import ChatTab from '@/components/ChatTab';
import ShopTab from '@/components/ShopTab';
import LibraryTab from '@/components/LibraryTab';
import ProfileTab from '@/components/ProfileTab';
import BottomNavigation from '@/components/BottomNavigation';
import { useAuth } from '@/context/AuthContext';

type TabName = 'diagnose' | 'chat' | 'shop' | 'library' | 'profile';

const Index = () => {
  const { isMasterAccount } = useAuth();
  const [activeTab, setActiveTab] = useState<TabName>(isMasterAccount ? 'chat' : 'diagnose');

  // Reset active tab if user role changes (e.g., after login)
  useEffect(() => {
    if (isMasterAccount && activeTab === 'diagnose') {
      setActiveTab('chat');
    }
  }, [isMasterAccount, activeTab]);

  // Add event listener for tab switching
  useEffect(() => {
    const handleTabSwitch = (event: CustomEvent) => {
      const tabName = event.detail as TabName;
      if (tabName) {
        setActiveTab(tabName);
      }
    };

    window.addEventListener('switchTab', handleTabSwitch as EventListener);
    
    return () => {
      window.removeEventListener('switchTab', handleTabSwitch as EventListener);
    };
  }, []);

  return (
    <div className="bg-gradient-to-b from-sky-50 to-white min-h-screen pb-safe">
      <Header />

      <div className="relative pt-16 md:pt-24 pb-4 px-4 overflow-hidden">
        <div className="container mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-drplant-blue mb-4">
              {isMasterAccount ? 'Plant Health Specialist Dashboard' : 'Smart Plant Disease Diagnosis'}
            </h1>
            <p className="text-md md:text-lg text-gray-600">
              {isMasterAccount 
                ? 'Connect with users and provide expert plant health advice and product recommendations.'
                : 'Get instant plant health analysis and expert consultation with our advanced AI-powered diagnosis system.'}
            </p>
          </div>
        </div>
        <div className="absolute top-1/2 -left-24 w-48 h-48 bg-drplant-blue/10 rounded-full blur-3xl"/>
        <div className="absolute top-1/4 -right-24 w-64 h-64 bg-drplant-green/10 rounded-full blur-3xl"/>
      </div>

      <div className="container mx-auto px-4 pb-24 mt-4">
        <div className="relative bg-white rounded-2xl shadow-lg p-4 min-h-[60vh]">
          {activeTab === 'diagnose' && !isMasterAccount && <DiagnoseTab />}
          {activeTab === 'chat' && <ChatTab />}
          {activeTab === 'shop' && <ShopTab />}
          {activeTab === 'library' && <LibraryTab />}
          {activeTab === 'profile' && <ProfileTab />}
        </div>
      </div>

      <BottomNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

export default Index;
