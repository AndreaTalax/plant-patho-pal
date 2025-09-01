
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import CartDialog from "@/components/shop/CartDialog";
import FloatingCartButton from "@/components/shop/FloatingCartButton";
import { useShoppingCart } from "@/hooks/useShoppingCart";
import { ProductCard } from "@/components/shop/ProductCard";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { products } from "@/data/products";

const ShopTab = () => {
  const [showCart, setShowCart] = useState(false);
  const { cartItems, handleAddToCart, handleRemoveFromCart, handleUpdateQuantity, clearCart } = useShoppingCart();
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState([0, 200]);
  const [filteredProducts, setFilteredProducts] = useState(products);

  useEffect(() => {
    const filtered = products.filter(product => {
      const searchMatch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      const priceMatch = product.price >= priceRange[0] && product.price <= priceRange[1];
      return searchMatch && priceMatch;
    });
    setFilteredProducts(filtered);
  }, [searchTerm, priceRange]);

  const totalPrice = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="space-y-6 pb-24 pt-8 px-4">
      {/* Header with prominent cart button */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Negozio</h2>
          <p className="text-gray-600">
            Trova i prodotti migliori per la cura delle tue piante
          </p>
        </div>
        <Button
          onClick={() => setShowCart(true)}
          size="lg"
          className="relative bg-green-600 hover:bg-green-700 text-white px-6 py-3 text-base font-semibold shadow-lg"
        >
          <ShoppingCart className="h-5 w-5 mr-2" />
          Carrello
          {totalItems > 0 && (
            <Badge 
              variant="destructive" 
              className="ml-2 h-6 w-6 rounded-full p-0 flex items-center justify-center text-sm font-bold animate-pulse"
            >
              {totalItems > 99 ? '99+' : totalItems}
            </Badge>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          type="search"
          placeholder="Cerca prodotti..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div>
          <Label htmlFor="price-range">Filtra per prezzo (€):</Label>
          <div className="flex items-center gap-2">
            <span>{priceRange[0]}</span>
            <Slider
              id="price-range"
              value={priceRange}
              onValueChange={(value) => setPriceRange(value)}
              max={200}
              step={10}
            />
            <span>{priceRange[1]}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredProducts.map(product => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={() => handleAddToCart(product)}
          />
        ))}
      </div>

      {/* Floating Cart Button */}
      <FloatingCartButton 
        itemCount={totalItems}
        onClick={() => setShowCart(true)}
      />

      <CartDialog
        isOpen={showCart}
        onClose={() => setShowCart(false)}
        items={cartItems}
        onRemoveItem={handleRemoveFromCart}
        onUpdateQuantity={handleUpdateQuantity}
        onClearCart={clearCart}
        totalPrice={totalPrice}
      />
    </div>
  );
};

export default ShopTab;
