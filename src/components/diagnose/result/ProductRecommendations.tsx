
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { MessageCircle, Star, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';

interface Product {
  id?: string;
  name: string;
  description?: string;
  price?: number;
  rating?: number;
  image?: string;
}

interface ProductRecommendationsProps {
  products: Product[];
}

const ProductRecommendations: React.FC<ProductRecommendationsProps> = ({ products }) => {
  const [expandedProducts, setExpandedProducts] = useState(false);
  
  const handleAddToCart = (product: Product) => {
    toast.success(`${product.name} aggiunto al carrello`, {
      description: "Vai alla sezione Shop per completare l'acquisto"
    });
  };
  
  return (
    <Card>
      <CardHeader className="bg-gradient-to-r from-drplant-green/10 to-transparent">
        <CardTitle className="text-md lg:text-lg flex items-center">
          <ShoppingCart className="h-5 w-5 mr-2 text-drplant-green" />
          Prodotti consigliati
        </CardTitle>
        <CardDescription>
          Prodotti specifici per trattare questa patologia
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-4">
        <div className="space-y-3">
          {products.slice(0, expandedProducts ? products.length : 2).map((product, index) => (
            <div 
              key={product.id || index} 
              className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-drplant-green/30 hover:bg-drplant-green/5 transition-all"
            >
              {product.image ? (
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className="h-16 w-16 object-cover rounded-md" 
                />
              ) : (
                <div className="h-16 w-16 bg-gray-100 rounded-md flex items-center justify-center text-gray-400">
                  <ShoppingCart className="h-6 w-6" />
                </div>
              )}
              
              <div className="flex-1">
                <h4 className="font-medium text-drplant-blue-dark">{product.name}</h4>
                {product.description && <p className="text-xs text-gray-600 line-clamp-2">{product.description}</p>}
                
                <div className="flex items-center justify-between mt-1">
                  {product.price && (
                    <span className="text-sm font-semibold">€{product.price.toFixed(2)}</span>
                  )}
                  
                  {product.rating && (
                    <div className="flex items-center">
                      <Star className="h-3 w-3 text-amber-500 mr-1" />
                      <span className="text-xs">{product.rating}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <Button 
                size="sm" 
                variant="ghost"
                className="text-drplant-green hover:text-drplant-green-dark hover:bg-drplant-green/10"
                onClick={() => handleAddToCart(product)}
              >
                <ShoppingCart className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        
        {products.length > 2 && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-3 text-xs w-full text-drplant-blue hover:text-drplant-blue-dark"
            onClick={() => setExpandedProducts(!expandedProducts)}
          >
            {expandedProducts ? "Mostra meno" : `Mostra altri ${products.length - 2} prodotti`}
          </Button>
        )}
      </CardContent>
      
      <CardFooter className="border-t pt-4 flex justify-between">
        <Button variant="outline" size="sm" className="text-gray-600">
          <MessageCircle className="h-4 w-4 mr-1" /> Consulta esperto
        </Button>
        <Button size="sm" className="bg-drplant-green hover:bg-drplant-green-dark">
          <ShoppingCart className="h-4 w-4 mr-1" /> Vai allo shop
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProductRecommendations;
