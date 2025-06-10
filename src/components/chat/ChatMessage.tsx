
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

/**
* Renders the chat message content with different styles based on the message text and sender type.
* @example
* ChatMessage({ message: { text: 'Sample text', sender: 'expert', time: '2:00 PM' }, isExpertView: false })
* // Returns a styled chat bubble with 'Sample text'.
* @param {Object} params - The parameters for rendering the chat message.
* @param {Object} params.message - Message object containing text, sender, time, and optional products, plantImage, plantDetails, and userDetails.
* @param {string} params.message.text - The text content of the message.
* @param {string} params.message.sender - The sender of the message, either 'expert' or 'user'.
* @param {string} params.message.time - The time the message was sent.
* @param {Array} [params.message.products] - Array of products related to the message.
* @param {string} [params.message.plantImage] - URL of the plant image associated with the message.
* @param {Object} [params.message.plantDetails] - Details of the plant related to the message, including environment, watering frequency, light exposure, and symptoms.
* @param {Object} [params.message.userDetails] - Details of the user who sent the message, including first name, last name, birth date, and place of birth.
* @param {boolean} [params.isExpertView=false] - Flag to determine the view mode, customizing the styling based on the expert view.
* @returns {JSX.Element} Returns a JSX element rendering message content styled based on sender and message type.
* @description
*   - It checks for specific formats in the message to render different styles, such as diagnosis request, plant info, images, and default text.
*   - Handles both image URLs and blob URLs to display images in messages.
*   - Displays additional information like products related to the message and plant or user details when available.
*/
const ChatMessage: React.FC<ChatMessageProps> = ({ message, isExpertView = false }) => {
  /**
   * Renders different types of chat messages based on their content.
   * @example
   * renderMessage({ text: '🌱 **Nuova richiesta di consulenza**' })
   * Returns a formatted diagnosis request component.
   * @param {Object} message - Object containing the text property representing the message content.
   * @returns {JSX.Element} A JSX element representing the formatted message.
   * @description
   *   - Categorizes messages as diagnosis requests, plant information, image URLs, blob URLs, or default text messages.
   *   - Supports both base64 and regular URLs for image rendering.
   *   - Ensures messages are displayed appropriately based on their format.
   */
  const renderMessageContent = () => {
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
    
    // Check if message is an image URL (base64 data URL or regular URL)
    if (message.text.match(/^(data:image\/[a-zA-Z]*;base64,|https?:\/\/.*\.(jpg|jpeg|png|gif|webp)(\?.*)?)$/i)) {
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
    
    // Check if message is a blob URL
    if (message.text.startsWith('blob:')) {
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
