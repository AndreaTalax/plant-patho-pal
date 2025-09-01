import React, { useEffect, useState } from 'react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { ShoppingBag, Star, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/context/CartContext';
import CartDrawer from '@/components/shop/CartDrawer';

interface SelectedProduct {
  id: string;
  name: string;
  fromDiagnosis: boolean;
}

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  image_url?: string;
  stock_quantity?: number;
  is_active: boolean;
}

const ShopTab = () => {
  const [selectedProduct, setSelectedProduct] = useState<SelectedProduct | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { addItem } = useCart();

  useEffect(() => {
    // Controlla se c'è un prodotto selezionato dalla diagnosi
    const storedProduct = localStorage.getItem('selectedProduct');
    if (storedProduct) {
      try {
        const product = JSON.parse(storedProduct);
        setSelectedProduct(product);
        localStorage.removeItem('selectedProduct');
        toast.info(`Prodotto raccomandato dalla diagnosi: ${product.name}`);
      } catch (error) {
        console.error('Error parsing selected product:', error);
      }
    }

    // Carica tutti i prodotti dal database
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('get-products');
      
      if (error) {
        console.error('Error loading products:', error);
        toast.error('Errore nel caricamento dei prodotti');
        return;
      }

      if (data?.products) {
        setProducts(data.products);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Errore nel caricamento dei prodotti');
    } finally {
      setLoading(false);
    }
  };

  const filterProductsByCategory = (category: string) => {
    setSelectedCategory(category);
  };

  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(product => product.category?.toLowerCase() === selectedCategory.toLowerCase());

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];

  const handleAddToCart = (product: Product) => {
    if (product.stock_quantity === 0) {
      toast.error('Prodotto non disponibile');
      return;
    }

    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Negozio</h2>
            <p className="text-gray-600">Trova i prodotti migliori per le tue piante</p>
          </div>
          <CartDrawer />
        </div>
      </div>

      {/* Prodotto selezionato dalla diagnosi */}
      {selectedProduct && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-800 mb-2">
            Prodotto raccomandato dalla diagnosi
          </h3>
          <p className="text-green-700">{selectedProduct.name}</p>
          <p className="text-sm text-green-600 mt-1">
            Questo prodotto è stato suggerito in base alla tua diagnosi
          </p>
        </div>
      )}

      {/* Filtri per categoria */}
      <div className="flex flex-wrap gap-2 justify-center">
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            size="sm"
            onClick={() => filterProductsByCategory(category)}
            className="capitalize"
          >
            {category === 'all' ? 'Tutti' : category}
          </Button>
        ))}
      </div>

      {/* Lista prodotti */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Caricamento prodotti...</p>
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                  {product.image_url ? (
                    <img 
                      src={product.image_url} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {product.name}
                  </h3>
                  
                  {product.description && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {product.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-bold text-lg text-green-600">
                      €{product.price.toFixed(2)}
                    </span>
                    
                    {product.category && (
                      <Badge variant="secondary" className="text-xs">
                        {product.category}
                      </Badge>
                    )}
                  </div>
                  
                  {product.stock_quantity !== undefined && (
                    <p className="text-xs text-gray-500 mt-1">
                      {product.stock_quantity > 0 
                        ? `${product.stock_quantity} disponibili`
                        : 'Esaurito'
                      }
                    </p>
                  )}
                </div>
              </div>
              
              <Button 
                className="w-full mt-3 bg-green-600 hover:bg-green-700"
                size="sm"
                disabled={product.stock_quantity === 0}
                onClick={() => handleAddToCart(product)}
              >
                <ShoppingBag className="w-4 h-4 mr-2" />
                {product.stock_quantity === 0 ? 'Esaurito' : 'Aggiungi al carrello'}
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Nessun prodotto trovato
          </h3>
          <p className="text-gray-600">
            {selectedCategory === 'all' 
              ? 'Non ci sono prodotti disponibili al momento.'
              : `Nessun prodotto nella categoria "${selectedCategory}".`
            }
          </p>
          <Button 
            onClick={loadProducts}
            variant="outline"
            className="mt-4"
          >
            Ricarica prodotti
          </Button>
        </div>
      )}
    </div>
  );
};

export default ShopTab;
