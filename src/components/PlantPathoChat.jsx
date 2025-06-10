import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Bot, Upload, Camera, Leaf } from 'lucide-react';

/**
* Virtual plant pathologist assisting with plant disease diagnosis
* @example
* PlantPathoChat({ userPlantData: {}, onDataSubmit: () => {}, initialMessage: "Hello" })
* Returns a React component facilitating interactive communication with virtual plant pathologist
* @param {Object} userPlantData - Data related to the user's plant, including type, symptoms, and environment details.
* @param {Function} onDataSubmit - Callback function triggered when user plant data is processed.
* @param {string} initialMessage - Initial message sent by the user to start the chat interaction.
* @returns {JSX.Element} React component for chatting with a virtual plant pathologist.
* @description
*   - Handles automatic sending of plant data and welcomes the user with an introductory message.
*   - Formats and presents plant data for user verification and bot analysis.
*   - Simulates bot analysis and responses using provided plant data.
*   - Implements smooth scrolling to keep chat interface user-friendly and updated.
*/
const PlantPathologistChat = ({ 
  userPlantData = null, 
  onDataSubmit = null,
  initialMessage = null 
}) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Scroll automaticamente alla fine dei messaggi
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Invia automaticamente i dati della pianta quando il componente si monta
  useEffect(() => {
    if (userPlantData || initialMessage) {
      const welcomeMessage = {
        id: Date.now(),
        text: "Ciao! Sono il tuo fitopatologo virtuale. Analizzerò i dati della tua pianta e ti aiuterò a identificare eventuali problemi.",
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString()
      };

      let plantDataMessage = null;
      if (userPlantData) {
        const plantInfo = formatPlantData(userPlantData);
        plantDataMessage = {
          id: Date.now() + 1,
          text: `Ecco i dati della pianta che hai fornito:\n\n${plantInfo}`,
          sender: 'user',
          timestamp: new Date().toLocaleTimeString(),
          isAutoSent: true
        };
      }

      let initialMsg = null;
      if (initialMessage) {
        initialMsg = {
          id: Date.now() + 2,
          text: initialMessage,
          sender: 'user',
          timestamp: new Date().toLocaleTimeString(),
          isAutoSent: true
        };
      }

      const initialMessages = [welcomeMessage];
      if (plantDataMessage) initialMessages.push(plantDataMessage);
      if (initialMsg) initialMessages.push(initialMsg);

      setMessages(initialMessages);

      // Simula la risposta del fitopatologo dopo un breve delay
      setTimeout(() => {
        const analysisMessage = {
          id: Date.now() + 3,
          text: generateAnalysisResponse(userPlantData),
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString()
        };
        setMessages(prev => [...prev, analysisMessage]);

        // Callback per notificare che i dati sono stati processati
        if (onDataSubmit && userPlantData) {
          onDataSubmit(userPlantData);
        }
      }, 1500);
    }
  }, [userPlantData, initialMessage, onDataSubmit]);

  /**
   * Formats plant data into a readable string with emojis
   * @example
   * formatPlantData({ plantType: "Ficus", symptoms: "Yellow leaves" })
   * "🌱 Tipo di pianta: Ficus\n🔍 Sintomi: Yellow leaves\n"
   * @param {Object} data - Plant data containing various attributes like plantType, symptoms, location, etc.
   * @returns {string} A formatted string detailing the plant data or a default message if no data is provided.
   * @description
   *   - Returns "Nessun dato fornito" if data is null or undefined.
   *   - Includes specific emojis to visually represent each property.
   *   - Properties are included only if they exist within the data object.
   */
  const formatPlantData = (data) => {
    if (!data) return "Nessun dato fornito";
    
    let formatted = "";
    if (data.plantType) formatted += `🌱 Tipo di pianta: ${data.plantType}\n`;
    if (data.symptoms) formatted += `🔍 Sintomi: ${data.symptoms}\n`;
    if (data.location) formatted += `📍 Posizione: ${data.location}\n`;
    if (data.environment) formatted += `🌡️ Ambiente: ${data.environment}\n`;
    if (data.watering) formatted += `💧 Irrigazione: ${data.watering}\n`;
    if (data.fertilizer) formatted += `🧪 Fertilizzante: ${data.fertilizer}\n`;
    if (data.duration) formatted += `⏰ Durata sintomi: ${data.duration}\n`;
    if (data.weather) formatted += `☀️ Condizioni meteorologiche: ${data.weather}\n`;
    
    return formatted || "Dati della pianta forniti";
  };

  /**
  * Provides a preliminary plant health analysis based on symptoms.
  * @example
  * analyzePlantHealth({ symptoms: "foglie gialle, macchie" })
  * "Grazie per le informazioni dettagliate! 🌿\n\nBasandomi sui sintomi descritti, ecco la mia analisi preliminare:..."
  * @param {Object} data - Contains details about the plant's symptoms and conditions.
  * @returns {string} Suggested analysis and recommendations for plant care.
  * @description
  *   - The function suggests potential causes for symptoms such as yellowing, spotting, and wilting of leaves.
  *   - It provides specific recommendations for improving plant care based on the conditions described.
  *   - Prompts the user to share plant photos for a more accurate assessment.
  *   - A default message is returned if no data is provided.
  */
  const generateAnalysisResponse = (data) => {
    if (!data) {
      return "Per fornirti un'analisi accurata, ho bisogno di più informazioni sulla tua pianta. Puoi descrivermi i sintomi che osservi, il tipo di pianta e le condizioni ambientali?";
    }

    let response = "Grazie per le informazioni dettagliate! 🌿\n\n";
    
    if (data.symptoms) {
      response += "Basandomi sui sintomi descritti, ecco la mia analisi preliminare:\n\n";
      
      const symptoms = data.symptoms.toLowerCase();
      if (symptoms.includes('foglie gialle') || symptoms.includes('ingiallimento')) {
        response += "🟡 **Ingiallimento fogliare**: Questo può indicare:\n• Carenza nutrizionale (azoto, ferro)\n• Eccesso d'acqua o ristagno\n• Problemi alle radici\n\n";
      }
      if (symptoms.includes('macchie') || symptoms.includes('spots')) {
        response += "🔴 **Macchie fogliari**: Possibili cause:\n• Infezioni fungine\n• Malattie batteriche\n• Danni da insetti\n\n";
      }
      if (symptoms.includes('appassimento') || symptoms.includes('wilting')) {
        response += "🥀 **Appassimento**: Probabile causa:\n• Stress idrico\n• Malattie vascolari\n• Problemi radicali\n\n";
      }
    }

    response += "**Raccomandazioni:**\n";
    response += "• Verifica il drenaggio del terreno\n";
    response += "• Controlla il regime di irrigazione\n";
    response += "• Ispeziona le foglie per parassiti\n";
    response += "• Considera un test del pH del suolo\n\n";
    response += "Hai foto della pianta che puoi condividere per un'analisi più precisa?";

    return response;
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  /**
   * Sends a user message and simulates a bot response in a chat interface.
   * @example
   * sync()
   * The user message is added and a bot response follows after a delay.
   * @param {string} input - User input message to send (may include trimmed whitespaces).
   * @param {object|null} selectedImage - An image object selected by the user; null if no image is selected.
   * @returns {void} No return value.
   * @description
   *   - Checks if input is empty and no image is selected, then exits without action.
   *   - Creates a user message object with current timestamp and adds to message list.
   *   - Simulates bot response based on user input and image selection after a random delay.
   *   - Resets input fields and loading status post message sending.
   */
  const handleSendMessage = async () => {
    if (!input.trim() && !selectedImage) return;

    const newMessage = {
      id: Date.now(),
      text: input.trim(),
      sender: 'user',
      timestamp: new Date().toLocaleTimeString(),
      image: imagePreview
    };

    setMessages(prev => [...prev, newMessage]);
    setInput('');
    setSelectedImage(null);
    setImagePreview(null);
    setIsLoading(true);

    // Simula risposta del bot
    setTimeout(() => {
      const botResponse = {
        id: Date.now() + 1,
        text: generateBotResponse(input, selectedImage !== null),
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, botResponse]);
      setIsLoading(false);
    }, 1000 + Math.random() * 2000);
  };

  /**
   * Provides feedback based on user input regarding plant symptoms, with enhanced analysis if an image is provided.
   * @example
   * analyzePlantSymptoms("La pianta ha delle foglie gialle", true)
   * "Ottima foto! Dall'immagine posso vedere alcuni dettagli interessanti. ..."
   * @param {string} userInput - A description of the plant symptoms provided by the user.
   * @param {boolean} hasImage - Indicates whether there is an accompanying image for enhanced feedback.
   * @returns {string} A message suggesting actions or observations based on the plant symptoms described.
   * @description
   *   - Returns a randomized general response if no image is provided.
   *   - Provides a specific feedback related to visible stress symptoms when an image is available.
   */
  const generateBotResponse = (userInput, hasImage) => {
    const responses = [
      "Grazie per le informazioni aggiuntive. Basandomi su quello che mi hai descritto, ti consiglio di monitorare attentamente la pianta nei prossimi giorni.",
      "Interessante osservazione! Questo sintomo potrebbe essere collegato alle condizioni ambientali. Hai notato cambiamenti nel clima locale?",
      "Per una diagnosi più precisa, ti suggerirei di controllare anche il sistema radicale della pianta. È possibile accedere alle radici?",
      "I sintomi che descrivi sono comuni in questa stagione. Ti consiglio di applicare un trattamento preventivo con prodotti biologici.",
    ];

    if (hasImage) {
      return "Ottima foto! Dall'immagine posso vedere alcuni dettagli interessanti. I sintomi visibili suggeriscono un possibile stress della pianta. Ti consiglio di controllare l'irrigazione e la ventilazione dell'area.";
    }

    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-green-600 text-white p-4 flex items-center gap-3">
        <div className="bg-green-500 p-2 rounded-full">
          <Leaf className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Fitopatologo Virtuale</h2>
          <p className="text-green-100 text-sm">Assistente per la diagnosi delle malattie delle piante</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow ${
                message.sender === 'user'
                  ? 'bg-green-500 text-white'
                  : 'bg-white text-gray-800 border'
              }`}
            >
              <div className="flex items-start gap-2 mb-2">
                {message.sender === 'bot' ? (
                  <Bot className="w-5 h-5 mt-1 text-green-600 flex-shrink-0" />
                ) : (
                  <User className="w-5 h-5 mt-1 text-white flex-shrink-0" />
                )}
                <div className="flex-1">
                  {message.image && (
                    <img 
                      src={message.image} 
                      alt="Uploaded plant" 
                      className="w-full rounded-lg mb-2 max-w-xs"
                    />
                  )}
                  <p className="whitespace-pre-wrap text-sm">{message.text}</p>
                  {message.isAutoSent && (
                    <p className="text-xs opacity-70 mt-1 italic">
                      (Dati inviati automaticamente)
                    </p>
                  )}
                </div>
              </div>
              <div className="text-xs opacity-70 text-right">
                {message.timestamp}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-800 border max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-green-600" />
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Image Preview */}
      {imagePreview && (
        <div className="p-4 bg-gray-100 border-t">
          <div className="flex items-center gap-4">
            <img 
              src={imagePreview} 
              alt="Preview" 
              className="w-20 h-20 object-cover rounded-lg"
            />
            <div className="flex-1">
              <p className="text-sm text-gray-600">Immagine pronta per l'invio</p>
              <button
                onClick={() => {
                  setImagePreview(null);
                  setSelectedImage(null);
                }}
                className="text-red-500 text-sm hover:underline"
              >
                Rimuovi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t bg-white">
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-green-600 hover:bg-green-50 rounded-lg border border-green-200 transition-colors"
            title="Carica immagine"
          >
            <Upload className="w-5 h-5" />
          </button>

          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Descrivi i sintomi della tua pianta o fai una domanda..."
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              rows="2"
            />
          </div>

          <button
            onClick={handleSendMessage}
            disabled={!input.trim() && !selectedImage}
            className="p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Esempio di utilizzo del componente
/**
 * Renders a plant health assistant interface and initiates a chat based on user's input.
 * @example
 * handleStartChat()
 * Returns JSX element for the chat interface.
 * @param {Object} plantData - Contains details of the plant including type, symptoms, location, environment, watering frequency, and problem duration.
 * @returns {JSX.Element} JSX structure for rendering the chat interface if chat is initiated, otherwise displays plant data and a button.
 * @description
 *   - Uses `useState` to manage visibility of chat interface and plant data.
 *   - Upon triggering `handleStartChat`, reveals a chat component for plant health insights.
 *   - The chat interface features initial conversational prompts to assist with plant health issues.
 *   - Displays plant data dynamically from the `plantData` object.
 */
const PlantPathoApp = () => {
  const [showChat, setShowChat] = useState(false);
  const [plantData, setPlantData] = useState({
    plantType: "Pomodoro",
    symptoms: "Foglie gialle e macchie marroni",
    location: "Giardino esterno",
    environment: "Soleggiato, umido",
    watering: "Ogni 2 giorni",
    duration: "1 settimana"
  });

  const handleStartChat = () => {
    setShowChat(true);
  };

  const handleDataSubmit = (data) => {
    console.log("Dati della pianta processati:", data);
  };

  if (showChat) {
    return (
      <div className="h-screen">
        <PlantPathologistChat 
          userPlantData={plantData}
          onDataSubmit={handleDataSubmit}
          initialMessage="Ho notato alcuni problemi con la mia pianta, puoi aiutarmi?"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto">
        <div className="text-center mb-6">
          <div className="bg-green-100 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <Leaf className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Plant Patho Pal</h1>
          <p className="text-gray-600">Il tuo assistente virtuale per la salute delle piante</p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">Dati della tua pianta:</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>🌱 Tipo: {plantData.plantType}</p>
              <p>🔍 Sintomi: {plantData.symptoms}</p>
              <p>📍 Posizione: {plantData.location}</p>
              <p>⏰ Durata: {plantData.duration}</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleStartChat}
          className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
        >
          <Bot className="w-5 h-5" />
          Consulta il Fitopatologo
        </button>
      </div>
    </div>
  );
};

export default PlantPathoApp;
