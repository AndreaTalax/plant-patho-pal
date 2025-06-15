
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { 
  Home, 
  MessageSquare, 
  BookOpen, 
  ShoppingCart, 
  User,
  Stethoscope
} from "lucide-react";

interface BottomNavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  showExpertTab?: boolean;
  plantInfoComplete?: boolean;
  canAccessTabs?: boolean;
}

const BottomNavigation = ({
  activeTab,
  setActiveTab,
  showExpertTab = false,
  plantInfoComplete = false,
  canAccessTabs = false
}: BottomNavigationProps) => {
  const [unreadCount] = useState(0);

  const navItems = [
    { id: "diagnose", label: "Diagnosi", icon: Home, locked: false },
    { id: "chat", label: "Chat", icon: MessageSquare, hasNotification: unreadCount > 0,
      locked: !canAccessTabs },
    { id: "library", label: "Libreria", icon: BookOpen, locked: !canAccessTabs },
    { id: "shop", label: "Shop", icon: ShoppingCart, locked: !canAccessTabs },
    { id: "profile", label: "Profilo", icon: User, locked: !canAccessTabs }
  ];

  if (showExpertTab) {
    navItems.splice(4, 0, { id: "expert", label: "Dashboard", icon: Stethoscope, locked: false });
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          // Non più legato direttamente a plantInfoComplete ma alla nuova logica canAccessTabs
          const buttonDisabled = item.locked && !showExpertTab;

          return (
            <button
              key={item.id}
              onClick={() => !buttonDisabled && setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors relative ${
                isActive
                  ? "text-drplant-green bg-drplant-green/10"
                  : buttonDisabled
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-gray-600 hover:text-drplant-green"
              }`}
              disabled={buttonDisabled}
              tabIndex={buttonDisabled ? -1 : 0}
              aria-disabled={buttonDisabled}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
              {item.hasNotification && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0"
                >
                  {unreadCount}
                </Badge>
              )}
              {buttonDisabled && (
                <span className="absolute -bottom-2 w-16 text-[10px] text-red-500 opacity-90 text-center pointer-events-none select-none">
                  Completa prima la diagnosi
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;
