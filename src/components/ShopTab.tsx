import React, { useEffect, useState } from 'react';
import { toast } from '@/components/ui/sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingCart, Search, Filter } from 'lucide-react';
import { useApi } from '@/hooks/useApi';

interface SelectedProduct {
  id: string;
  name: string;
  fromDiagnosis: boolean;
}

interface Product {
  id: string;
  name: string;
  description?: string;
  price?: number;
  unit_price?: number;
  category?: string;
  image_url?: string;
  is_active: boolean;
  created_at: string;
}

const ShopTab = () => {
  const [selectedProduct, setSelectedProduct] = useState<SelectedProduct | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [categories, setCategories] = useState<string[]>([]);
  const { callApi } = useApi();

  useEffect(() => {
    // Controlla se c'è un prodotto selezionato dalla diagnosi
    const storedProduct = localStorage.getItem('selectedProduct');
    if (storedProduct) {
      try {
        const product = JSON.parse(storedProduct);
        setSelectedProduct(product);
        localStorage.removeItem('selectedProduct'); // Rimuovi dopo aver letto
        toast.info(`Prodotto raccomandato dalla diagnosi: ${product.name}`);
      } catch (error) {
        console.error('Error parsing selected product:', error);
      }
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, searchTerm]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category', selectedCategory);
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`/functions/v1/get-products?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch products');
      
      const data = await response.json();
      const productList = data.products || [];
      setProducts(productList);

      // Estrai le categorie uniche con proper typing
      const categoryList = productList
        .map((p: Product) => p.category)
        .filter((category): category is string => typeof category === 'string' && category.length > 0);
      const uniqueCategories: string[] = [...new Set(categoryList)];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Errore nel caricamento dei prodotti');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product: Product) => {
    // Implementazione futura per aggiungere al carrello
    toast.success(`${product.name} aggiunto al carrello!`);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = !searchTerm || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    
    return matchesSearch && matchesCategory && product.is_active;
  });

  return (
    <div className="space-y-6 p-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Negozio</h2>
        <p className="text-gray-600">Trova i prodotti migliori per le tue piante</p>
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

      {/* Filtri e ricerca */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Cerca prodotti..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Tutte le categorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Tutte le categorie</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-drplant-green mx-auto mb-4"></div>
          <p className="text-gray-500">Caricamento prodotti...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Nessun prodotto trovato</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                {product.image_url && (
                  <div className="w-full h-48 bg-gray-100 rounded-lg overflow-hidden mb-3">
                    <img 
                      src={product.image_url} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardTitle className="text-lg line-clamp-2">{product.name}</CardTitle>
                {product.category && (
                  <Badge variant="outline" className="w-fit">
                    {product.category}
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {product.description && (
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {product.description}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <div className="text-lg font-bold text-drplant-green">
                    €{(product.price || product.unit_price || 0).toFixed(2)}
                  </div>
                  <Button
                    onClick={() => handleAddToCart(product)}
                    className="bg-drplant-green hover:bg-drplant-green-dark"
                    size="sm"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Aggiungi
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ShopTab;
