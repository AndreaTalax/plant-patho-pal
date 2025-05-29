
import { useState } from "react";
import UserInfoForm from "./UserInfoForm";
import PlantInfoForm from "./PlantInfoForm";

function buildDiagnosisMessage(user: any, plant: any) {
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

async function sendAllToExpertChat(user: any, plant: any) {
  // For now, we'll just log the data
  // This function will be properly implemented when chat service is available
  console.log("Sending to expert chat:", buildDiagnosisMessage(user, plant));
}

export default function DiagnoseWizard() {
  const [step, setStep] = useState(0);
  const [userInfo, setUserInfo] = useState(null);

  const handleUserInfoComplete = (data: any) => {
    setUserInfo(data);
    setStep(1);
  };

  const handlePlantInfoComplete = async (plantData: any) => {
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
