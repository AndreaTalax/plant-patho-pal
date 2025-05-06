
import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/context/ThemeContext';

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTheme();
  
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-white/90 shadow-md backdrop-blur-md' : 'bg-gradient-to-b from-drplant-blue/20 to-transparent'
    }`}>
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <img 
            src="/lovable-uploads/1cb629ef-f7f2-4b66-a48a-5f22564bb3fa.png" 
            alt="DR PLANT Logo" 
            className="h-14 md:h-16"
          />
        </Link>
        <nav className="hidden md:flex space-x-6">
          <Link 
            to="/" 
            className={`font-medium hover:text-drplant-blue-dark transition-colors ${
              location.pathname === '/' ? 'text-drplant-blue-dark' : 'text-drplant-blue'
            }`}
          >
            {t("home")}
          </Link>
          <Link 
            to="/about" 
            className={`font-medium hover:text-drplant-blue-dark transition-colors ${
              location.pathname === '/about' ? 'text-drplant-blue-dark' : 'text-drplant-blue'
            }`}
          >
            {t("aboutUs")}
          </Link>
          <Link 
            to="/services" 
            className={`font-medium hover:text-drplant-blue-dark transition-colors ${
              location.pathname === '/services' ? 'text-drplant-blue-dark' : 'text-drplant-blue'
            }`}
          >
            {t("services")}
          </Link>
          <Link 
            to="/contact" 
            className={`font-medium hover:text-drplant-blue-dark transition-colors ${
              location.pathname === '/contact' ? 'text-drplant-blue-dark' : 'text-drplant-blue'
            }`}
          >
            {t("contact")}
          </Link>
        </nav>
        
        {!isAuthenticated && (
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
