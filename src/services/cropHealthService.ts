import { supabase } from '@/integrations/supabase/client';

export interface CropHealthDisease {
  name: string;
  probability: number;
  description: string;
  treatment: string;
  symptoms: string[];
  cause: string;
  severity: 'low' | 'medium' | 'high';
}

export interface CropHealthResult {
  isHealthy: boolean;
  diseases: CropHealthDisease[];
  healthScore: number;
  suggestions: string[];
}

/**
 * Servizio per l'analisi delle malattie delle piante usando Plant.ID Crop Health API
 * Utilizza la chiave API dedicata per crop.health
 */
export class CropHealthService {
  
  /**
   * Analizza le malattie delle piante usando Plant.ID Crop Health
   */
  static async analyzePlantHealth(imageBase64: string, plantName?: string): Promise<CropHealthResult> {
    try {
      console.log('🏥 CropHealth: Avvio analisi malattie...');
      
      const { data, error } = await supabase.functions.invoke('crop-health-analysis', {
        body: { 
          imageBase64: imageBase64.replace(/^data:image\/[a-z]+;base64,/, ''),
          plantName: plantName,
          modifiers: ['crops_fast', 'similar_images', 'health_all'], // Modificatori per crop health
          diseaseDetails: ['cause', 'common_names', 'classification', 'description', 'treatment', 'url']
        }
      });

      if (error) {
        console.error('❌ Errore crop-health-analysis:', error);
        throw error;
      }

      if (!data?.health_assessment) {
        console.log('⚠️ Nessuna valutazione sanitaria nella risposta');
        return {
          isHealthy: true,
          diseases: [],
          healthScore: 80,
          suggestions: ['Pianta sembra in buona salute', 'Continua il monitoraggio regolare']
        };
      }

      const healthAssessment = data.health_assessment;
      const diseases: CropHealthDisease[] = [];

      // Processa le malattie rilevate
      if (healthAssessment.diseases && Array.isArray(healthAssessment.diseases)) {
        for (const disease of healthAssessment.diseases) {
          if (disease.probability > 0.1) { // Solo malattie con probabilità > 10%
            diseases.push({
              name: disease.name || 'Malattia non identificata',
              probability: Math.round(disease.probability * 100),
              description: disease.disease_details?.description || 'Descrizione non disponibile',
              treatment: disease.disease_details?.treatment?.biological?.[0] || 
                        disease.disease_details?.treatment?.chemical?.[0] || 
                        'Consulta un esperto per il trattamento',
              symptoms: this.extractSymptoms(disease),
              cause: disease.disease_details?.cause || 'Causa non specificata',
              severity: this.calculateSeverity(disease.probability)
            });
          }
        }
      }

      // Ordina le malattie per probabilità decrescente
      diseases.sort((a, b) => b.probability - a.probability);

      const isHealthy = healthAssessment.is_healthy?.probability > 0.5 || diseases.length === 0;
      const healthScore = Math.round((healthAssessment.is_healthy?.probability || 0.8) * 100);

      const suggestions = this.generateSuggestions(isHealthy, diseases, healthScore);

      console.log(`✅ CropHealth: Analisi completata - ${diseases.length} malattie rilevate, salute: ${healthScore}%`);

      return {
        isHealthy,
        diseases,
        healthScore,
        suggestions
      };

    } catch (error) {
      console.error('CropHealth analysis error:', error);
      
      // Fallback in caso di errore
      return {
        isHealthy: true,
        diseases: [],
        healthScore: 50,
        suggestions: [
          'Analisi automatica non riuscita',
          'Consulta un esperto per una valutazione dettagliata',
          'Monitora la pianta per eventuali cambiamenti'
        ]
      };
    }
  }

  /**
   * Estrae i sintomi dalla risposta dell'API
   */
  private static extractSymptoms(disease: any): string[] {
    const symptoms: string[] = [];
    
    if (disease.disease_details?.description) {
      // Estrai sintomi dalla descrizione se disponibile
      const description = disease.disease_details.description;
      if (description.includes('symptoms') || description.includes('sintomi')) {
        symptoms.push(description);
      }
    }
    
    if (disease.disease_details?.classification?.includes('fungal')) {
      symptoms.push('Possibile infezione fungina');
    }
    
    if (disease.disease_details?.classification?.includes('bacterial')) {
      symptoms.push('Possibile infezione batterica');
    }
    
    if (disease.disease_details?.classification?.includes('viral')) {
      symptoms.push('Possibile infezione virale');
    }

    // Se non ci sono sintomi specifici, aggiungi sintomi generici basati sul nome della malattia
    if (symptoms.length === 0) {
      if (disease.name?.toLowerCase().includes('spot')) {
        symptoms.push('Macchie sulle foglie');
      }
      if (disease.name?.toLowerCase().includes('blight')) {
        symptoms.push('Ingiallimento e appassimento');
      }
      if (disease.name?.toLowerCase().includes('rust')) {
        symptoms.push('Macchie color ruggine');
      }
      if (disease.name?.toLowerCase().includes('mildew')) {
        symptoms.push('Muffa polverosa');
      }
    }
    
    return symptoms.length > 0 ? symptoms : ['Sintomi visibili sulla pianta'];
  }

  /**
   * Calcola la severità basata sulla probabilità
   */
  private static calculateSeverity(probability: number): 'low' | 'medium' | 'high' {
    if (probability > 0.7) return 'high';
    if (probability > 0.4) return 'medium';
    return 'low';
  }

  /**
   * Genera suggerimenti basati sui risultati dell'analisi
   */
  private static generateSuggestions(isHealthy: boolean, diseases: CropHealthDisease[], healthScore: number): string[] {
    const suggestions: string[] = [];

    if (isHealthy && healthScore > 80) {
      suggestions.push('La pianta appare in buona salute');
      suggestions.push('Continua le cure regolari');
      suggestions.push('Monitora periodicamente per prevenire problemi');
    } else if (diseases.length > 0) {
      const highSeverityDiseases = diseases.filter(d => d.severity === 'high');
      
      if (highSeverityDiseases.length > 0) {
        suggestions.push('⚠️ Rilevate malattie ad alta gravità - intervieni immediatamente');
        suggestions.push('Consulta un esperto per un piano di trattamento specifico');
      } else {
        suggestions.push('Rilevati alcuni problemi di salute');
        suggestions.push('Applica i trattamenti suggeriti');
      }
      
      suggestions.push('Migliora le condizioni ambientali (ventilazione, irrigazione)');
      suggestions.push('Rimuovi parti della pianta gravemente colpite');
      suggestions.push('Monitora attentamente l\'evoluzione nei prossimi giorni');
    } else {
      suggestions.push('Salute della pianta incerta');
      suggestions.push('Osserva attentamente per sintomi visibili');
      suggestions.push('Mantieni buone pratiche di cura');
    }

    return suggestions;
  }
}