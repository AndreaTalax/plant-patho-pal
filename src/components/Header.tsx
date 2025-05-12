
import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/context/ThemeContext';
import { Menu, X, Leaf } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTrigger,
} from '@/components/ui/drawer';

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTheme();
  const isMobile = useIsMobile();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { title: "home", path: "/" },
    { title: "aboutUs", path: "/about" },
    { title: "services", path: "/services" },
    { title: "contact", path: "/contact" },
  ];
  
  const handleNavigation = (path: string) => {
    setIsDrawerOpen(false);
    navigate(path);
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-white/90 shadow-md backdrop-blur-md' : 'bg-gradient-to-b from-drplant-blue/20 to-transparent'
    }`}>
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <img 
            src="/lovable-uploads/1cb629ef-f7f2-4b66-a48a-5f22564bb3fa.png" 
            alt="DR PLANT Logo" 
            className="h-14 md:h-16"
          />
          <div className="hidden md:flex flex-col">
            <span className="font-bold text-drplant-blue text-xl">DR PLANT</span>
          </div>
        </Link>
        
        {/* Desktop navigation */}
        <nav className="hidden md:flex space-x-6">
          {navItems.map((item) => (
            <Link 
              key={item.title}
              to={item.path}
              className={`font-medium hover:text-drplant-blue-dark transition-colors ${
                location.pathname === item.path ? 'text-drplant-blue-dark' : 'text-drplant-blue'
              }`}
            >
              {t(item.title)}
            </Link>
          ))}
        </nav>

        {/* Mobile navigation */}
        {isMobile && (
          <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
            <DrawerTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6 text-drplant-blue" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </DrawerTrigger>
            <DrawerContent className="px-4 py-6 h-[60vh] flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-drplant-blue flex items-center gap-2">
                  <Leaf className="h-5 w-5 text-drplant-green" />
                  <span>{t("menu")}</span>
                </h2>
                <DrawerClose asChild>
                  <Button variant="ghost" size="icon">
                    <X className="h-5 w-5" />
                    <span className="sr-only">Close menu</span>
                  </Button>
                </DrawerClose>
              </div>
              <div className="flex flex-col space-y-4">
                {navItems.map((item) => (
                  <Button 
                    key={item.title}
                    variant="ghost" 
                    className={`justify-start text-lg font-medium ${
                      location.pathname === item.path ? 'text-drplant-blue-dark' : 'text-drplant-blue'
                    }`}
                    onClick={() => handleNavigation(item.path)}
                  >
                    {t(item.title)}
                  </Button>
                ))}
              </div>
              
              {!isAuthenticated && (
                <div className="mt-auto pt-4 border-t border-gray-100">
                  <Button 
                    className="w-full bg-drplant-blue hover:bg-drplant-blue-dark"
                    onClick={() => {
                      setIsDrawerOpen(false);
                      navigate('/login');
                    }}
                  >
                    {t("login")}
                  </Button>
                </div>
              )}
            </DrawerContent>
          </Drawer>
        )}
        
        {!isAuthenticated && !isMobile && (
          <Button 
            className="bg-drplant-blue hover:bg-drplant-blue-dark"
            onClick={() => navigate('/login')}
          >
            {t("login")}
          </Button>
        )}
      </div>
    </header>
  );
};

export default Header;
