import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CartDialog } from "@/components/shop/CartDialog";
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
  const recommendedProduct = products[0]; // Placeholder for a real recommendation

  useEffect(() => {
    const filtered = products.filter(product => {
      const searchMatch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      const priceMatch = product.price >= priceRange[0] && product.price <= priceRange[1];
      return searchMatch && priceMatch;
    });
    setFilteredProducts(filtered);
  }, [searchTerm, priceRange]);

  return (
    <div className="space-y-6 pb-24 pt-4">
      <div className="text-center">
        <div className="flex items-center justify-center gap-4 mb-2">
          <h2 className="text-2xl font-bold text-gray-900">Negozio</h2>
          <Button
            onClick={() => setShowCart(true)}
            variant="outline"
            size="sm"
            className="relative"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Carrello
            {cartItems.length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                {cartItems.length}
              </Badge>
            )}
          </Button>
        </div>
        <p className="text-gray-600">
          Trova i prodotti migliori per la cura delle tue piante
        </p>
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

      <CartDialog
        open={showCart}
        onOpenChange={setShowCart}
        cartItems={cartItems}
        onRemoveItem={handleRemoveFromCart}
        onUpdateQuantity={handleUpdateQuantity}
        onClearCart={clearCart}
      />
    </div>
  );
};

export default ShopTab;
