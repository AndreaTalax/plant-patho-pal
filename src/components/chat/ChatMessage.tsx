
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
  };
  isExpertView?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isExpertView = false }) => {
  const renderMessageContent = () => {
    // Check if message content contains diagnosis request format
    if (message.text.includes('🌱 **Nuova richiesta di consulenza**')) {
      return (
        <div className="diagnosis-request bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
          <div className="whitespace-pre-line text-sm">{message.text}</div>
        </div>
      );
    }
    
    // Check if message is an image URL
    if (message.text.match(/^https?:\/\/.*\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i)) {
      return (
        <div className="message-image">
          <img 
            src={message.text} 
            alt="Immagine della pianta" 
            className="max-w-xs rounded-lg shadow-md"
          />
        </div>
      );
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
        className={`max-w-[80%] rounded-lg p-2 ${
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
          <div className="mt-2 bg-white p-1 rounded-lg">
            <img 
              src={message.plantImage} 
              alt="Immagine pianta" 
              className="w-full h-auto rounded max-h-48 object-cover" 
            />
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
