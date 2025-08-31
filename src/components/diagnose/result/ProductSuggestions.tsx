import React, { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';

interface ProductSuggestionsProps {
  diseaseName: string;
  maxItems?: number;
  onProductClick?: (productId: string, productName: string) => void;
}

interface ProductItem {
  id: string;
  name: string;
  price?: number;
  url?: string;
  description?: string;
}

const supabaseUrl = 'https://otdmqmpxukifoxjlgzmq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90ZG1xbXB4dWtpZm94amxnem1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NDQ5ODksImV4cCI6MjA2MjIyMDk4OX0.re4vu-banv0K-hBFNRYZGy5VucPkk141Pa--x-QiGr4';

function buildSearchTerms(diseaseName: string): string[] {
  const q = (diseaseName || '').toLowerCase();

  const terms: string[] = [];

  // Map malattia -> categorie/sinonimi di prodotto
  const add = (...t: string[]) => t.forEach((x) => !terms.includes(x) && terms.push(x));

  if (!q || q.includes('non identific') || q.includes('unknown')) {
    // Sintomi non identificati: suggerimenti generici utili
    add('olio di neem', 'fungicida', 'insetticida', 'rame', 'zolfo', 'sapone molle');
  }

  if (
    q.includes('oidio') || q.includes('powdery') || q.includes('mildew') ||
    q.includes('peronospora') || q.includes('downy') || q.includes('ruggine') || q.includes('rust') ||
    q.includes('macchia') || q.includes('leaf spot') || q.includes('botrytis') || q.includes('muffa')
  ) {
    add('fungicida', 'rame', 'zolfo');
  }

  if (q.includes('afidi') || q.includes('aphid') || q.includes('mosca bianca') || q.includes('whitefly')) {
    add('insetticida', 'olio di neem', 'sapone molle', 'piretro');
  }

  if (q.includes('acari') || q.includes('ragnetto') || q.includes('spider mite') || q.includes('tetranychus')) {
    add('acaricida', 'olio di neem', 'olio bianco');
  }

  if (q.includes('cocciniglia') || q.includes('scale insect')) {
    add('olio bianco', 'insetticida', 'olio di neem');
  }

  if (q.includes('tripidi') || q.includes('thrips')) {
    add('insetticida', 'olio di neem', 'piretro');
  }

  if (q.includes('marciume') || q.includes('root rot') || q.includes('phytophthora') || q.includes('pythium')) {
    add('fungicida', 'rame'); // prodotti anti-marciume più probabili in catalogo
  }

  // Sempre proviamo anche il nome della malattia e parole chiave generiche
  if (q) add(q);
  add('biologico', 'organico'); // amplia il match quando i prodotti hanno tag "bio"

  return terms;
}

async function fetchBySearch(term: string): Promise<ProductItem[]> {
  const params = new URLSearchParams({ search: term });
  const res = await fetch(`${supabaseUrl}/functions/v1/get-products?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) return [];
  const data = await res.json();
  const items: ProductItem[] = (data?.products || []).map((p: any) => ({
    id: p.id || p.sku || p.name,
    name: p.name,
    price: p.price ?? p.unit_price ?? undefined,
    url: p.url || p.link || '#',
    description: p.description
  }));
  return items;
}

function dedupeProducts(items: ProductItem[]): ProductItem[] {
  const map = new Map<string, ProductItem>();
  for (const it of items) {
    if (!map.has(it.id)) map.set(it.id, it);
  }
  return Array.from(map.values());
}

const ProductSuggestions: React.FC<ProductSuggestionsProps> = ({ 
  diseaseName, 
  maxItems = 3, 
  onProductClick 
}) => {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(false);

  const searchTerms = useMemo(() => buildSearchTerms(diseaseName), [diseaseName]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        if (!diseaseName && searchTerms.length === 0) return;
        setLoading(true);

        // Cerchiamo in parallelo per più termini
        const results = await Promise.allSettled(searchTerms.map((t) => fetchBySearch(t)));
        let found: ProductItem[] = [];
        results.forEach((r) => {
          if (r.status === 'fulfilled' && Array.isArray(r.value)) {
            found = found.concat(r.value);
          }
        });

        // Deduplica e limita
        let merged = dedupeProducts(found).slice(0, maxItems);

        // Fallback finale se ancora vuoto: tenta con termini "universali"
        if (merged.length === 0) {
          const fallbackTerms = ['olio di neem', 'fungicida', 'insetticida'];
          const fb = await Promise.allSettled(fallbackTerms.map((t) => fetchBySearch(t)));
          let all: ProductItem[] = [];
          fb.forEach((r) => {
            if (r.status === 'fulfilled' && Array.isArray(r.value)) {
              all = all.concat(r.value);
            }
          });
          merged = dedupeProducts(all).slice(0, maxItems);
        }

        if (!cancelled) setProducts(merged);
      } catch (e) {
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => { cancelled = true; };
  }, [diseaseName, searchTerms, maxItems]);

  const handleProductClick = (product: ProductItem) => {
    if (onProductClick) {
      onProductClick(product.id, product.name);
    }
  };

  if (loading) return <div className="text-sm text-muted-foreground">Caricamento prodotti…</div>;
  if (!products.length) return <div className="text-sm text-muted-foreground">Nessun prodotto trovato</div>;

  return (
    <div className="flex flex-wrap gap-2">
      {products.map((p) => (
        <button
          key={p.id}
          onClick={() => handleProductClick(p)}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-md border bg-background hover:bg-accent hover:text-accent-foreground transition cursor-pointer"
        >
          <Badge variant="outline" className="text-xs">Shop</Badge>
          <span className="text-sm font-medium">{p.name}</span>
          {typeof p.price === 'number' && (
            <span className="text-xs text-muted-foreground">€{p.price.toFixed(2)}</span>
          )}
        </button>
      ))}
    </div>
  );
};

export default ProductSuggestions;
