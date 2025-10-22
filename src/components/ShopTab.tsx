import { useState, useEffect } from 'react';
import { Search, ShoppingBag, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  stock_quantity: number;
}

interface CartItem {
  id: string;
  quantity: number;
  product?: Product;
}

const ShopTab = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductDetailOpen, setIsProductDetailOpen] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Traduzioni categorie
  const categoryTranslations: Record<string, string> = {
    'Fungicides': 'Fungicidi',
    'Insecticides': 'Insetticidi',
    'Fertilizers': 'Fertilizzanti',
    'Nutrients': 'Nutrienti',
    'Biostimolanti': 'Biostimolanti',
    'Fertilizzanti': 'Fertilizzanti',
    'Tools': 'Attrezzi',
    'Pest Control': 'Antiparassitari',
    'Soil': 'Terricci',
    'Seeds': 'Semi'
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, searchTerm]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      const supabaseUrl = 'https://otdmqmpxukifoxjlgzmq.supabase.co';
      const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90ZG1xbXB4dWtpZm94amxnem1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NDQ5ODksImV4cCI6MjA2MjIyMDk4OX0.re4vu-banv0K-hBFNRYZGy5VucPkk141Pa--x-QiGr4';
      
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category', selectedCategory);
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await fetch(`${supabaseUrl}/functions/v1/get-products?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch products');
      
      const result = await response.json();
      
      // Filtra solo prodotti per la cura delle piante
      const plantCareProducts = (result.products || []).filter((p: Product) => {
        const category = p.category?.toLowerCase() || '';
        const name = p.name?.toLowerCase() || '';
        
        // Escludi categorie non pertinenti
        const excludeKeywords = ['clothing', 'fashion', 'shoes', 'electronics', 'phone', 'computer', 'laptop'];
        return !excludeKeywords.some(keyword => 
          category.includes(keyword) || name.includes(keyword)
        );
      });
      
      setProducts(plantCareProducts);
      console.log('[ShopTab] Products loaded:', plantCareProducts.length);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Errore nel caricamento dei prodotti');
    } finally {
      setLoading(false);
    }
  };

  const categories = Array.from(new Set(products.map(p => p.category)));

  const addToCart = (productId: string) => {
    setCart(currentCart => {
      const existingItem = currentCart.find(item => item.id === productId);
      if (existingItem) {
        return currentCart.map(item => 
          item.id === productId 
            ? {...item, quantity: item.quantity + 1}
            : item
        );
      } else {
        toast.success("Prodotto aggiunto al carrello");
        return [...currentCart, {id: productId, quantity: 1}];
      }
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(currentCart => currentCart.filter(item => item.id !== productId));
    toast.success("Prodotto rimosso dal carrello");
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCart(currentCart => 
      currentCart.map(item => 
        item.id === productId 
          ? {...item, quantity: newQuantity}
          : item
      )
    );
  };

  const cartItems = cart.map(item => {
    const product = products.find(p => p.id === item.id);
    return { ...item, product };
  });

  const totalCartItems = cart.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cartItems.reduce((total, item) => total + (item.product?.price || 0) * item.quantity, 0);

  const handleCheckout = () => {
    if (!user) {
      toast.error("Effettua il login per continuare");
      return;
    }
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const processPayment = async () => {
    if (!user) {
      toast.error("Effettua il login per continuare");
      return;
    }

    setPaymentStatus('processing');
    
    try {
      const items = cartItems.map(item => ({
        name: item.product?.name,
        price: item.product?.price,
        quantity: item.quantity
      }));

      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          items,
          successUrl: `${window.location.origin}/payment-success`,
          cancelUrl: `${window.location.origin}/payment-canceled`
        }
      });

      if (error) throw error;

      window.open(data.url, '_blank');
      
      setPaymentStatus('success');
      setTimeout(() => {
        setCart([]);
        setIsCheckoutOpen(false);
        setPaymentStatus('idle');
      }, 2000);
      
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentStatus('error');
      toast.error('Pagamento fallito. Riprova.');
    }
  };

  const getProductFallbackImage = (product: Product) => {
    const category = product.category?.toLowerCase() || '';
    const name = product.name?.toLowerCase() || '';

    // Propoli / Biostimolanti
    if (name.includes('propol') || name.includes('spray protettivo')) {
      return 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?q=80&w=400&h=400&auto=format&fit=crop';
    }
    
    // Concime / Fertilizzante organico
    if (name.includes('concime') || name.includes('pellettato') || name.includes('organico') || category.includes('fertilizzanti')) {
      return 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?q=80&w=400&h=400&auto=format&fit=crop';
    }
    
    // Olio di Neem / Fungicidi
    if (name.includes('neem') || name.includes('fungicida') || name.includes('oidio')) {
      return 'https://images.unsplash.com/photo-1556909212-d5b604d0c90d?q=80&w=400&h=400&auto=format&fit=crop';
    }
    
    // Rame / Poltiglia bordolese
    if (name.includes('rame') || name.includes('copper') || name.includes('bordolese')) {
      return 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?q=80&w=400&h=400&auto=format&fit=crop';
    }
    
    // Insetticidi / Antiparassitari
    if (name.includes('insett') || name.includes('afid') || name.includes('parassit') || category.includes('insetticid')) {
      return 'https://images.unsplash.com/photo-1583324113626-70df0f4deaab?q=80&w=400&h=400&auto=format&fit=crop';
    }
    
    // Kit pH / Test suolo
    if (name.includes('ph') || name.includes('test') || name.includes('analisi')) {
      return 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?q=80&w=400&h=400&auto=format&fit=crop';
    }
    
    // Attrezzi da giardino
    if (category.includes('attrezzi') || name.includes('vanga') || name.includes('rastrello')) {
      return 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?q=80&w=400&h=400&auto=format&fit=crop';
    }
    
    // Terricci
    if (category.includes('terricci') || name.includes('terreno') || name.includes('substrato')) {
      return 'https://images.unsplash.com/photo-1585990418792-214fbb1f75f0?q=80&w=400&h=400&auto=format&fit=crop';
    }
    
    // Default: pianta in vaso
    return 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?q=80&w=400&h=400&auto=format&fit=crop';
  };

  const openProductDetail = (product: Product) => {
    setSelectedProduct(product);
    setIsProductDetailOpen(true);
  };

  const translateCategory = (category: string) => {
    return categoryTranslations[category] || category;
  };

  return (
    <div className="flex flex-col pt-6 pb-24">
      <div className="px-4">
        <h2 className="text-2xl font-bold mb-6 text-drplant-green">🌱 Prodotti per la Cura delle Piante</h2>
        
        {/* Search and filters */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input 
              className="pl-10 bg-white"
              placeholder="Cerca prodotti..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            <Badge 
              onClick={() => setSelectedCategory(null)}
              className={`cursor-pointer ${selectedCategory === null ? 'bg-drplant-blue' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              Tutti
            </Badge>
            {categories.map(category => (
              <Badge 
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`cursor-pointer whitespace-nowrap ${selectedCategory === category ? 'bg-drplant-blue' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                {translateCategory(category)}
              </Badge>
            ))}
          </div>
        </div>

        {/* Products grid */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-drplant-green mx-auto mb-4"></div>
            <p>Caricamento prodotti...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              {products.map(product => (
                <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div 
                    className="aspect-square overflow-hidden cursor-pointer bg-gray-100"
                    onClick={() => openProductDetail(product)}
                  >
                    <img
                      src={
                        product.image_url && product.image_url.trim() !== ""
                          ? product.image_url
                          : getProductFallbackImage(product)
                      }
                      alt={product.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                      onError={e => {
                        (e.currentTarget as HTMLImageElement).src = getProductFallbackImage(product);
                      }}
                    />
                  </div>
                  <div className="p-3">
                    <h3 
                      className="font-medium text-sm line-clamp-2 cursor-pointer hover:text-drplant-green min-h-[2.5rem]"
                      onClick={() => openProductDetail(product)}
                    >
                      {product.name}
                    </h3>
                    <p className="text-gray-500 text-xs mb-2">{translateCategory(product.category)}</p>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-drplant-green text-lg">€{product.price.toFixed(2)}</span>
                      <Button 
                        size="sm" 
                        className="h-8 w-8 p-0 rounded-full bg-drplant-blue hover:bg-drplant-blue-dark"
                        onClick={() => addToCart(product.id)}
                        disabled={product.stock_quantity === 0}
                      >
                        <ShoppingBag size={16} />
                      </Button>
                    </div>
                    {product.stock_quantity === 0 && (
                      <p className="text-xs text-red-500 mt-1">Esaurito</p>
                    )}
                  </div>
                </Card>
              ))}
            </div>

            {products.length === 0 && !loading && (
              <div className="text-center py-12 text-gray-500">
                <ShoppingBag className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">Nessun prodotto trovato</p>
                <p className="text-sm mt-2">Prova a modificare i filtri di ricerca</p>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Cart button */}
      {totalCartItems > 0 && (
        <div className="fixed bottom-20 right-4 z-50">
          <Button 
            className="h-14 w-14 rounded-full shadow-lg bg-drplant-green hover:bg-drplant-green-dark"
            onClick={() => setIsCartOpen(true)}
          >
            <ShoppingBag className="h-6 w-6" />
            <span className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold">
              {totalCartItems}
            </span>
          </Button>
        </div>
      )}

      {/* Cart Dialog */}
      <Dialog open={isCartOpen} onOpenChange={setIsCartOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>🛒 Il Tuo Carrello</DialogTitle>
            <DialogDescription>
              Controlla i tuoi articoli prima del checkout
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 my-4">
            {cartItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ShoppingBag className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Il tuo carrello è vuoto</p>
              </div>
            ) : (
              <>
                {cartItems.map(item => (
                  <div key={item.id} className="flex gap-4 border-b pb-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-md flex-shrink-0 overflow-hidden">
                      <img 
                        src={item.product?.image_url || getProductFallbackImage(item.product!)} 
                        alt={item.product?.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm line-clamp-2">{item.product?.name}</h4>
                      <p className="text-sm text-gray-500">€{item.product?.price.toFixed(2)} cad.</p>
                      <div className="flex justify-between items-center mt-2">
                        <div className="flex items-center border rounded-md">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            -
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            +
                          </Button>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-red-500 h-8 w-8 p-0"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <X size={16} />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="border-t pt-4">
                  <div className="flex justify-between mb-2">
                    <span>Subtotale</span>
                    <span>€{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between mb-4">
                    <span>Spedizione</span>
                    <span className="text-green-600 font-medium">Gratuita</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>Totale</span>
                    <span className="text-drplant-green">€{subtotal.toFixed(2)}</span>
                  </div>
                </div>

                <Button 
                  className="w-full bg-drplant-green hover:bg-drplant-green-dark mt-4"
                  onClick={handleCheckout}
                >
                  Procedi al Pagamento
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Checkout Dialog */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>💳 Pagamento</DialogTitle>
            <DialogDescription>
              Completa il tuo ordine in modo sicuro
            </DialogDescription>
          </DialogHeader>
          
          {paymentStatus === 'idle' && (
            <div className="space-y-4 my-4">
              <div className="border rounded-lg p-4 bg-gray-50">
                <h3 className="font-medium mb-3">📋 Riepilogo Ordine</h3>
                <div className="space-y-2">
                  {cartItems.map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-700">{item.product?.name} × {item.quantity}</span>
                      <span className="font-medium">€{((item.product?.price || 0) * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 mt-2 font-bold flex justify-between text-base">
                    <span>Totale</span>
                    <span className="text-drplant-green">€{subtotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <Button 
                className="w-full bg-drplant-green hover:bg-drplant-green-dark h-12"
                onClick={processPayment}
              >
                <ShoppingBag className="mr-2 h-4 w-4" /> Paga con Stripe
              </Button>
            </div>
          )}
          
          {paymentStatus === 'processing' && (
            <div className="py-8 flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-drplant-green mb-4"></div>
              <p className="text-center font-medium">Reindirizzamento al pagamento...</p>
              <p className="text-sm text-gray-500 mt-2">Attendere prego</p>
            </div>
          )}
          
          {paymentStatus === 'success' && (
            <div className="py-8 flex flex-col items-center justify-center">
              <div className="bg-green-100 text-green-600 rounded-full p-3 mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-center">✅ Reindirizzato!</h3>
              <p className="text-center text-gray-500 mt-2 text-sm">Completa il pagamento nella nuova scheda</p>
            </div>
          )}
          
          {paymentStatus === 'error' && (
            <div className="py-8 flex flex-col items-center justify-center">
              <div className="bg-red-100 text-red-600 rounded-full p-3 mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-center">❌ Pagamento Fallito</h3>
              <p className="text-center text-gray-500 mt-2 text-sm">Si è verificato un problema</p>
              <Button 
                className="mt-4 bg-drplant-green hover:bg-drplant-green-dark"
                onClick={() => setPaymentStatus('idle')}
              >
                Riprova
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Product Detail Dialog */}
      <Dialog open={isProductDetailOpen} onOpenChange={setIsProductDetailOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          {selectedProduct && (
            <>
              <DialogHeader>
                <DialogTitle className="text-lg">{selectedProduct.name}</DialogTitle>
                <DialogDescription>
                  {translateCategory(selectedProduct.category)}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 my-4">
                <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
                  <img
                    src={
                      selectedProduct.image_url && selectedProduct.image_url.trim() !== ""
                        ? selectedProduct.image_url
                        : getProductFallbackImage(selectedProduct)
                    }
                    alt={selectedProduct.name}
                    className="w-full h-full object-cover"
                    onError={e => {
                      (e.currentTarget as HTMLImageElement).src = getProductFallbackImage(selectedProduct);
                    }}
                  />
                </div>
                
                <div>
                  <p className="text-gray-600 mb-4 text-sm leading-relaxed">{selectedProduct.description}</p>
                  
                  <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
                    <Badge variant="outline" className="text-xs">{translateCategory(selectedProduct.category)}</Badge>
                    <span className="text-2xl font-bold text-drplant-green">
                      €{selectedProduct.price.toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="mb-4 text-sm">
                    <p className={selectedProduct.stock_quantity > 0 ? 'text-green-600' : 'text-red-500'}>
                      {selectedProduct.stock_quantity > 0 
                        ? `✓ ${selectedProduct.stock_quantity} pezzi disponibili` 
                        : '✗ Esaurito'
                      }
                    </p>
                  </div>
                  
                  <Button 
                    className="w-full bg-drplant-green hover:bg-drplant-green-dark h-12"
                    onClick={() => {
                      addToCart(selectedProduct.id);
                      setIsProductDetailOpen(false);
                    }}
                    disabled={selectedProduct.stock_quantity === 0}
                  >
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    {selectedProduct.stock_quantity === 0 ? 'Non Disponibile' : 'Aggiungi al Carrello'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ShopTab;
