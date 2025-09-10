
import { useState } from 'react';
import { Leaf, MessageCircle, BookOpen, ShoppingBag, User, Stethoscope } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

interface BottomNavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  showExpertTab?: boolean;
  plantInfoComplete?: boolean;
  canAccessTabs?: boolean;
  selectedPlan?: 'privati' | 'business' | 'professionisti' | null;
}

const BottomNavigation = ({
  activeTab,
  setActiveTab,
  showExpertTab = false,
  plantInfoComplete = false,
  canAccessTabs = false,
  selectedPlan = null
}: BottomNavigationProps) => {
  const { isMasterAccount } = useAuth();
  const { t } = useTheme();

  const getTabOpacity = (tabName: string) => {
    if (isMasterAccount) {
      return tabName === "diagnose" ? "opacity-50 cursor-not-allowed" : "";
    }
    
    if (!canAccessTabs && tabName !== "diagnose" && tabName !== "chat" && tabName !== "library" && tabName !== "shop" && tabName !== "profile") {
      return "opacity-50 cursor-not-allowed";
    }
    return "";
  };

  // Filtra le tab in base al piano selezionato e ai permessi
  const getFilteredTabs = () => {
    let baseTabs = [];
    
    // Per professionisti: solo chat e profilo
    if (selectedPlan === 'professionisti') {
      baseTabs = [
        { id: 'chat', icon: MessageCircle, label: t("chat") },
        { id: 'profile', icon: User, label: t("profile") }
      ];
      return baseTabs;
    }

    // Per account master (esperti)
    if (isMasterAccount) {
      baseTabs = [
        ...(showExpertTab ? [{ id: 'expert', icon: Stethoscope, label: t("dashboard") }] : []),
        { id: 'shop', icon: ShoppingBag, label: t("shop") },
        { id: 'profile', icon: User, label: t("profile") }
      ];
      return baseTabs;
    }

    // Per privati e business: tutte le funzionalità
    baseTabs = [
      { id: 'diagnose', icon: Leaf, label: t("diagnose") },
      { id: 'chat', icon: MessageCircle, label: t("chat") },
      { id: 'library', icon: BookOpen, label: t("library") },
      { id: 'shop', icon: ShoppingBag, label: t("shop") },
      { id: 'profile', icon: User, label: t("profile") }
    ];
    
    return baseTabs;
  };

  const tabs = getFilteredTabs();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
      <div className="flex justify-around items-center py-2 px-4 max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const opacity = getTabOpacity(tab.id);
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              disabled={opacity.includes('cursor-not-allowed')}
              className={`flex flex-col items-center justify-center min-w-[60px] py-2 px-1 rounded-lg transition-all duration-200 ${opacity} ${
                isActive
                  ? 'text-drplant-green bg-drplant-green/10'
                  : 'text-gray-600 hover:text-drplant-green hover:bg-drplant-green/5'
              }`}
            >
              <Icon 
                className={`h-5 w-5 mb-1 ${
                  isActive ? 'text-drplant-green' : 'text-gray-600'
                }`} 
              />
              <span 
                className={`text-xs font-medium ${
                  isActive ? 'text-drplant-green' : 'text-gray-600'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;
