
import React from 'react';
import { Leaf, ShoppingBag, User, MessageCircle, BookOpen, Stethoscope } from 'lucide-react';

type TabType = 'diagnose' | 'shop' | 'profile' | 'chat' | 'library' | 'expert';

interface BottomNavigationProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ 
  activeTab, 
  setActiveTab 
}) => {
  const handleTabClick = (tab: TabType) => {
    console.log('📱 Bottom navigation tab clicked:', tab);
    setActiveTab(tab);
    
    // Update URL
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    window.history.replaceState({}, '', url.toString());
  };

  const tabs = [
    { id: 'diagnose' as TabType, icon: Leaf, label: 'Diagnosi' },
    { id: 'shop' as TabType, icon: ShoppingBag, label: 'Shop' },
    { id: 'library' as TabType, icon: BookOpen, label: 'Libreria' },
    { id: 'chat' as TabType, icon: MessageCircle, label: 'Chat' },
    { id: 'expert' as TabType, icon: Stethoscope, label: 'Esperto' },
    { id: 'profile' as TabType, icon: User, label: 'Profilo' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="max-w-md mx-auto px-4">
        <div className="flex justify-around py-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${
                  isActive 
                    ? 'text-drplant-green bg-drplant-green/10' 
                    : 'text-gray-500 hover:text-drplant-green hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

// Add default export
export default BottomNavigation;
