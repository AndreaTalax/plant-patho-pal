
import React, { useRef, useState, useEffect } from 'react';

interface SwipeableTabContainerProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  tabs: { id: string; label: string }[];
  children: React.ReactNode;
}

const SwipeableTabContainer: React.FC<SwipeableTabContainerProps> = ({
  activeTab,
  onTabChange,
  tabs,
  children
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const startX = useRef<number>(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleTouchStart = (e: TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging) return;
    
    const currentX = e.touches[0].clientX;
    const diffX = startX.current - currentX;
    
    // Threshold per attivare il cambio tab
    if (Math.abs(diffX) > 100) {
      const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
      
      if (diffX > 0 && currentIndex < tabs.length - 1) {
        // Swipe left - next tab
        onTabChange(tabs[currentIndex + 1].id);
      } else if (diffX < 0 && currentIndex > 0) {
        // Swipe right - previous tab
        onTabChange(tabs[currentIndex - 1].id);
      }
      
      setIsDragging(false);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, activeTab, tabs]);

  return (
    <div ref={containerRef} className="h-full">
      {children}
    </div>
  );
};

export default SwipeableTabContainer;
