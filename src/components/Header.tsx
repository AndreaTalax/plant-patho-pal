
import { useState, useEffect } from 'react';

const Header = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 shadow-md backdrop-blur-md' : 'bg-transparent'}`}>
      <div className="container mx-auto px-4 py-3 flex justify-center items-center">
        <div className="flex items-center">
          <img 
            src="/lovable-uploads/1cb629ef-f7f2-4b66-a48a-5f22564bb3fa.png" 
            alt="DR PLANT Logo" 
            className="h-12"
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
