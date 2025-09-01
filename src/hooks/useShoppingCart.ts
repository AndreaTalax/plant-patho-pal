
import { useState } from 'react';
import { toast } from 'sonner';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export const useShoppingCart = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const handleAddToCart = (product: Product) => {
    setCartItems(prev => {
      const existingItem = prev.find(item => item.id === product.id);
      if (existingItem) {
        toast.success(`Quantità aggiornata per ${product.name}`);
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        toast.success(`${product.name} aggiunto al carrello`);
        return [...prev, { ...product, quantity: 1 }];
      }
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCartItems(prev => {
      const item = prev.find(item => item.id === productId);
      if (item) {
        toast.success(`${item.name} rimosso dal carrello`);
      }
      return prev.filter(item => item.id !== productId);
    });
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(productId);
      return;
    }
    
    setCartItems(prev =>
      prev.map(item =>
        item.id === productId
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
    toast.success('Carrello svuotato');
  };

  return {
    cartItems,
    handleAddToCart,
    handleRemoveFromCart,
    handleUpdateQuantity,
    clearCart
  };
};
