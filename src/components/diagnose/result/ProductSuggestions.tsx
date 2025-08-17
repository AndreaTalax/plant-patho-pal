import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';

interface ProductSuggestionsProps {
  diseaseName: string;
}

interface ProductItem {
  id: string;
  name: string;
  price?: number;
  url?: string;
}

const ProductSuggestions: React.FC<ProductSuggestionsProps> = ({ diseaseName }) => {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        if (!diseaseName) return;
        setLoading(true);
        // Reuse public edge function like in ShopTab
        const supabaseUrl = 'https://otdmqmpxukifoxjlgzmq.supabase.co';
        const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90ZG1xbXB4dWtpZm94amxnem1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NDQ5ODksImV4cCI6MjA2MjIyMDk4OX0.re4vu-banv0K-hBFNRYZGy5VucPkk141Pa--x-QiGr4';
        const params = new URLSearchParams({ search: diseaseName });
        const res = await fetch(`${supabaseUrl}/functions/v1/get-products?${params.toString()}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
        });
        if (!res.ok) throw new Error('Prodotti non disponibili');
        const data = await res.json();
        const items: ProductItem[] = (data?.products || []).slice(0, 3).map((p: any) => ({
          id: p.id || p.sku || p.name,
          name: p.name,
          price: p.price,
          url: p.url,
        }));
        setProducts(items);
      } catch (e) {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [diseaseName]);

  if (loading) return <div className="text-sm text-gray-500">Caricamento prodotti…</div>;
  if (!products.length) return <div className="text-sm text-gray-500">Nessun prodotto trovato</div>;

  return (
    <div className="flex flex-wrap gap-2">
      {products.map((p) => (
        <a
          key={p.id}
          href={p.url || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-3 py-1 rounded-md border border-drplant-green/30 bg-white hover:bg-drplant-green/5 transition"
        >
          <Badge variant="outline" className="text-xs">Prodotto</Badge>
          <span className="text-sm text-drplant-green font-medium">{p.name}</span>
        </a>
      ))}
    </div>
  );
};

export default ProductSuggestions;
