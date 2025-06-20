
interface Product {
  name: string;
  description?: string;
  price?: string;
  image?: string;
}

interface ProductRecommendationsProps {
  products: Product[];
}

export const ProductRecommendations = ({ products }: ProductRecommendationsProps) => {
  return (
    <div className="mt-3 space-y-2">
      <p className="text-sm font-medium opacity-80">Prodotti consigliati:</p>
      <div className="space-y-2">
        {products.map((product: Product, index: number) => (
          <div 
            key={index}
            className="bg-white/20 backdrop-blur-sm rounded-lg p-3 border border-white/30"
          >
            <div className="flex items-start gap-3">
              {product.image && (
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="w-12 h-12 rounded-md object-cover flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm truncate">{product.name}</h4>
                {product.description && (
                  <p className="text-xs opacity-80 mt-1 line-clamp-2">
                    {product.description}
                  </p>
                )}
                {product.price && (
                  <p className="text-sm font-bold mt-1">€{product.price}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
