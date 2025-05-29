
import { useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Product } from './types';
import { MOCK_PRODUCTS } from './types';

interface ProductRecommendationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSendRecommendations: (products: Product[]) => void;
  username?: string;
}

const ProductRecommendationDialog = ({
  isOpen,
  onClose,
  onSendRecommendations,
  username
}: ProductRecommendationDialogProps) => {
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);

  const toggleProductSelection = (product: Product) => {
    setSelectedProducts(prev => {
      const isAlreadySelected = prev.some(p => p.id === product.id);
      
      if (isAlreadySelected) {
        return prev.filter(p => p.id !== product.id);
      } else {
        return [...prev, product];
      }
    });
  };

  const handleSendRecommendations = () => {
    onSendRecommendations(selectedProducts);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Recommend Products</DialogTitle>
          <DialogDescription>
            Select products to recommend to {username}
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4 space-y-3 max-h-80 overflow-y-auto">
          {MOCK_PRODUCTS.map(product => (
            <div 
              key={product.id}
              className={`
                border rounded-lg p-3 flex items-center gap-3 cursor-pointer
                ${selectedProducts.some(p => p.id === product.id) ? 'border-drplant-green bg-drplant-green/5' : 'border-gray-200'}
              `}
              onClick={() => toggleProductSelection(product)}
            >
              <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="object-cover w-full h-full" />
                ) : (
                  <ShoppingBag className="w-6 h-6 text-gray-400" />
                )}
              </div>
              
              <div className="flex-1">
                <h4 className="font-medium">{product.name}</h4>
                <p className="text-sm text-gray-500 line-clamp-2">{product.description}</p>
                <p className="text-sm font-semibold mt-1">{product.price.toFixed(2)} €</p>
              </div>
              
              <div className={`w-5 h-5 rounded-full border ${
                selectedProducts.some(p => p.id === product.id) ? 'bg-drplant-green border-drplant-green' : 'border-gray-300'
              }`}>
                {selectedProducts.some(p => p.id === product.id) && (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-5 h-5">
                    <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex justify-end gap-3 mt-4">
          <Button 
            variant="outline" 
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSendRecommendations}
            disabled={selectedProducts.length === 0}
            className="bg-drplant-green hover:bg-drplant-green-dark"
          >
            Send Recommendations
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductRecommendationDialog;
