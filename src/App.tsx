
import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { PlantInfoProvider } from './context/PlantInfoContext';
import { ThemeProvider } from './context/ThemeContext';
import Header from './components/Header';
import DiagnoseTab from './components/DiagnoseTab';
import ShopTab from './components/ShopTab';
import ProfileTab from './components/ProfileTab';
import ChatTab from './components/ChatTab';
import LibraryTab from './components/LibraryTab';
import ExpertTab from './components/ExpertTab';
import { BottomNavigation } from './components/BottomNavigation';
import { Toaster } from './components/ui/sonner';
import { NotificationProvider } from './components/notifications/NotificationProvider';
import './App.css';

type TabType = 'diagnose' | 'shop' | 'profile' | 'chat' | 'library' | 'expert';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  // Check URL parameters for initial tab
  const getInitialTab = (): TabType => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab') as TabType;
    
    // Validate the tab parameter
    const validTabs: TabType[] = ['diagnose', 'shop', 'profile', 'chat', 'library', 'expert'];
    if (tabParam && validTabs.includes(tabParam)) {
      console.log('🔗 URL tab parameter detected:', tabParam);
      return tabParam;
    }
    
    return 'diagnose';
  };

  const [activeTab, setActiveTab] = useState<TabType>(getInitialTab);

  // Listen for custom tab switch events
  useEffect(() => {
    const handleTabSwitch = (event: CustomEvent<TabType>) => {
      console.log('🔄 Tab switch event received:', event.detail);
      setActiveTab(event.detail);
      
      // Update URL without page reload
      const url = new URL(window.location.href);
      url.searchParams.set('tab', event.detail);
      window.history.replaceState({}, '', url.toString());
    };

    window.addEventListener('switchTab', handleTabSwitch as any);
    return () => window.removeEventListener('switchTab', handleTabSwitch as any);
  }, []);

  // Handle URL changes (back/forward buttons)
  useEffect(() => {
    const handlePopState = () => {
      const newTab = getInitialTab();
      console.log('🔙 URL changed via navigation:', newTab);
      setActiveTab(newTab);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'diagnose':
        return <DiagnoseTab />;
      case 'shop':
        return <ShopTab />;
      case 'profile':
        return <ProfileTab />;
      case 'chat':
        return <ChatTab />;
      case 'library':
        return <LibraryTab />;
      case 'expert':
        return <ExpertTab />;
      default:
        return <DiagnoseTab />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <PlantInfoProvider>
            <NotificationProvider>
              <div className="min-h-screen bg-gray-50 flex flex-col">
                <Header />
                <main className="flex-1 pb-20">
                  {renderActiveTab()}
                </main>
                <BottomNavigation 
                  activeTab={activeTab} 
                  setActiveTab={setActiveTab} 
                />
              </div>
              <Toaster />
            </NotificationProvider>
          </PlantInfoProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
