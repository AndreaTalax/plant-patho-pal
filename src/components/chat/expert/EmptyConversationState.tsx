
import React from "react";
import { Button } from "@/components/ui/button";

type EmptyConversationStateProps = {
  onStartChat: () => void;
};

/**
* Renders a UI component prompting the user to start a chat with a plant pathologist.
* @example
* onStartChat()
* Renders a button which starts a chat when clicked.
* @param {function} onStartChat - Callback function invoked to initiate a new conversation.
* @returns {JSX.Element} Returns a JSX element rendering the empty conversation state UI.
* @description
*   - The component displays a message encouraging the user to start a chat.
*   - It styles the button with specific classes for color and hover effects.
*   - It uses Flexbox to center and align its contents.
*/
const EmptyConversationState: React.FC<EmptyConversationStateProps> = ({
  onStartChat,
}) => (
  <div className="flex flex-col items-center justify-center h-full p-4">
    <h3 className="text-lg font-semibold mb-2">
      Non hai ancora iniziato una chat con il fitopatologo
    </h3>
    <p className="text-gray-500 text-center mb-4">
      Premi il pulsante qui sotto per iniziare una nuova conversazione e ricevere assistenza da un esperto.
    </p>
    <Button
      onClick={onStartChat}
      className="bg-drplant-green hover:bg-drplant-green-dark"
    >
      Inizia chat con fitopatologo
    </Button>
  </div>
);

export default EmptyConversationState;
