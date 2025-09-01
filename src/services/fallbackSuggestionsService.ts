
/**
 * Servizio per fornire suggerimenti quando l'identificazione automatica fallisce
 */
export class FallbackSuggestionsService {
  
  /**
   * Piante comuni organizzate per categorie
   */
  private static commonHouseplants = [
    { name: 'Basilico', scientific: 'Ocimum basilicum', confidence: 50, category: 'herb' },
    { name: 'Menta', scientific: 'Mentha spicata', confidence: 48, category: 'herb' },
    { name: 'Rosmarino', scientific: 'Rosmarinus officinalis', confidence: 46, category: 'herb' },
    { name: 'Pothos', scientific: 'Epipremnum aureum', confidence: 45, category: 'houseplant' },
    { name: 'Monstera Deliciosa', scientific: 'Monstera deliciosa', confidence: 43, category: 'houseplant' },
    { name: 'Filodendro', scientific: 'Philodendron hederaceum', confidence: 40, category: 'houseplant' },
    { name: 'Sansevieria', scientific: 'Sansevieria trifasciata', confidence: 38, category: 'houseplant' },
    { name: 'Ficus', scientific: 'Ficus elastica', confidence: 35, category: 'houseplant' },
    { name: 'Aloe Vera', scientific: 'Aloe barbadensis', confidence: 44, category: 'succulent' },
    { name: 'Echeveria', scientific: 'Echeveria elegans', confidence: 42, category: 'succulent' }
  ];

  /**
   * Problemi comuni delle piante d'appartamento
   */
  private static commonPlantIssues = [
    {
      name: 'Ingiallimento foglie',
      confidence: 50,
      symptoms: ['Foglie gialle', 'Bordi secchi', 'Caduta foglie'],
      treatments: ['Ridurre annaffiature', 'Controllare drenaggio', 'Fertilizzante bilanciato'],
      cause: 'Eccesso di acqua o carenza nutrizionale',
      source: 'Diagnosi Generale'
    },
    {
      name: 'Macchie marroni',
      confidence: 45,
      symptoms: ['Macchie scure sulle foglie', 'Bordi secchi', 'Foglie appassite'],
      treatments: ['Migliorare ventilazione', 'Fungicida naturale', 'Rimuovere foglie danneggiate'],
      cause: 'Possibile infezione fungina o stress idrico',
      source: 'Diagnosi Generale'
    },
    {
      name: 'Foglie appassite',
      confidence: 40,
      symptoms: ['Foglie molli', 'Perdita di turgore', 'Crescita rallentata'],
      treatments: ['Verificare umidità terreno', 'Regolare irrigazione', 'Controllare radici'],
      cause: 'Stress idrico o problemi radicali',
      source: 'Diagnosi Generale'
    }
  ];

  /**
   * Prodotti generici consigliati per la cura delle piante
   */
  private static recommendedProducts = [
    'Fertilizzante liquido universale',
    'Spray fogliare nutriente',
    'Fungicida biologico',
    'Terriccio per piante verdi',
    'Concime a lenta cessione'
  ];

  /**
   * Genera suggerimenti di fallback quando l'identificazione automatica fallisce
   */
  static generateFallbackSuggestions() {
    return {
      plantIdentification: this.commonHouseplants.map(plant => ({
        plantName: plant.name,
        scientificName: plant.scientific,
        confidence: plant.confidence,
        habitat: 'Pianta da interno comune - identificazione suggerita',
        careInstructions: [`Possibile ${plant.name} - verifica con esperto per conferma`],
        provider: 'fallback'
      })),
      diseaseDetection: this.commonPlantIssues.map(issue => ({
        disease: issue.name,
        confidence: issue.confidence,
        symptoms: issue.symptoms,
        treatments: issue.treatments,
        severity: 'medium',
        provider: 'fallback',
        additionalInfo: {
          cause: issue.cause
        }
      })),
      products: this.recommendedProducts,
      isFallback: true,
      fallbackMessage: 'Non siamo riusciti a identificare con certezza la tua pianta. Ecco alcuni suggerimenti basati sulle piante più comuni:'
    };
  }

  /**
   * Genera suggerimenti specifici basati su caratteristiche visibili
   */
  static generateContextualSuggestions(hasFlowers: boolean, hasLargeLeaves: boolean, seemsSucculent: boolean) {
    let suggestions = { ...this.generateFallbackSuggestions() };

    if (hasLargeLeaves) {
      suggestions.plantIdentification = [
        { plantName: 'Monstera Deliciosa', scientificName: 'Monstera deliciosa', confidence: 55, habitat: 'Pianta con foglie grandi - possibile Monstera', careInstructions: ['Luce indiretta brillante', 'Terreno umido ma ben drenato'], provider: 'contextual' },
        { plantName: 'Filodendro', scientificName: 'Philodendron spp.', confidence: 50, habitat: 'Pianta tropicale con foglie grandi', careInstructions: ['Umidità elevata', 'Luce filtrata'], provider: 'contextual' },
        ...suggestions.plantIdentification.slice(2)
      ];
    }

    if (seemsSucculent) {
      suggestions.plantIdentification = [
        { plantName: 'Aloe Vera', scientificName: 'Aloe barbadensis', confidence: 60, habitat: 'Pianta succulenta - possibile Aloe', careInstructions: ['Poca acqua', 'Luce diretta'], provider: 'contextual' },
        { plantName: 'Echeveria', scientificName: 'Echeveria spp.', confidence: 55, habitat: 'Succulenta ornamentale', careInstructions: ['Terreno ben drenato', 'Luce brillante'], provider: 'contextual' },
        ...suggestions.plantIdentification.slice(2)
      ];
    }

    if (hasFlowers) {
      suggestions.diseaseDetection = [
        {
          disease: 'Caduta boccioli',
          confidence: 55,
          symptoms: ['Boccioli che cadono', 'Fiori che appassiscono presto'],
          treatments: ['Mantenere umidità costante', 'Evitare spostamenti', 'Fertilizzante per fioritura'],
          severity: 'medium',
          provider: 'contextual',
          additionalInfo: { cause: 'Stress ambientale durante la fioritura' }
        },
        ...suggestions.diseaseDetection.slice(1)
      ];
    }

    return suggestions;
  }
}
