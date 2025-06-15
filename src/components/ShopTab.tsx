import { useState, useEffect } from 'react';
import { Search, ShoppingBag, Filter, CreditCard, X } from 'lucide-react';
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

/**
 * Provides the main functionality for a shopping tab,
 * including product search, category selection, cart management, and checkout processing.
 * @example
 * ShopTab()
 * [JSX Element]
 * @param none
 * @returns {JSX.Element} Complete shopping interface component with all functionalities.
 * @description
 *   - Utilizes useState hooks to manage search term, selected category, cart items, cart visibility, checkout visibility, payment status, product list, and loading state.
 *   - Requests product data from a server using the Supabase cloud function 'get-products' based on search term and selected category.
 *   - Includes functions for adding, removing, and updating items in the cart, handling user authentication checks.
 *   - Facilitates payment via Stripe integration, managing payment status and user experience feedback.
 */
const ShopTab = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Fetch products
  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, searchTerm]);

  /**
   * Fetches products based on selected category and search term.
   * @example
   * sync()
   * No direct return value, but updates products and loading state.
   * @param {void} - Does not take any direct arguments.
   * @returns {void} No direct return value.
   * @description
   *   - Invokes 'get-products' function from Supabase to retrieve products.
   *   - Throws an error if the products cannot be fetched.
   *   - Updates loading and products state accordingly.
   */
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('get-products', {
        body: { category: selectedCategory, search: searchTerm }
      });

      if (error) throw error;
      setProducts(data.products || []);
      // AGGIUNGO DEBUG LOG
      console.log('[ShopTab] Products loaded:', data.products);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const categories = Array.from(new Set(products.map(p => p.category)));

  /**
  * Adds a product to the cart, updating quantity if it already exists.
  * @example
  * addToCart("12345")
  * // Product added to cart
  * @param {string} productId - The unique identifier of the product to add to the cart.
  * @returns {void} Does not return a value.
  * @description
  *   - Uses a toast message to inform the user when a product is added to the cart for the first time.
  *   - Updates the quantity of the product in the cart if the product already exists.
  *   - This function is part of the ShopTab component in the src/components directory.
  */
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
        toast.success("Product added to cart");
        return [...currentCart, {id: productId, quantity: 1}];
      }
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(currentCart => currentCart.filter(item => item.id !== productId));
    toast.success("Product removed from cart");
  };

  /**
   * Updates product quantity in the shopping cart or removes it if the quantity is zero or less.
   * @example
   * updateProductQuantity("abc123", 5)
   * Updates the product with ID "abc123" to quantity 5 in the cart.
   * @param {string} productId - The ID of the product to update in the cart.
   * @param {number} newQuantity - The new quantity for the product. If zero or less, the product is removed from the cart.
   * @returns {void} Does not return any value.
   * @description
   *   - Automatically removes the product from the cart if the new quantity is zero or less.
   *   - Updates the state of the cart using the `setCart` function.
   */
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
      toast.error("Please login to continue");
      return;
    }
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  /**
   * Initiates a payment process with user authentication and error handling.
   * @example
   * sync()
   * // Initiates the payment process and redirects to Stripe if successful.
   * @param {boolean} {user} - A boolean indicating whether the user is authenticated.
   * @returns {void} Does not return anything.
   * @description
   *   - Redirects the user to Stripe checkout upon successful payment initiation.
   *   - Updates and resets payment and cart status based on the success or failure of the operation.
   *   - Displays error messages using toast notifications if the user is not logged in or if payment fails.
   */
  const processPayment = async () => {
    if (!user) {
      toast.error("Please login to continue");
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

      // Redirect to Stripe checkout
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
      toast.error('Payment failed. Please try again.');
    }
  };

  /** 
   * Get a fallback image URL based on category or product name.
   */
  const getProductFallbackImage = (product: Product) => {
    const category = product.category?.toLowerCase() || '';
    const name = product.name?.toLowerCase() || '';

    if (name.includes('neem') || category.includes('fungicida') || name.includes('powdery mildew')) {
      // Neem Oil / Fungicides
      return 'https://images.unsplash.com/photo-1585687433492-9c648106f131?q=80&w=400&h=400&auto=format&fit=crop';
    }
    if (name.includes('vitality') || category.includes('vitality') || name.includes('immun') || category.includes('nutrient')) {
      // Vitality/Immunity booster
      return 'https://images.unsplash.com/photo-1625246333195-78d73c0c15b1?q=80&w=400&h=400&auto=format&fit=crop';
    }
    if (name.includes('copper') || category.includes('rame')) {
      // Copper fungicide
      return 'https://images.unsplash.com/photo-1635348424978-142afa11e458?q=80&w=400&h=400&auto=format&fit=crop';
    }
    if (name.includes('insect') || name.includes('afid') || category.includes('insetticida')) {
      // Insecticidi
      return 'https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?q=80&w=400&h=400&auto=format&fit=crop';
    }
    if (name.includes('ph') || name.includes('soil') || category.includes('suolo')) {
      // Soil pH kit
      return 'https://images.unsplash.com/photo-1603912699214-92627f304eb6?q=80&w=400&h=400&auto=format&fit=crop';
    }
    // Default: plant in a pot
    return 'https://images.unsplash.com/photo-1464983953574-0892a716854b?q=80&w=400&h=400&auto=format&fit=crop';
  };

  return (
    <div className="flex flex-col pt-6 pb-24">
      <div className="px-4">
        <h2 className="text-2xl font-bold mb-6 text-drplant-green">Phytosanitary Products</h2>
        
        {/* Search and filters */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input 
              className="pl-10 bg-white"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            <Badge 
              onClick={() => setSelectedCategory(null)}
              className={`cursor-pointer ${selectedCategory === null ? 'bg-drplant-blue' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              All
            </Badge>
            {categories.map(category => (
              <Badge 
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`cursor-pointer whitespace-nowrap ${selectedCategory === category ? 'bg-drplant-blue' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                {category}
              </Badge>
            ))}
          </div>
        </div>

        {/* Products grid */}
        {loading ? (
          <div className="text-center py-8">Loading products...</div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              {products.map(product => (
                <Card key={product.id} className="overflow-hidden">
                  <div className="aspect-square overflow-hidden">
                    <img
                      src={
                        product.image_url && product.image_url.trim() !== ""
                          ? product.image_url
                          : getProductFallbackImage(product)
                      }
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={e => {
                        (e.currentTarget as HTMLImageElement).src = getProductFallbackImage(product);
                      }}
                    />
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-sm line-clamp-1">{product.name}</h3>
                    <p className="text-gray-500 text-xs mb-2">{product.category}</p>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-drplant-green">€{product.price.toFixed(2)}</span>
                      <Button 
                        size="sm" 
                        className="h-8 w-8 p-0 rounded-full bg-drplant-blue hover:bg-drplant-blue-dark"
                        onClick={() => addToCart(product.id)}
                        disabled={product.stock_quantity === 0}
                      >
                        <ShoppingBag size={16} />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {products.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No products found matching your search</p>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Cart button */}
      {totalCartItems > 0 && (
        <div className="fixed bottom-20 right-4">
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
            <DialogTitle>Your Cart</DialogTitle>
            <DialogDescription>
              Review your items before checkout
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 my-4">
            {cartItems.length === 0 ? (
              <p className="text-center text-gray-500 py-4">Your cart is empty</p>
            ) : (
              <>
                {cartItems.map(item => (
                  <div key={item.id} className="flex gap-4 border-b pb-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-md flex-shrink-0 overflow-hidden">
                      <img 
                        src={item.product?.image_url} 
                        alt={item.product?.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{item.product?.name}</h4>
                      <p className="text-sm text-gray-500">€{item.product?.price.toFixed(2)} each</p>
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
                    <span>Subtotal</span>
                    <span>€{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between mb-4">
                    <span>Shipping</span>
                    <span>Free</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>€{subtotal.toFixed(2)}</span>
                  </div>
                </div>

                <Button 
                  className="w-full bg-drplant-green hover:bg-drplant-green-dark mt-4"
                  onClick={handleCheckout}
                >
                  Proceed to Checkout
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
            <DialogTitle>Checkout</DialogTitle>
            <DialogDescription>
              Complete your order
            </DialogDescription>
          </DialogHeader>
          
          {paymentStatus === 'idle' && (
            <div className="space-y-4 my-4">
              <div className="border rounded-md p-4">
                <h3 className="font-medium mb-2">Order Summary</h3>
                <div className="space-y-2">
                  {cartItems.map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.product?.name} x {item.quantity}</span>
                      <span>€{((item.product?.price || 0) * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 mt-2 font-bold flex justify-between">
                    <span>Total</span>
                    <span>€{subtotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <Button 
                className="w-full bg-drplant-green hover:bg-drplant-green-dark mt-4"
                onClick={processPayment}
              >
                <CreditCard className="mr-2 h-4 w-4" /> Pay with Stripe
              </Button>
            </div>
          )}
          
          {paymentStatus === 'processing' && (
            <div className="py-8 flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-drplant-green mb-4"></div>
              <p className="text-center">Redirecting to payment...</p>
            </div>
          )}
          
          {paymentStatus === 'success' && (
            <div className="py-8 flex flex-col items-center justify-center">
              <div className="bg-green-100 text-green-600 rounded-full p-3 mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-center">Redirected to Payment!</h3>
              <p className="text-center text-gray-500 mt-2">Complete your payment in the new tab</p>
            </div>
          )}
          
          {paymentStatus === 'error' && (
            <div className="py-8 flex flex-col items-center justify-center">
              <div className="bg-red-100 text-red-600 rounded-full p-3 mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-center">Payment Failed</h3>
              <p className="text-center text-gray-500 mt-2">There was an issue processing your payment</p>
              <Button 
                className="mt-4 bg-drplant-green hover:bg-drplant-green-dark"
                onClick={() => setPaymentStatus('idle')}
              >
                Try Again
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ShopTab;
