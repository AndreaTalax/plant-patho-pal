
import React from 'react';

interface ChatMessageProps {
  message: {
    id: string;
    text: string;
    sender: 'user' | 'expert';
    time: string;
    products?: any[];
    plantImage?: string;
    plantDetails?: any;
    userDetails?: any;
    image_url?: string;
  };
  isExpertView?: boolean;
}

/**
* Renders the chat message content with different styles based on the message text and sender type.
*/
const ChatMessage: React.FC<ChatMessageProps> = ({ message, isExpertView = false }) => {
  /**
   * Renders different types of chat messages based on their content.
   */
  const renderMessageContent = () => {
    // Check if message has an image URL (either in image_url field or as text)
    const hasImageUrl = message.image_url || 
      message.text.match(/^(data:image\/[a-zA-Z]*;base64,|https?:\/\/.*\.(jpg|jpeg|png|gif|webp)(\?.*)?)$/i) ||
      message.text.startsWith('blob:') ||
      message.text.startsWith('/lovable-uploads/');

    // If there's an image, render it prominently
    if (hasImageUrl) {
      const imageUrl = message.image_url || message.text;
      
      return (
        <div className="message-image space-y-2">
          <div className="bg-white p-2 rounded-lg border border-gray-200">
            <img 
              src={imageUrl} 
              alt="Immagine della pianta" 
              className="w-full max-w-xs rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow border border-gray-100"
              onClick={() => window.open(imageUrl, '_blank')}
              onError={(e) => {
                console.error('❌ Errore caricamento immagine chat:', imageUrl);
                // Show fallback content
                (e.target as HTMLElement).outerHTML = `
                  <div class="bg-gray-100 p-4 rounded-lg text-center text-gray-500 text-sm">
                    📷 Immagine non disponibile<br/>
                    <span class="text-xs">${imageUrl}</span>
                  </div>
                `;
              }}
              onLoad={() => {
                console.log('✅ Immagine chat caricata:', imageUrl);
              }}
            />
            <p className="text-xs text-gray-500 text-center mt-1">
              📸 Clicca per ingrandire
            </p>
          </div>
          {/* Show additional text if the message contains both image and text */}
          {message.image_url && message.text && !message.text.includes('![Immagine') && (
            <div className="mt-2 whitespace-pre-line text-sm bg-gray-50 p-2 rounded">{message.text}</div>
          )}
        </div>
      );
    }
    
    // Check if message content contains diagnosis request format
    if (message.text.includes('🌱 **Nuova richiesta di consulenza**')) {
      return (
        <div className="diagnosis-request bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
          <div className="whitespace-pre-line text-sm">{message.text}</div>
        </div>
      );
    }
    
    // Check if message contains plant info format
    if (message.text.includes('🌿 Nuove informazioni sulla pianta') || message.text.includes('🌿 Informazioni sulla pianta')) {
      return (
        <div className="plant-info bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
          <div className="whitespace-pre-line text-sm">{message.text}</div>
        </div>
      );
    }
    
    // Check if message contains consultation data
    if (message.text.includes('👤 **Profilo:**') || message.text.includes('🌱 **Dati della pianta:**') || message.text.includes('👤 **Dati personali:**')) {
      return (
        <div className="consultation-data bg-amber-50 p-4 rounded-lg border-l-4 border-amber-500">
          <div className="whitespace-pre-line text-sm">{message.text}</div>
        </div>
      );
    }
    
    // Check if message contains image markdown
    if (message.text.includes('![Immagine della pianta]')) {
      // Extract image URL from markdown
      const imageMatch = message.text.match(/!\[.*?\]\((.*?)\)/);
      const imageUrl = imageMatch ? imageMatch[1] : null;
      
      if (imageUrl) {
        return (
          <div className="message-image space-y-2">
            <div className="bg-white p-2 rounded-lg border border-gray-200">
              <img 
                src={imageUrl} 
                alt="Immagine della pianta" 
                className="w-full max-w-xs rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => window.open(imageUrl, '_blank')}
                onError={(e) => {
                  console.error('❌ Errore caricamento immagine markdown:', imageUrl);
                }}
              />
              <p className="text-xs text-gray-500 text-center mt-1">
                📸 Clicca per ingrandire
              </p>
            </div>
            {/* Show rest of the message text without the image markdown */}
            {message.text.replace(/!\[.*?\]\(.*?\)/, '').trim() && (
              <div className="mt-2 whitespace-pre-line text-sm bg-gray-50 p-2 rounded">
                {message.text.replace(/!\[.*?\]\(.*?\)/, '').trim()}
              </div>
            )}
          </div>
        );
      }
    }
    
    // Default text message
    return <div className="whitespace-pre-line text-sm">{message.text}</div>;
  };

  return (
    <div 
      className={`flex ${
        isExpertView 
          ? message.sender === 'expert' ? 'justify-end' : 'justify-start' 
          : message.sender === 'user' ? 'justify-end' : 'justify-start'
      }`}
    >
      <div 
        className={`max-w-[85%] rounded-lg p-3 ${
          isExpertView 
            ? message.sender === 'expert' 
              ? 'bg-drplant-green text-white rounded-tr-none' 
              : 'bg-gray-100 text-gray-800 rounded-tl-none'
            : message.sender === 'user' 
              ? 'bg-drplant-blue text-white rounded-tr-none' 
              : 'bg-gray-100 text-gray-800 rounded-tl-none'
        }`}
      >
        {renderMessageContent()}
        
        {message.products && (
          <div className="mt-2 space-y-1">
            {message.products.map(product => (
              <div key={product.id} className="bg-white rounded-lg p-1 flex items-center gap-1 text-gray-800">
                <div className="w-8 h-8 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="object-cover w-full h-full" />
                  ) : (
                    <div className="w-4 h-4 text-gray-400">🛒</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-xs">{product.name}</p>
                  <p className="text-xs text-gray-500 truncate">{product.price.toFixed(2)} €</p>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {message.plantImage && (
          <div className="mt-2 bg-white p-2 rounded-lg border border-gray-200">
            <img 
              src={message.plantImage} 
              alt="Immagine pianta" 
              className="w-full h-auto rounded max-h-48 object-cover cursor-pointer shadow-sm" 
              onClick={() => window.open(message.plantImage, '_blank')}
            />
            <p className="text-xs text-gray-500 text-center mt-1">
              📸 Clicca per ingrandire
            </p>
          </div>
        )}
        
        {message.plantDetails && (
          <div className="mt-2 bg-white/90 p-2 rounded-lg text-xs text-gray-700">
            <p className="font-medium mb-1">Dettagli pianta:</p>
            <ul className="space-y-1">
              <li><span className="font-medium">Ambiente:</span> {message.plantDetails.isIndoor ? 'Interno' : 'Esterno'}</li>
              <li><span className="font-medium">Irrigazione:</span> {message.plantDetails.wateringFrequency} volte/settimana</li>
              <li><span className="font-medium">Luce:</span> {message.plantDetails.lightExposure}</li>
              {message.plantDetails.symptoms && (
                <li><span className="font-medium">Sintomi:</span> {message.plantDetails.symptoms}</li>
              )}
            </ul>
          </div>
        )}
        
        {message.userDetails && (
          <div className="mt-2 bg-white/90 p-2 rounded-lg text-xs text-gray-700">
            <p className="font-medium mb-1">Informazioni utente:</p>
            <ul className="space-y-1">
              <li><span className="font-medium">Nome:</span> {message.userDetails.firstName || 'Non specificato'}</li>
              <li><span className="font-medium">Cognome:</span> {message.userDetails.lastName || 'Non specificato'}</li>
              <li><span className="font-medium">Data di nascita:</span> {message.userDetails.birthDate || 'Non specificata'}</li>
              <li><span className="font-medium">Luogo di nascita:</span> {message.userDetails.birthPlace || 'Non specificato'}</li>
            </ul>
          </div>
        )}
        
        <div className={`text-xs mt-1 ${
          isExpertView 
            ? message.sender === 'expert' ? 'text-green-100' : 'text-gray-500'
            : message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
        }`}>
          {message.time}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
