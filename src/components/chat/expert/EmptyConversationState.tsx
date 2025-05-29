
import React from "react";
import { Button } from "@/components/ui/button";

type EmptyConversationStateProps = {
  onStartChat: () => void;
};

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
