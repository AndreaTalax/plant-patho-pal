import React, { useState } from 'react'; 
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  Menu, 
  X, 
  User, 
  LogOut,
  Home,
  Info,
  Briefcase,
  Phone
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated, userProfile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      setIsMenuOpen(false);
      await logout();
    } catch (error) {
      console.error('Errore durante il logout:', error);
      toast.error('Errore durante il logout');
    }
  };

  const handleLogin = () => {
    navigate('/auth');
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const menuItems = [
    { name: 'Home', icon: Home, path: '/?tab=diagnose', isTabSwitch: true },
    { name: 'Chi Siamo', icon: Info, path: '/about', isTabSwitch: false },
    { name: 'Servizi', icon: Briefcase, path: '/services', isTabSwitch: false },
    { name: 'Contatti', icon: Phone, path: '/contact', isTabSwitch: false },
  ];

  const handleMenuClick = (item) => {
    setIsMenuOpen(false);
    if (item.isTabSwitch) {
      navigate('/?tab=diagnose', { replace: true });
    } else {
      navigate(item.path);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link 
            to="/?tab=diagnose" 
            className="flex items-center space-x-2 font-bold text-xl text-drplant-green"
          >
            <img 
              src="/lovable-uploads/72d5a60c-404a-4167-9430-511af91c523b.png" 
              alt="Dr.Plant Logo" 
              className="h-8 w-auto select-none"
            />
            <span className="bg-gradient-to-r from-drplant-green to-drplant-blue bg-clip-text text-transparent">
              Dr.Plant
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {menuItems.map((item) =>
              item.isTabSwitch ? (
                <button
                  key={item.name}
                  onClick={() => handleMenuClick(item)}
                  className="flex items-center space-x-1 text-gray-600 hover:text-drplant-green transition-colors duration-200"
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </button>
              ) : (
                <Link
                  key={item.name}
                  to={item.path}
                  className="flex items-center space-x-1 text-gray-600 hover:text-drplant-green transition-colors duration-200"
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              )
            )}
          </nav>

          {/* User Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 text-gray-700">
                  <User className="h-5 w-5" />
                  <span className="text-sm font-medium">
                    {userProfile?.first_name || userProfile?.firstName || 'Utente'}
                  </span>
                </div>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Esci</span>
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleLogin}
                className="bg-drplant-green hover:bg-drplant-green/90 text-white"
              >
                Accedi
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMenu}
            className="md:hidden"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
          <div className="container mx-auto px-4 py-4">
            <nav className="flex flex-col space-y-4">
              {menuItems.map((item) =>
                item.isTabSwitch ? (
                  <button
                    key={item.name}
                    onClick={() => handleMenuClick(item)}
                    className="flex items-center space-x-3 text-gray-600 hover:text-drplant-green transition-colors duration-200 py-2 text-left"
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </button>
                ) : (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center space-x-3 text-gray-600 hover:text-drplant-green transition-colors duration-200 py-2"
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                )
              )}

              <div className="border-t border-gray-200 pt-4">
                {isAuthenticated ? (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 text-gray-700 py-2">
                      <User className="h-5 w-5" />
                      <span className="font-medium">
                        {userProfile?.first_name || userProfile?.firstName || 'Utente'}
                      </span>
                    </div>
                    <Button
                      onClick={handleLogout}
                      variant="outline"
                      className="w-full flex items-center justify-center space-x-2 border-red-300 text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Esci</span>
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={handleLogin}
                    className="w-full bg-drplant-green hover:bg-drplant-green/90 text-white"
                  >
                    Accedi
                  </Button>
                )}
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
