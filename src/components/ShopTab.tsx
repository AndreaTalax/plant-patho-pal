
import React, { useEffect, useState } from 'react';
import { toast } from '@/components/ui/sonner';

interface SelectedProduct {
  id: string;
  name: string;
  fromDiagnosis: boolean;
}

const ShopTab = () => {
  const [selectedProduct, setSelectedProduct] = useState<SelectedProduct | null>(null);

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

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Negozio</h2>
        <p className="text-gray-600">Trova i prodotti migliori per le tue piante</p>
      </div>

      {/* Prodotto selezionato dalla diagnosi */}
      {selectedProduct && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-800 mb-2">
            Prodotto raccomandato dalla diagnosi
          </h3>
          <p className="text-green-700">{selectedProduct.name}</p>
          <p className="text-sm text-green-600 mt-1">
            Questo prodotto è stato suggerito in base alla tua diagnosi
          </p>
        </div>
      )}

      {/* Qui aggiungerai il resto del contenuto del negozio */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-gray-500 text-center py-8">
            Contenuto del negozio in sviluppo...
          </p>
        </div>
      </div>
    </div>
  );
};

export default ShopTab;
