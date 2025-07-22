
import { useState } from 'react';
import { ExternalLink } from 'lucide-react';

interface ImageDisplayProps {
  imageUrl: string;
}

export const ImageDisplay = ({ imageUrl }: ImageDisplayProps) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  console.log('🖼️ ImageDisplay - URL ricevuto:', imageUrl);

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
    console.error('❌ Errore caricamento immagine:', imageUrl);
  };

  const openImageInNewTab = () => {
    window.open(imageUrl, '_blank');
  };

  return (
    <div className="mt-3">
      {imageLoading && (
        <div className="max-w-xs h-48 bg-gray-200 rounded-lg animate-pulse flex items-center justify-center">
          <div className="text-gray-500 text-sm">Caricamento immagine...</div>
        </div>
      )}
      
      {!imageError ? (
        <div className="relative group">
          <img
            src={imageUrl}
            alt="Immagine condivisa"
            className={`max-w-xs rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-all duration-200 ${imageLoading ? 'hidden' : 'block'}`}
            onLoad={handleImageLoad}
            onError={handleImageError}
            onClick={openImageInNewTab}
          />
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-center justify-center">
            <ExternalLink className="h-6 w-6 text-white" />
          </div>
        </div>
      ) : (
        <div className="max-w-xs p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
          <div className="text-gray-500 mb-2">
            <span className="text-sm">Impossibile caricare l'immagine</span>
          </div>
          <div className="space-y-2">
            <button
              onClick={openImageInNewTab}
              className="text-blue-500 hover:underline text-xs flex items-center gap-1 mx-auto"
            >
              <ExternalLink className="h-3 w-3" />
              Apri in una nuova scheda
            </button>
            <div className="text-xs text-gray-400 break-all">
              {imageUrl?.substring(0, 50)}...
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
