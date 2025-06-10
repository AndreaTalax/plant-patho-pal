
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
}

/**
 * Renders the bottom navigation bar with different tabs and icons.
 * @example
 * BottomNavigation({ activeTab: 'diagnose', setActiveTab: () => {}, showExpertTab: true })
 * // Returns JSX containing navigation bar with specified tabs
 * @param {object} BottomNavigationProps - Contains props for bottom navigation.
 * @param {string} BottomNavigationProps.activeTab - The ID of the currently active tab.
 * @param {function} BottomNavigationProps.setActiveTab - Function to set the active tab.
 * @param {boolean} BottomNavigationProps.showExpertTab - Conditional flag to show expert tab.
 * @returns {JSX.Element} JSX element of the bottom navigation.
 * @description
 *   - The navigation bar is fixed at the bottom of the page.
 *   - It supports five essential tabs: Diagnose, Chat, Library, Shop, and Profile.
 *   - Notifications are highlighted on the chat tab if there are unread messages.
 *   - An additional expert tab can be included based on the `showExpertTab` flag.
 */
const BottomNavigation = ({ activeTab, setActiveTab, showExpertTab = false }: BottomNavigationProps) => {
  const [unreadCount] = useState(0);

  const navItems = [
    { id: "diagnose", label: "Diagnosi", icon: Home },
    { id: "chat", label: "Chat", icon: MessageSquare, hasNotification: unreadCount > 0 },
    { id: "library", label: "Libreria", icon: BookOpen },
    { id: "shop", label: "Shop", icon: ShoppingCart },
    { id: "profile", label: "Profilo", icon: User },
  ];

  // Add expert tab if user is master account
  if (showExpertTab) {
    navItems.splice(4, 0, { id: "expert", label: "Dashboard", icon: Stethoscope });
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors relative ${
                isActive 
                  ? "text-drplant-green bg-drplant-green/10" 
                  : "text-gray-600 hover:text-drplant-green"
              }`}
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
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;
