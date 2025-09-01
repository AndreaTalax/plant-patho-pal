
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import CartDialog from './CartDialog';
import { ProductCard } from './ProductCard';
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
}

const PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Concime Biologico",
    description: "Concime organico per tutte le piante",
    price: 19.99,
    imageUrl: "/placeholder.svg",
  },
  {
    id: "2",
    name: "Insetticida Naturale",
    description: "Protezione naturale contro gli insetti",
    price: 14.50,
    imageUrl: "/placeholder.svg",
  },
  {
    id: "3",
    name: "Terriccio Universale",
    description: "Terriccio di alta qualità per ogni tipo di pianta",
    price: 12.00,
    imageUrl: "/placeholder.svg",
  },
  {
    id: "4",
    name: "Vaso Autoirrigante",
    description: "Vaso moderno con sistema di autoirrigazione",
    price: 25.00,
    imageUrl: "/placeholder.svg",
  },
  {
    id: "5",
    name: "Kit di Germinazione",
    description: "Tutto il necessario per far crescere le tue piante",
    price: 29.99,
    imageUrl: "/placeholder.svg",
  },
  {
    id: "6",
    name: "Forbici da Potatura",
    description: "Forbici professionali per la cura delle piante",
    price: 21.00,
    imageUrl: "/placeholder.svg",
  },
];

const FILTERS = [
  "Concimi",
  "Insetticidi",
  "Terricci",
  "Vasi",
  "Attrezzi",
];

interface CartItem {
  product: Product;
  quantity: number;
}

const ShopTab = () => {
  const [showCart, setShowCart] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<number[]>([0, 30]);
  const [recommendedProduct, setRecommendedProduct] = useState<Product | null>(null);

  useEffect(() => {
    const recommended = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];
    setRecommendedProduct(recommended);
  }, []);

  const handleAddToCart = (product: Product) => {
    const existingItem = cartItems.find((item) => item.product.id === product.id);
    if (existingItem) {
      const updatedItems = cartItems.map((item) =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
      setCartItems(updatedItems);
    } else {
      setCartItems([...cartItems, { product, quantity: 1 }]);
    }
  };

  const handleRemoveFromCart = (productId: string) => {
    const updatedItems = cartItems.filter((item) => item.product.id !== productId);
    setCartItems(updatedItems);
  };

  const handleUpdateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      handleRemoveFromCart(productId);
      return;
    }
    const updatedItems = cartItems.map((item) =>
      item.product.id === productId ? { ...item, quantity: newQuantity } : item
    );
    setCartItems(updatedItems);
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const filteredProducts = PRODUCTS.filter((product) => {
    const searchMatch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());

    const filterMatch = selectedFilters.length === 0 || selectedFilters.some(filter =>
      product.name.toLowerCase().includes(filter.toLowerCase()) ||
      product.description.toLowerCase().includes(filter.toLowerCase())
    );

    const priceMatch = product.price >= priceRange[0] && product.price <= priceRange[1];

    return searchMatch && filterMatch && priceMatch;
  });

  // Convert CartItem[] to the format expected by CartDialog
  const cartItemsForDialog = cartItems.map(item => ({
    ...item.product,
    quantity: item.quantity,
    image_url: item.product.imageUrl
  }));

  const totalPrice = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  return (
    <div className="space-y-6 pb-24 pt-8 px-4">
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

      {/* Prodotto raccomandato dalla diagnosi */}
      {recommendedProduct && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-green-800 mb-2">Prodotto raccomandato dalla diagnosi</h3>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <h4 className="font-medium text-green-700">{recommendedProduct.name}</h4>
              <p className="text-sm text-green-600">{recommendedProduct.description}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-green-800">€{recommendedProduct.price}</p>
              <Button
                onClick={() => handleAddToCart(recommendedProduct)}
                size="sm"
                className="mt-2 bg-green-600 hover:bg-green-700"
              >
                Aggiungi
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          type="search"
          placeholder="Cerca prodotti..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <ScrollArea className="col-span-1 md:col-span-1 h-40">
          <div className="flex flex-col gap-2">
            {FILTERS.map((filter) => (
              <label key={filter} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  className="accent-drplant-green rounded"
                  checked={selectedFilters.includes(filter)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedFilters([...selectedFilters, filter]);
                    } else {
                      setSelectedFilters(selectedFilters.filter((f) => f !== filter));
                    }
                  }}
                />
                <span>{filter}</span>
              </label>
            ))}
          </div>
        </ScrollArea>

        <div className="space-y-2">
          <p className="text-sm font-medium">Prezzo: €{priceRange[0]} - €{priceRange[1]}</p>
          <Slider
            defaultValue={priceRange}
            max={30}
            step={1}
            onValueChange={(value) => setPriceRange(value)}
          />
        </div>
      </div>

      {/* Product Listing */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={{...product, image_url: product.imageUrl}}
            onAddToCart={() => handleAddToCart(product)}
          />
        ))}
      </div>

      <CartDialog
        isOpen={showCart}
        onClose={() => setShowCart(false)}
        items={cartItemsForDialog}
        onRemoveItem={handleRemoveFromCart}
        onUpdateQuantity={handleUpdateQuantity}
        onClearCart={clearCart}
        totalPrice={totalPrice}
      />
    </div>
  );
};

export default ShopTab;
