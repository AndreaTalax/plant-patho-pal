import { useState } from "react";
import UserInfoForm from "./UserInfoForm";
import PlantInfoForm from "./PlantInfoForm";
import { chatService } from "@/components/chat/chatService";

function buildDiagnosisMessage(user, plant) {
  return `
👤 **Dati personali**
Nome: ${user.nome} ${user.cognome}
Email: ${user.email}

🌱 **Dati pianta**
Nome: ${plant.name || "-"}
Ambiente: ${plant.isIndoor ? "Interno" : "Esterno"}
Frequenza irrigazione: ${plant.wateringFrequency}
Esposizione luce: ${plant.lightExposure}
Sintomi: ${plant.symptoms}
`.trim();
}

async function sendAllToExpertChat(user, plant) {
  let conversation = (await chatService.getConversations(user.id))
    .find(c => c.username === "Fitopatologo");
  if (!conversation) {
    conversation = await chatService.createConversation("Fitopatologo");
  }
  await chatService.sendMessage(conversation.id, {
    sender: user.nome,
    text: buildDiagnosisMessage(user, plant),
  });
}

export default function DiagnoseWizard() {
  const [step, setStep] = useState(0);
  const [userInfo, setUserInfo] = useState(null);

  const handleUserInfoComplete = (data) => {
    setUserInfo(data);
    setStep(1);
  };

  const handlePlantInfoComplete = async (plantData) => {
    if (userInfo) {
      await sendAllToExpertChat(userInfo, plantData);
      // Prosegui con flow...
    }
  };

  return (
    <>
      {step === 0 && <UserInfoForm onComplete={handleUserInfoComplete} />}
      {step === 1 && <PlantInfoForm onComplete={handlePlantInfoComplete} />}
    </>
  );
}
