
import { useState } from 'react';
import { Search, ShoppingBag, Filter, CreditCard, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from '@/components/ui/sonner';

// Mock product data
const PRODUCTS = [
  {
    id: '1',
    name: 'Organic Neem Oil',
    category: 'Fungicides',
    price: 19.99,
    image: 'https://images.unsplash.com/photo-1585687433492-9c648106f131?q=80&w=400&h=400&auto=format&fit=crop',
    description: 'Natural remedy for powdery mildew and aphids. Safe for organic gardening.',
  },
  {
    id: '2',
    name: 'Plant Vitality Boost',
    category: 'Nutrients',
    price: 15.50,
    image: 'https://images.unsplash.com/photo-1625246333195-78d73c0c15b1?q=80&w=400&h=400&auto=format&fit=crop',
    description: 'Enhances plant immunity and growth. Ideal for recovering plants.',
  },
  {
    id: '3',
    name: 'Copper Fungicide',
    category: 'Fungicides',
    price: 24.95,
    image: 'https://images.unsplash.com/photo-1635348424978-142afa11e458?q=80&w=400&h=400&auto=format&fit=crop',
    description: 'Effective against leaf spots and blights. License-free formula.',
  },
  {
    id: '4',
    name: 'Insecticidal Soap',
    category: 'Insecticides',
    price: 12.99,
    image: 'https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?q=80&w=400&h=400&auto=format&fit=crop',
    description: 'Controls aphids, mites and whiteflies. Safe for beneficial insects.',
  },
  {
    id: '5',
    name: 'Soil pH Tester Kit',
    category: 'Tools',
    price: 29.95,
    image: 'https://images.unsplash.com/photo-1603912699214-92627f304eb6?q=80&w=400&h=400&auto=format&fit=crop',
    description: 'Accurately measure soil pH levels. Essential for plant health diagnosis.',
  }
];

const ShopTab = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<Array<{id: string, quantity: number}>>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');

  const filteredProducts = PRODUCTS.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory ? product.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(PRODUCTS.map(p => p.category)));

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
    const product = PRODUCTS.find(p => p.id === item.id);
    return {
      ...item,
      product
    };
  });

  const totalCartItems = cart.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cartItems.reduce((total, item) => total + (item.product?.price || 0) * item.quantity, 0);

  const handleCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const processPayment = () => {
    setPaymentStatus('processing');
    
    // Simulate payment processing
    setTimeout(() => {
      setPaymentStatus('success');
      // Clear cart after successful payment
      setTimeout(() => {
        setCart([]);
        setIsCheckoutOpen(false);
        setPaymentStatus('idle');
        toast.success("Payment successful! Your order has been placed.");
      }, 2000);
    }, 3000);
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
        <div className="grid grid-cols-2 gap-4">
          {filteredProducts.map(product => (
            <Card key={product.id} className="overflow-hidden">
              <div className="aspect-square overflow-hidden">
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-3">
                <h3 className="font-medium text-sm line-clamp-1">{product.name}</h3>
                <p className="text-gray-500 text-xs mb-2">{product.category}</p>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-drplant-green">${product.price.toFixed(2)}</span>
                  <Button 
                    size="sm" 
                    className="h-8 w-8 p-0 rounded-full bg-drplant-blue hover:bg-drplant-blue-dark"
                    onClick={() => addToCart(product.id)}
                  >
                    <ShoppingBag size={16} />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No products found matching your search</p>
          </div>
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
                        src={item.product?.image} 
                        alt={item.product?.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{item.product?.name}</h4>
                      <p className="text-sm text-gray-500">${item.product?.price.toFixed(2)} each</p>
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
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between mb-4">
                    <span>Shipping</span>
                    <span>Free</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>${subtotal.toFixed(2)}</span>
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
              Complete your order by entering payment details
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
                      <span>${((item.product?.price || 0) * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 mt-2 font-bold flex justify-between">
                    <span>Total</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <div className="border rounded-md p-4">
                <h3 className="font-medium mb-4">Payment Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-500 mb-1 block">Card Number</label>
                    <Input placeholder="4242 4242 4242 4242" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-500 mb-1 block">Expiry Date</label>
                      <Input placeholder="MM/YY" />
                    </div>
                    <div>
                      <label className="text-sm text-gray-500 mb-1 block">CVC</label>
                      <Input placeholder="123" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 mb-1 block">Cardholder Name</label>
                    <Input placeholder="John Doe" />
                  </div>
                </div>
              </div>
              
              <Button 
                className="w-full bg-drplant-green hover:bg-drplant-green-dark mt-4"
                onClick={processPayment}
              >
                <CreditCard className="mr-2 h-4 w-4" /> Pay ${subtotal.toFixed(2)}
              </Button>
              
              <p className="text-xs text-center text-gray-500 mt-4">
                Your payment is secured with SSL encryption. We do not store your card details.
              </p>
            </div>
          )}
          
          {paymentStatus === 'processing' && (
            <div className="py-8 flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-drplant-green mb-4"></div>
              <p className="text-center">Processing your payment...</p>
              <p className="text-center text-sm text-gray-500 mt-2">Please do not close this window</p>
            </div>
          )}
          
          {paymentStatus === 'success' && (
            <div className="py-8 flex flex-col items-center justify-center">
              <div className="bg-green-100 text-green-600 rounded-full p-3 mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-center">Payment Successful!</h3>
              <p className="text-center text-gray-500 mt-2">Thank you for your purchase</p>
              <p className="text-center text-gray-500 mt-4">Order confirmation has been sent to your email</p>
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
