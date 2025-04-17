
import { useState } from 'react';
import { Search, ShoppingBag, Filter } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
        return [...currentCart, {id: productId, quantity: 1}];
      }
    });
  };

  const totalCartItems = cart.reduce((total, item) => total + item.quantity, 0);

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
          <Button className="h-14 w-14 rounded-full shadow-lg bg-drplant-green hover:bg-drplant-green-dark">
            <ShoppingBag className="h-6 w-6" />
            <span className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold">
              {totalCartItems}
            </span>
          </Button>
        </div>
      )}
    </div>
  );
};

export default ShopTab;
