
import React, { useEffect, useState } from 'react';
import { toast } from '@/components/ui/sonner';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag, Leaf, Bug } from 'lucide-react';

interface SelectedProduct {
  id: string;
  name: string;
  fromDiagnosis: boolean;
}

interface Product {
  id: string;
  name: string;
  price?: number;
  description?: string;
  category: string;
  image?: string;
}

const PLANT_DISEASE_PRODUCTS: Product[] = [
  {
    id: 'fungicida-rame',
    name: 'Fungicida a base di Rame',
    price: 12.99,
    description: 'Efficace contro peronospora, oidio e altre malattie fungine',
    category: 'Fungicidi',
  },
  {
    id: 'olio-neem',
    name: 'Olio di Neem Biologico',
    price: 15.50,
    description: 'Insetticida naturale contro afidi, mosca bianca e acari',
    category: 'Insetticidi Biologici',
  },
  {
    id: 'fungicida-zolfo',
    name: 'Zolfo Bagnabile',
    price: 9.99,
    description: 'Trattamento preventivo e curativo per oidio e altre malattie',
    category: 'Fungicidi',
  },
  {
    id: 'sapone-molle',
    name: 'Sapone Molle di Potassio',
    price: 8.75,
    description: 'Deterge e protegge dalle infestazioni di insetti',
    category: 'Insetticidi Biologici',
  },
  {
    id: 'acaricida',
    name: 'Acaricida Specifico',
    price: 18.90,
    description: 'Contro ragnetto rosso e altri acari dannosi',
    category: 'Acaricidi',
  },
  {
    id: 'olio-bianco',
    name: 'Olio Bianco Minerale',
    price: 11.20,
    description: 'Trattamento invernale contro cocciniglie e uova di insetti',
    category: 'Insetticidi',
  },
  {
    id: 'piretro-naturale',
    name: 'Piretro Naturale',
    price: 16.40,
    description: 'Insetticida naturale ad ampio spettro',
    category: 'Insetticidi Biologici',
  },
  {
    id: 'concime-fogliare',
    name: 'Concime Fogliare Rinforzante',
    price: 13.60,
    description: 'Rinforza le difese naturali delle piante',
    category: 'Fertilizzanti',
  },
  {
    id: 'fungicida-sistemico',
    name: 'Fungicida Sistemico',
    price: 22.30,
    description: 'Protezione sistemica contro malattie fungine complesse',
    category: 'Fungicidi',
  },
  {
    id: 'attivatore-difese',
    name: 'Attivatore delle Difese Naturali',
    price: 19.80,
    description: 'Stimola le difese immunitarie delle piante',
    category: 'Biostimolanti',
  }
];

const ShopTab = () => {
  const [selectedProduct, setSelectedProduct] = useState<SelectedProduct | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tutti');

  const categories = ['Tutti', ...Array.from(new Set(PLANT_DISEASE_PRODUCTS.map(p => p.category)))];

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

  const filteredProducts = PLANT_DISEASE_PRODUCTS.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Tutti' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Fungicidi':
        return <Leaf className="w-4 h-4" />;
      case 'Insetticidi Biologici':
      case 'Insetticidi':
      case 'Acaricidi':
        return <Bug className="w-4 h-4" />;
      default:
        return <ShoppingBag className="w-4 h-4" />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Negozio Prodotti Fitosanitari</h2>
        <p className="text-gray-600">Trova i prodotti migliori per curare le malattie delle tue piante</p>
      </div>

      {/* Prodotto selezionato dalla diagnosi */}
      {selectedProduct && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-green-800 mb-2">
            Prodotto raccomandato dalla diagnosi
          </h3>
          <p className="text-green-700">{selectedProduct.name}</p>
          <p className="text-sm text-green-600 mt-1">
            Questo prodotto è stato suggerito in base alla tua diagnosi
          </p>
        </div>
      )}

      {/* Filtri */}
      <div className="mb-6 space-y-4">
        <div>
          <input
            type="text"
            placeholder="Cerca prodotti..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-drplant-green focus:border-transparent"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-drplant-green text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Griglia prodotti */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map(product => (
          <div key={product.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
            <div className="h-48 bg-gradient-to-br from-drplant-green/10 to-drplant-blue/10 flex items-center justify-center">
              {product.image ? (
                <img src={product.image} alt={product.name} className="object-cover w-full h-full" />
              ) : (
                <div className="text-center">
                  {getCategoryIcon(product.category)}
                  <p className="text-sm text-gray-500 mt-2">{product.category}</p>
                </div>
              )}
            </div>
            
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-900 flex-1">{product.name}</h3>
                <Badge variant="outline" className="ml-2">
                  {product.category}
                </Badge>
              </div>
              
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                {product.description}
              </p>
              
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold text-drplant-green">
                  €{product.price?.toFixed(2)}
                </span>
                <button className="px-4 py-2 bg-drplant-green text-white rounded-lg hover:bg-drplant-green-dark transition-colors">
                  Aggiungi al carrello
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nessun prodotto trovato</h3>
          <p className="text-gray-500">Prova a modificare i filtri di ricerca</p>
        </div>
      )}

      {/* Informazioni aggiuntive */}
      <div className="mt-12 bg-drplant-blue/5 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-drplant-blue-dark mb-3">
          💡 Consigli per l'uso dei prodotti fitosanitari
        </h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>• Leggi sempre attentamente le etichette prima dell'uso</li>
          <li>• Rispetta i dosaggi e i tempi di carenza indicati</li>
          <li>• Utilizza dispositivi di protezione individuale</li>
          <li>• Tratta preferibilmente nelle ore più fresche della giornata</li>
          <li>• Non trattare in caso di vento o pioggia imminente</li>
        </ul>
      </div>
    </div>
  );
};

export default ShopTab;
