
import { supabase } from '@/integrations/supabase/client';

interface VisualAnalysisResult {
  leafCondition: {
    yellowing: boolean;
    spots: boolean;
    excessiveFall: boolean;
    dryness: boolean;
    description: string;
  };
  stemAndFlowerCondition: {
    deterioration: boolean;
    abnormalGrowth: boolean;
    spots: boolean;
    pests: boolean;
    description: string;
  };
  rootCondition: {
    healthy: boolean;
    rot: boolean;
    description: string;
  };
  generalGrowth: {
    upright: boolean;
    newLeaves: boolean;
    newShoots: boolean;
    drooping: boolean;
    inclined: boolean;
    description: string;
  };
  overallObservation: string;
  specificCauses: string[];
}

export class VisualPlantAnalysisService {
  static async analyzeVisualConditions(imageBase64: string): Promise<VisualAnalysisResult> {
    try {
      console.log('🔍 Avvio analisi visiva dettagliata dell\'immagine...');
      
      const { data, error } = await supabase.functions.invoke('gpt-vision-diagnosis', {
        body: { 
          imageBase64,
          analysisType: 'visual_inspection',
          focusAreas: [
            'leaf_condition',
            'stem_flower_condition', 
            'root_condition',
            'general_growth'
          ]
        }
      });

      if (error) {
        console.warn('❌ Analisi visiva GPT fallita:', error);
        return this.createFallbackVisualAnalysis();
      }

      return this.processVisualAnalysisResult(data);
    } catch (error) {
      console.error('❌ Errore nell\'analisi visiva:', error);
      return this.createFallbackVisualAnalysis();
    }
  }

  private static processVisualAnalysisResult(data: any): VisualAnalysisResult {
    console.log('📊 Elaborazione risultato analisi visiva:', data);
    
    // Estrai le osservazioni specifiche dal risultato GPT
    const analysis = data.visualAnalysis || {};
    
    return {
      leafCondition: {
        yellowing: analysis.leafYellowing || false,
        spots: analysis.leafSpots || false,
        excessiveFall: analysis.leafFall || false,
        dryness: analysis.leafDryness || false,
        description: analysis.leafDescription || 'Condizione foglie: normale'
      },
      stemAndFlowerCondition: {
        deterioration: analysis.stemDeterioration || false,
        abnormalGrowth: analysis.abnormalGrowth || false,
        spots: analysis.stemSpots || false,
        pests: analysis.pests || false,
        description: analysis.stemDescription || 'Condizione steli e fiori: normale'
      },
      rootCondition: {
        healthy: analysis.rootsHealthy !== false,
        rot: analysis.rootRot || false,
        description: analysis.rootDescription || 'Condizione radici: non visibile nell\'immagine'
      },
      generalGrowth: {
        upright: analysis.uprightGrowth !== false,
        newLeaves: analysis.newLeaves || false,
        newShoots: analysis.newShoots || false,
        drooping: analysis.drooping || false,
        inclined: analysis.inclined || false,
        description: analysis.growthDescription || 'Crescita generale: normale'
      },
      overallObservation: data.overallObservation || 'Pianta in condizioni generalmente normali',
      specificCauses: data.specificCauses || []
    };
  }

  private static createFallbackVisualAnalysis(): VisualAnalysisResult {
    return {
      leafCondition: {
        yellowing: false,
        spots: false,
        excessiveFall: false,
        dryness: false,
        description: 'Analisi visiva delle foglie non disponibile'
      },
      stemAndFlowerCondition: {
        deterioration: false,
        abnormalGrowth: false,
        spots: false,
        pests: false,
        description: 'Analisi visiva di steli e fiori non disponibile'
      },
      rootCondition: {
        healthy: true,
        rot: false,
        description: 'Condizione radici non valutabile dall\'immagine'
      },
      generalGrowth: {
        upright: true,
        newLeaves: false,
        newShoots: false,
        drooping: false,
        inclined: false,
        description: 'Valutazione crescita generale non disponibile'
      },
      overallObservation: 'Analisi visiva limitata - consultare un esperto per valutazione dettagliata',
      specificCauses: ['Analisi automatica non disponibile']
    };
  }

  static formatVisualAnalysisForDisplay(analysis: VisualAnalysisResult): string {
    let report = '👁️ **Osservazione diretta dell\'immagine:**\n\n';
    
    // Foglie
    report += '🍃 **Condizione delle foglie:**\n';
    const leafIssues = [];
    if (analysis.leafCondition.yellowing) leafIssues.push('ingiallimento presente');
    if (analysis.leafCondition.spots) leafIssues.push('macchie visibili');
    if (analysis.leafCondition.excessiveFall) leafIssues.push('caduta eccessiva');
    if (analysis.leafCondition.dryness) leafIssues.push('secchezza evidente');
    
    if (leafIssues.length > 0) {
      report += `- Problemi rilevati: ${leafIssues.join(', ')}\n`;
    } else {
      report += '- Nessun problema evidente rilevato\n';
    }
    report += `- ${analysis.leafCondition.description}\n\n`;

    // Steli e fiori
    report += '🌸 **Condizione di steli e fiori:**\n';
    const stemIssues = [];
    if (analysis.stemAndFlowerCondition.deterioration) stemIssues.push('segni di deperimento');
    if (analysis.stemAndFlowerCondition.abnormalGrowth) stemIssues.push('crescita anomala');
    if (analysis.stemAndFlowerCondition.spots) stemIssues.push('macchie presenti');
    if (analysis.stemAndFlowerCondition.pests) stemIssues.push('possibili parassiti');
    
    if (stemIssues.length > 0) {
      report += `- Problemi rilevati: ${stemIssues.join(', ')}\n`;
    } else {
      report += '- Nessun problema evidente rilevato\n';
    }
    report += `- ${analysis.stemAndFlowerCondition.description}\n\n`;

    // Crescita generale
    report += '📏 **Crescita generale:**\n';
    const growthFeatures = [];
    if (analysis.generalGrowth.upright) growthFeatures.push('postura eretta');
    if (analysis.generalGrowth.newLeaves) growthFeatures.push('nuove foglie');
    if (analysis.generalGrowth.newShoots) growthFeatures.push('nuovi germogli');
    if (analysis.generalGrowth.drooping) growthFeatures.push('portamento cadente');
    if (analysis.generalGrowth.inclined) growthFeatures.push('inclinazione presente');
    
    if (growthFeatures.length > 0) {
      report += `- Caratteristiche: ${growthFeatures.join(', ')}\n`;
    }
    report += `- ${analysis.generalGrowth.description}\n\n`;

    // Cause specifiche
    if (analysis.specificCauses.length > 0) {
      report += '🔍 **Possibili cause identificate:**\n';
      analysis.specificCauses.forEach((cause, index) => {
        report += `${index + 1}. ${cause}\n`;
      });
      report += '\n';
    }

    // Osservazione generale
    report += `💬 **Osservazione generale:** ${analysis.overallObservation}`;

    return report;
  }
}
