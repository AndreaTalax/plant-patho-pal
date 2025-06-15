
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
    const firstName = userProfile.firstName || (userProfile as any).first_name || 'Non specificato';
    const lastName = userProfile.lastName || (userProfile as any).last_name || '';
    const email = userProfile.email || 'Non specificata';
    const birthDate = userProfile.birthDate || (userProfile as any).birth_date || 'Non specificata';
    const birthPlace = userProfile.birthPlace || (userProfile as any).birth_place || 'Non specificato';

    let mainMessage = `🌿 **NUOVA RICHIESTA DI CONSULENZA FITOSANITARIA**

👤 **DATI PERSONALI DEL CLIENTE:**
- **Nome completo:** ${firstName} ${lastName}
- **Email:** ${email}
- **Data di nascita:** ${birthDate}
- **Luogo di nascita:** ${birthPlace}

🌱 **INFORMAZIONI DETTAGLIATE DELLA PIANTA:**
- **Nome/Tipo pianta:** ${plantData.plantName || 'Specie da identificare durante la consulenza'}
- **Ambiente di coltivazione:** ${plantData.environment || 'Da specificare'}
- **Sintomi osservati:** ${plantData.symptoms || 'Da descrivere dettagliatamente durante la consulenza'}
- **Frequenza di irrigazione:** ${this.getWateringText(plantData.wateringFrequency)}
- **Esposizione alla luce:** ${this.getSunExposureText(plantData.sunExposure)}`;

    if (fromAIDiagnosis && plantData.aiDiagnosis) {
      mainMessage += `

🤖 **ANALISI AI PRELIMINARE GIÀ EFFETTUATA:**
- **Pianta identificata dall'AI:** ${plantData.aiDiagnosis.consensus?.mostLikelyPlant?.plantName || 'Non identificata con certezza'}
- **Livello di confidenza:** ${plantData.aiDiagnosis.consensus?.overallConfidence || 0}%
- **Stato di salute rilevato:** ${plantData.aiDiagnosis.diseaseDetection?.length > 0 ? 'Problemi rilevati - richiede attenzione esperta' : 'Apparentemente sana ma il cliente ha dubbi'}
- **Note:** Il cliente richiede una seconda opinione professionale`;
    }

    if (plantData.imageUrl) {
      mainMessage += `

📸 **DOCUMENTAZIONE FOTOGRAFICA:**
- Immagine ad alta risoluzione della pianta allegata automaticamente
- Foto scattata per mostrare i sintomi e lo stato generale della pianta`;
    }

    mainMessage += `

📋 **RICHIESTA:**
Il cliente richiede una consulenza professionale per:
- Identificazione corretta della specie (se non già determinata)
- Diagnosi accurata dei problemi fitosanitari
- Piano di trattamento specifico e personalizzato
- Consigli per la prevenzione

💡 **NOTA TECNICA:** Tutti i dati (personali e fitosanitari) sono stati inviati automaticamente dal sistema Dr.Plant per garantire una consulenza completa e personalizzata.`;

    return mainMessage;
  }

  private static getWateringText(frequency?: string): string {
    if (!frequency) return 'Da specificare durante la consulenza (frequenza attuale non indicata)';
    
    const wateringMap: { [key: string]: string } = {
      'quotidiana': 'Quotidiana (ogni giorno)',
      'ogni-2-giorni': 'Ogni 2 giorni',
      '2-volte-settimana': '2 volte a settimana',
      'settimanale': 'Settimanale (una volta a settimana)',
      'ogni-2-settimane': 'Ogni 2 settimane',
      'mensile': 'Mensile',
      'quando-necessario': 'Quando il terreno risulta secco al tatto'
    };
    return wateringMap[frequency] || `${frequency} (da verificare durante la consulenza)`;
  }

  private static getSunExposureText(exposure?: string): string {
    if (!exposure) return 'Da specificare durante la consulenza (esposizione attuale non indicata)';
    
    const exposureMap: { [key: string]: string } = {
      'sole-diretto': 'Sole diretto (pieno sole per molte ore al giorno)',
      'sole-parziale': 'Sole parziale (alcune ore di sole diretto)',
      'ombra-parziale': 'Ombra parziale (luce filtrata)',
      'ombra-completa': 'Ombra completa (nessun sole diretto)',
      'luce-indiretta': 'Luce indiretta (luminoso ma senza sole diretto)',
      'luce-artificiale': 'Luce artificiale (illuminazione LED/neon)'
    };
    return exposureMap[exposure] || `${exposure} (da verificare durante la consulenza)`;
  }
}
