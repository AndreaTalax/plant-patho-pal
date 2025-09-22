/**
 * Servizio per ottenere informazioni enciclopediche delle piante da Plantarium
 * Plantarium è un database open source di piante
 */

export interface PlantariumPlantInfo {
  scientificName: string;
  commonName?: string;
  family?: string;
  genus?: string;
  species?: string;
  description?: string;
  morphology?: string;
  habitat?: string;
  distribution?: string;
  characteristics?: string;
  imageUrl?: string;
}

export class PlantariumService {
  private static readonly SUPABASE_FUNCTION_URL = 'https://otdmqmpxukifoxjlgzmq.supabase.co/functions/v1/plantarium-proxy';
  
  /**
   * Cerca informazioni enciclopediche per una specie
   */
  static async getPlantInfo(scientificName: string): Promise<PlantariumPlantInfo | null> {
    try {
      console.log(`📖 Plantarium: Ricerca informazioni per "${scientificName}"`);
      
      const response = await fetch(this.SUPABASE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'getPlantInfo',
          scientificName: scientificName
        })
      });
      
      if (!response.ok) {
        throw new Error(`Plantarium search failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        console.log(`⚠️ Plantarium: ${data.error}`);
        return null;
      }
      
      console.log(`✅ Plantarium: Informazioni trovate per ${scientificName}`);
      return data;
      
    } catch (error) {
      console.error('Plantarium service error:', error);
      return null;
    }
  }
  
  /**
   * Formatta le informazioni in un testo leggibile per l'enciclopedia
   */
  static formatEncyclopedicText(plantInfo: PlantariumPlantInfo): string {
    const sections: string[] = [];
    
    if (plantInfo.description) {
      sections.push(plantInfo.description);
    }
    
    if (plantInfo.morphology) {
      sections.push(`**Morfologia:** ${plantInfo.morphology}`);
    }
    
    if (plantInfo.habitat) {
      sections.push(`**Habitat:** ${plantInfo.habitat}`);
    }
    
    if (plantInfo.characteristics) {
      sections.push(`**Caratteristiche:** ${plantInfo.characteristics}`);
    }
    
    return sections.join('\n\n') || 'Informazioni enciclopediche non disponibili per questa specie.';
  }
}