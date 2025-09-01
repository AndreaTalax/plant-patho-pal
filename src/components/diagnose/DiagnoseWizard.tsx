
import { useState } from "react";
import UserInfoForm from "./UserInfoForm";
import PlantInfoForm from "./PlantInfoForm";

/**
* Builds a diagnosis message by combining personal user data and plant information.
* @example
* buildDiagnosisMessage(user, plant)
* Returns a formatted string with user and plant details.
* @param {any} user - Contains personal information such as name and email.
* @param {any} plant - Contains plant details such as name, environment (indoor/outdoor), and symptoms.
* @returns {string} A formatted message that consolidates user and plant information into a readable format.
* @description
*   - Constructs the message using template literals for clarity and readability.
*   - Handles missing plant names by displaying a placeholder value ("-").
*/
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

interface DiagnoseWizardProps {
  onBack?: () => void;
  onComplete?: () => void;
}

/**
 * Component that manages the diagnostic steps for the wizard.
 * @example
 * <DiagnoseWizard />
 * // Renders the UserInfoForm for the first step, 
 * // and transitions to PlantInfoForm upon completion.
 * @param {DiagnoseWizardProps} props - Optional callback functions for navigation.
 * @returns {JSX.Element} The rendered form elements for the current step of the wizard.
 * @description
 *   - Manages the state transitions between different steps of the wizard.
 *   - Utilizes React's useState for step and user information management.
 *   - Handles asynchronous operation when sending data to an expert chat.
 */
export default function DiagnoseWizard({ onBack, onComplete }: DiagnoseWizardProps) {
  const [step, setStep] = useState(0);
  const [userInfo, setUserInfo] = useState(null);

  const handleUserInfoComplete = (data: any) => {
    setUserInfo(data);
    setStep(1);
  };

  const handlePlantInfoComplete = async (plantData: any) => {
    if (userInfo) {
      await sendAllToExpertChat(userInfo, plantData);
      if (onComplete) {
        onComplete();
      }
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
