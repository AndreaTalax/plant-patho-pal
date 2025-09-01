
import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface FloatingCartButtonProps {
  itemCount: number;
  onClick: () => void;
}

const FloatingCartButton: React.FC<FloatingCartButtonProps> = ({ itemCount, onClick }) => {
  if (itemCount === 0) return null;

  return (
    <div className="fixed bottom-20 right-4 z-50">
      <Button
        onClick={onClick}
        size="lg"
        className="relative rounded-full w-16 h-16 bg-green-600 hover:bg-green-700 shadow-2xl hover:shadow-3xl transition-all duration-300 animate-bounce"
      >
        <ShoppingCart className="h-7 w-7 text-white" />
        {itemCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 h-7 w-7 rounded-full p-0 flex items-center justify-center text-sm font-bold border-2 border-white animate-pulse"
          >
            {itemCount > 99 ? '99+' : itemCount}
          </Badge>
        )}
      </Button>
    </div>
  );
};

export default FloatingCartButton;
