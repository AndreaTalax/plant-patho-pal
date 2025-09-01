
import React from 'react';
import { ShoppingBag, Plus, Minus, Trash2, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { CartItem } from '@/hooks/useCart';
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/context/AuthContext';

interface CartDialogProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  totalPrice: number;
}

const CartDialog: React.FC<CartDialogProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  totalPrice
}) => {
  const { userProfile } = useAuth();

  const handleCheckout = async () => {
    if (!userProfile) {
      toast.error('Devi essere autenticato per procedere al checkout');
      return;
    }

    if (items.length === 0) {
      toast.error('Il carrello è vuoto');
      return;
    }

    try {
      // Utilizza il sistema di pagamento Netlify esistente
      const response = await fetch('/.netlify/functions/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await import('@/integrations/supabase/client')).supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          items: items.map(item => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity
          })),
          successUrl: `${window.location.origin}/?payment=success`,
          cancelUrl: `${window.location.origin}/?payment=cancelled`
        })
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.url) {
        // Salva il carrello per dopo il pagamento
        localStorage.setItem('checkout_cart', JSON.stringify(items));
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Errore durante il checkout. Riprova più tardi.');
    }
  };

  if (items.length === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              Carrello
            </DialogTitle>
            <DialogDescription>
              Il tuo carrello della spesa
            </DialogDescription>
          </DialogHeader>
          
          <div className="text-center py-8">
            <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Carrello vuoto
            </h3>
            <p className="text-gray-600 mb-4">
              Aggiungi alcuni prodotti per iniziare
            </p>
            <Button onClick={onClose} variant="outline">
              Continua lo shopping
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            Carrello ({items.length} {items.length === 1 ? 'prodotto' : 'prodotti'})
          </DialogTitle>
          <DialogDescription>
            Rivedi i tuoi prodotti prima del checkout
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto max-h-96">
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                  {item.image_url ? (
                    <img 
                      src={item.image_url} 
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ShoppingBag className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">{item.name}</h4>
                  {item.description && (
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                  <p className="font-bold text-green-600 mt-1">
                    €{item.price.toFixed(2)}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                    className="w-8 h-8 p-0"
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  
                  <Badge variant="secondary" className="min-w-[2rem] text-center">
                    {item.quantity}
                  </Badge>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                    className="w-8 h-8 p-0"
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onRemoveItem(item.id)}
                    className="w-8 h-8 p-0 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="border-t pt-4 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">Totale:</span>
            <span className="text-xl font-bold text-green-600">
              €{totalPrice.toFixed(2)}
            </span>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={onClearCart}
              variant="outline"
              className="flex-1"
            >
              Svuota carrello
            </Button>
            
            <Button 
              onClick={handleCheckout}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Checkout
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CartDialog;
