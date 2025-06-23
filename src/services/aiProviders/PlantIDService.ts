
import { supabase } from '@/integrations/supabase/client';

export interface PlantIDResult {
  plantName: string;
  scientificName: string;
  confidence: number;
  commonNames: string[];
  probability: number;
  provider: 'plant-id';
  plantDetails?: {
    family?: string;
    genus?: string;
    edible?: boolean;
    poisonous?: boolean;
  };
}

export class PlantIDService {
  static async identifyPlant(imageBase64: string): Promise<PlantIDResult> {
    try {
      console.log("🌱 Plant.ID: Identificazione pianta...");
      
      const { data, error } = await supabase.functions.invoke('plant-id-diagnosis', {
        body: { 
          images: [imageBase64],
          modifiers: ["crops_fast", "similar_images"],
          plant_details: ["common_names", "edible_parts", "toxicity"]
        }
      });
      
      if (error) throw error;
      
      const topSuggestion = data.suggestions?.[0];
      if (!topSuggestion) {
        throw new Error('Nessuna identificazione disponibile');
      }
      
      return {
        plantName: topSuggestion.plant_name || 'Pianta non identificata',
        scientificName: topSuggestion.plant_details?.scientific_name || 'Specie sconosciuta',
        confidence: Math.round((topSuggestion.probability || 0.7) * 100),
        commonNames: topSuggestion.plant_details?.common_names || [],
        probability: Math.round((topSuggestion.probability || 0.7) * 100),
        provider: 'plant-id',
        plantDetails: {
          family: topSuggestion.plant_details?.taxonomy?.family,
          genus: topSuggestion.plant_details?.taxonomy?.genus,
          edible: topSuggestion.plant_details?.edible_parts?.length > 0,
          poisonous: topSuggestion.plant_details?.toxicity?.poisonous_to_humans === 1
        }
      };
    } catch (error) {
      console.warn('Plant.ID failed:', error);
      return {
        plantName: 'Identificazione fallita',
        scientificName: 'Non disponibile',
        confidence: 40,
        commonNames: [],
        probability: 40,
        provider: 'plant-id'
      };
    }
  }
}
