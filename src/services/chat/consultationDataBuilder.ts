
interface PlantData {
  symptoms?: string;
  wateringFrequency?: string;
  sunExposure?: string;
  environment?: string;
  plantName?: string;
  imageUrl?: string;
  aiDiagnosis?: any;
  useAI?: boolean;
  sendToExpert?: boolean;
}

interface UserProfile {
  firstName?: string;
  lastName?: string;
  email?: string;
  birthDate?: string;
  birthPlace?: string;
}

export class ConsultationDataBuilder {
  static buildMainMessage(
    plantData: PlantData,
    userProfile: UserProfile,
    fromAIDiagnosis: boolean = false
  ): string {
    let mainMessage = `🌿 **Nuova Richiesta di Consulenza**

👤 **Dati Utente:**
- Nome: ${userProfile.firstName || (userProfile as any).first_name || 'Non specificato'} ${userProfile.lastName || (userProfile as any).last_name || ''}
- Email: ${userProfile.email || 'Non specificata'}
- Data di nascita: ${userProfile.birthDate || (userProfile as any).birth_date || 'Non specificata'}
- Luogo di nascita: ${userProfile.birthPlace || (userProfile as any).birth_place || 'Non specificato'}

🌱 **Informazioni della Pianta:**
- Nome/Tipo: ${plantData.plantName || 'Pianta non identificata'}
- Ambiente: ${plantData.environment || 'Non specificato'}
- Sintomi: ${plantData.symptoms || 'Nessun sintomo specificato'}
- Frequenza irrigazione: ${this.getWateringText(plantData.wateringFrequency)}
- Esposizione solare: ${this.getSunExposureText(plantData.sunExposure)}`;

    if (fromAIDiagnosis && plantData.aiDiagnosis) {
      mainMessage += `

🤖 **Diagnosi AI Precedente:**
- Pianta identificata: ${plantData.aiDiagnosis.consensus?.mostLikelyPlant?.plantName || 'Non identificata'}
- Confidenza: ${plantData.aiDiagnosis.consensus?.overallConfidence || 0}%
- Stato: ${plantData.aiDiagnosis.diseaseDetection?.length > 0 ? 'Problemi rilevati' : 'Apparentemente sana'}`;
    }

    if (plantData.imageUrl) {
      mainMessage += `\n\n📸 **Immagine della pianta allegata**`;
    }

    mainMessage += `\n\n*Dati (compresi dati personali) inviati automaticamente dal sistema Dr.Plant*`;

    return mainMessage;
  }

  private static getWateringText(frequency?: string): string {
    const wateringMap: { [key: string]: string } = {
      'quotidiana': 'Quotidiana',
      'ogni-2-giorni': 'Ogni 2 giorni',
      '2-volte-settimana': '2 volte a settimana',
      'settimanale': 'Settimanale',
      'ogni-2-settimane': 'Ogni 2 settimane',
      'mensile': 'Mensile',
      'quando-necessario': 'Quando il terreno è secco'
    };
    return wateringMap[frequency || ''] || frequency || 'Non specificata';
  }

  private static getSunExposureText(exposure?: string): string {
    const exposureMap: { [key: string]: string } = {
      'sole-diretto': 'Sole diretto',
      'sole-parziale': 'Sole parziale',
      'ombra-parziale': 'Ombra parziale',
      'ombra-completa': 'Ombra completa',
      'luce-indiretta': 'Luce indiretta',
      'luce-artificiale': 'Luce artificiale'
    };
    return exposureMap[exposure || ''] || exposure || 'Non specificata';
  }
}
