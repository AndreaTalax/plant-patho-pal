
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Image } from 'lucide-react';
import { AccessibleButton } from '@/components/ui/accessible-button';
import { AccessibleTouchArea } from '@/components/ui/accessible-controls';
import { voiceOverAnnouncements } from '@/utils/accessibility';

interface PersistentChatInputProps {
  onSendMessage?: (message: string) => void;
  onImageSelect?: (file: File) => void;
  placeholder?: string;
  disabled?: boolean;
}

const PersistentChatInput: React.FC<PersistentChatInputProps> = ({
  onSendMessage,
  onImageSelect,
  placeholder = "Scrivi il tuo messaggio all'esperto...",
  disabled = false
}) => {
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (message.trim() && onSendMessage) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImageSelect) {
      onImageSelect(file);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-t border-gray-200 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-end gap-3 bg-white rounded-3xl shadow-lg border border-gray-200 p-3">
          {/* Text Input Area */}
          <div className="flex-1">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              disabled={disabled}
              className="min-h-[50px] max-h-[120px] resize-none border-none bg-transparent text-gray-700 placeholder:text-gray-400 focus:ring-0 focus:outline-none p-3"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            />
          </div>

          {/* Image Button */}
          <AccessibleButton
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleImageClick}
            disabled={disabled}
            label="Seleziona immagine"
            className="h-12 w-12 rounded-2xl bg-gray-50 hover:bg-gray-100 border border-gray-200 flex-shrink-0"
            onLongPress={() => voiceOverAnnouncements.longPressAvailable()}
            onSwipeUp={handleImageClick}
          >
            <Image className="h-5 w-5 text-gray-600" />
          </AccessibleButton>

          {/* Send Button */}
          <AccessibleTouchArea
            onPress={handleSend}
            onDoubleClick={handleSend}
            onSwipeRight={handleSend}
            label="Invia messaggio"
            className="h-12 w-12 rounded-2xl bg-drplant-green hover:bg-drplant-green-dark text-white shadow-md flex-shrink-0 disabled:opacity-50"
          >
            <Send className="h-5 w-5" />
          </AccessibleTouchArea>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
};

export default PersistentChatInput;
