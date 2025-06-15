
import React from "react";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";

interface EmojiPickerProps {
  onSelect: (emoji: any) => void;
  open: boolean;
  onClose: () => void;
}
const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelect, open, onClose }) => {
  if (!open) return null;
  return (
    <div className="absolute z-30 mt-2">
      <Picker
        data={data}
        onEmojiSelect={onSelect}
        theme="light"
      />
      <button onClick={onClose} className="absolute top-0 right-0 bg-gray-200 rounded-full p-1">✖</button>
    </div>
  );
};
export default EmojiPicker;
