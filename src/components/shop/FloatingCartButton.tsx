
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
        className="relative rounded-full w-14 h-14 bg-green-600 hover:bg-green-700 shadow-lg"
      >
        <ShoppingCart className="h-6 w-6 text-white" />
        {itemCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs font-bold"
          >
            {itemCount > 99 ? '99+' : itemCount}
          </Badge>
        )}
      </Button>
    </div>
  );
};

export default FloatingCartButton;
