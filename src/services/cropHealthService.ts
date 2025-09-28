import { supabase } from '@/integrations/supabase/client';

export interface CropHealthResult {
  isHealthy: boolean;
  diseases: CropHealthDisease[];
  healthScore: number;
  suggestions: string[];
}

export interface CropHealthDisease {
  name: string;
  probability: number;
  description?: string;
  treatment?: string;
  severity?: 'low' | 'medium' | 'high';
  symptoms?: string[];
  cause?: string;
}

export class CropHealthService {
  static async analyzePlantHealth(
    imageBase64: string,
    plantName?: string
  ): Promise<CropHealthResult> {
    try {
      console.log('🏥 CropHealth: Avvio analisi malattie...', {
        hasImage: !!imageBase64,
        imageLength: imageBase64?.length,
        plantName
      });

      const { data, error } = await supabase.functions.invoke('crop-health-analysis', {
        body: {
          imageBase64: imageBase64,
          plantName: plantName,
          modifiers: ['crops_fast', 'similar_images', 'health_all'],
          diseaseDetails: [
            'cause',
            'common_names',
            'classification',
            'description',
            'treatment',
            'url',
          ],
        },
      });

      if (error) {
        console.error('❌ Errore crop-health-analysis:', error);
        throw error;
      }

      console.log('📦 Risposta API completa:', JSON.stringify(data, null, 2));

      const healthAssessment = data?.health_assessment;
      if (!healthAssessment) {
        console.warn('⚠️ Nessuna valutazione sanitaria trovata');
        return {
          isHealthy: true,
          diseases: [],
          healthScore: 80,
          suggestions: [
            'Pianta sembra in buona salute',
            'Continua il monitoraggio regolare',
          ],
        };
      }

      const diseases: CropHealthDisease[] = (healthAssessment.diseases ?? [])
        .filter((d: any) => d.probability > 0.1)
        .map((d: any, index: number) => {
          console.log(`🔍 Malattia ${index + 1}:`, JSON.stringify(d, null, 2));

          const treatmentBio = Array.isArray(d.disease_details?.treatment?.biological)
            ? d.disease_details.treatment.biological.join(', ')
            : '';
          const treatmentChem = Array.isArray(d.disease_details?.treatment?.chemical)
            ? d.disease_details.treatment.chemical.join(', ')
            : '';

          console.log('💊 Treatment biologico:', treatmentBio);
          console.log('💊 Treatment chimico:', treatmentChem);

          return {
            name: d.name || 'Malattia non identificata',
            probability: Math.round(d.probability * 100),
            description: d.disease_details?.description || 'Descrizione non disponibile',
            treatment: treatmentBio || treatmentChem || 'Consulta un esperto per il trattamento',
            symptoms: this.extractSymptoms(d),
            cause: d.disease_details?.cause || 'Causa non specificata',
            severity: this.calculateSeverity(d.probability),
          };
        })
        .sort((a, b) => b.probability - a.probability);

      const isHealthy =
        typeof healthAssessment.is_healthy === 'boolean'
          ? healthAssessment.is_healthy
          : (healthAssessment.is_healthy?.probability || 0) > 0.5 || diseases.length === 0;

      const healthScore = Math.round(
        typeof healthAssessment.is_healthy === 'boolean'
          ? isHealthy
            ? 100
            : 40
          : (healthAssessment.is_healthy?.probability || 0.8) * 100
      );

      const suggestions = this.generateSuggestions(isHealthy, diseases, healthScore);

      console.log(
        `✅ Analisi completata - ${diseases.length} malattie rilevate, salute: ${healthScore}%`
      );

      return {
        isHealthy,
        diseases,
        healthScore,
        suggestions,
      };
    } catch (error) {
      console.error('❌ CropHealth analysis error:', error);
      return {
        isHealthy: false,
        diseases: [],
        healthScore: 40,
        suggestions: [
          'Analisi automatica non riuscita',
          'Consulta un esperto per una valutazione dettagliata',
          'Monitora la pianta per eventuali cambiamenti',
        ],
      };
    }
  }

  private static extractSymptoms(disease: any): string[] {
    const symptoms: string[] = [];

    if (disease.disease_details?.description) {
      symptoms.push(disease.disease_details.description);
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

    const nameLower = disease.name?.toLowerCase() || '';
    if (nameLower.includes('spot')) symptoms.push('Macchie sulle foglie');
    if (nameLower.includes('blight')) symptoms.push('Ingiallimento e appassimento');
    if (nameLower.includes('rust')) symptoms.push('Macchie color ruggine');
    if (nameLower.includes('mildew')) symptoms.push('Muffa polverosa');

    return symptoms.length > 0 ? symptoms : ['Sintomi visibili sulla pianta'];
  }

  private static calculateSeverity(probability: number): 'low' | 'medium' | 'high' {
    if (probability > 0.7) return 'high';
    if (probability > 0.4) return 'medium';
    return 'low';
  }

  private static generateSuggestions(
    isHealthy: boolean,
    diseases: CropHealthDisease[],
    healthScore: number
  ): string[] {
    const suggestions: string[] = [];

    if (isHealthy && healthScore > 80) {
      suggestions.push('La pianta appare in buona salute');
      suggestions.push('Continua le cure regolari');
      suggestions.push('Monitora periodicamente per prevenire problemi');
    } else if (diseases.length > 0) {
      const highSeverityDiseases = diseases.filter((d) => d.severity === 'high');
      if (highSeverityDiseases.length > 0) {
        suggestions.push('⚠️ Rilevate malattie ad alta gravità - intervieni immediatamente');
        suggestions.push('Consulta un esperto per un piano di trattamento specifico');
      } else {
        suggestions.push('Rilevati alcuni problemi di salute');
        suggestions.push('Applica i trattamenti suggeriti');
      }
      suggestions.push('Migliora le condizioni ambientali (ventilazione, irrigazione)');
      suggestions.push('Rimuovi parti della pianta gravemente colpite');
      suggestions.push("Monitora attentamente l'evoluzione nei prossimi giorni");
    } else {
      suggestions.push('Salute della pianta incerta');
      suggestions.push('Osserva attentamente per sintomi visibili');
      suggestions.push('Mantieni buone pratiche di cura');
    }

    return suggestions;
  }
}
