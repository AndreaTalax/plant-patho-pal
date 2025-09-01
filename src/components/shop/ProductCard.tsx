
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart } from 'lucide-react';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url?: string;
}

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden">
          {product.image_url ? (
            <img 
              src={product.image_url} 
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <ShoppingCart className="w-12 h-12" />
            </div>
          )}
        </div>
        <CardTitle className="text-base line-clamp-2">{product.name}</CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 pb-3">
        <CardDescription className="text-sm line-clamp-3">
          {product.description}
        </CardDescription>
      </CardContent>
      
      <CardFooter className="pt-0 flex items-center justify-between">
        <span className="text-lg font-bold text-green-600">
          €{product.price.toFixed(2)}
        </span>
        <Button 
          onClick={() => onAddToCart(product)}
          size="sm"
          className="bg-green-600 hover:bg-green-700"
        >
          <ShoppingCart className="w-4 h-4 mr-1" />
          Aggiungi
        </Button>
      </CardFooter>
    </Card>
  );
};
