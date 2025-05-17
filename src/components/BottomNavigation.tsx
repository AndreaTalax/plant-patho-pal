
import { Camera, MessageCircle, ShoppingBag, Leaf, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

type TabName = 'diagnose' | 'chat' | 'shop' | 'library' | 'profile';

interface BottomNavigationProps {
  activeTab: TabName;
  setActiveTab: (tab: TabName) => void;
}

const BottomNavigation = ({ activeTab, setActiveTab }: BottomNavigationProps) => {
  const { isMasterAccount } = useAuth();
  
  // Define all tabs
  const allTabs = [
    { name: 'diagnose' as TabName, icon: Camera, label: 'Diagnose' },
    { name: 'chat' as TabName, icon: MessageCircle, label: 'Chat' },
    { name: 'shop' as TabName, icon: ShoppingBag, label: 'Shop' },
    { name: 'library' as TabName, icon: Leaf, label: 'Library' },
    { name: 'profile' as TabName, icon: User, label: 'Profile' }
  ];
  
  // Filter tabs based on user role
  const tabs = allTabs.filter(tab => {
    // Hide "Diagnose" tab for master accounts
    if (isMasterAccount && tab.name === 'diagnose') {
      return false;
    }
    return true;
  });

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-100 shadow-lg z-50 pb-safe">
      <div className="container mx-auto">
        <div className="flex justify-between">
          {tabs.map((tab) => (
            <button
              key={tab.name}
              className={`flex flex-col items-center justify-center py-3 px-4 transition-colors ${
                activeTab === tab.name
                  ? 'text-drplant-blue'
                  : 'text-gray-500 hover:text-drplant-blue/70'
              }`}
              onClick={() => setActiveTab(tab.name)}
            >
              <tab.icon className={`w-6 h-6 ${
                activeTab === tab.name ? 'text-drplant-blue' : 'text-gray-500'
              }`} />
              <span className="text-xs mt-1 font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BottomNavigation;
