
import React from "react";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import { X } from "lucide-react";
import "./EmojiPickerStyles.css";

interface EmojiPickerProps {
  onSelect: (emoji: any) => void;
  open: boolean;
  onClose: () => void;
}

const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelect, open, onClose }) => {
  if (!open) return null;

  const handleEmojiSelect = (emoji: any) => {
    console.log('Emoji selezionata:', emoji);
    // Passa l'emoji completo - assicuriamoci che abbia la proprietà native
    if (emoji && emoji.native) {
      onSelect(emoji);
    } else if (emoji && emoji.unified) {
      // Fallback per emoji unified format
      const emojiChar = String.fromCodePoint(parseInt(emoji.unified, 16));
      onSelect({ native: emojiChar, ...emoji });
    } else {
      console.error('Formato emoji non riconosciuto:', emoji);
    }
    onClose();
  };

  return (
    <div className="absolute bottom-full right-0 z-50 mb-2">
      <div className="relative bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        <button 
          onClick={onClose} 
          className="absolute top-2 right-2 z-10 bg-gray-100 hover:bg-gray-200 rounded-full p-1 transition-colors"
          aria-label="Chiudi selettore emoji"
        >
          <X className="h-4 w-4 text-gray-600" />
        </button>
        <div className="emoji-picker-container">
          <Picker
            data={data}
            onEmojiSelect={handleEmojiSelect}
            theme="light"
            locale="it"
            previewPosition="none"
            skinTonePosition="none"
            searchPosition="sticky"
            navPosition="bottom"
            perLine={8}
            maxFrequentRows={2}
            set="native"
            emojiSize={20}
            emojiButtonSize={28}
          />
        </div>
      </div>
    </div>
  );
};

export default EmojiPicker;
