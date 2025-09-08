/**
 * Servizio per fornire suggerimenti quando l'identificazione automatica fallisce
 */
export class FallbackSuggestionsService {
  
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

  private static recommendedProducts = [
    'Fertilizzante liquido universale',
    'Spray fogliare nutriente',
    'Fungicida biologico',
    'Terriccio per piante verdi',
    'Concime a lenta cessione'
  ];

  /**
   * 🔹 Cerca su iNaturalist
   */
  private static async getFromINaturalist(query: string) {
    const response = await fetch(
      `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(query)}&rank=species&per_page=5`
    );
    const data = await response.json();

    if (!data.results?.length) return [];

    return data.results.map((taxon: any) => ({
      plantName: taxon.preferred_common_name || taxon.name,
      scientificName: taxon.name,
      confidence: taxon.observations_count || 50,
      habitat: taxon.iconic_taxon_name || 'sconosciuto',
      careInstructions: [`Verifica se si tratta di ${taxon.preferred_common_name || taxon.name}`],
      provider: 'iNaturalist'
    }));
  }

  /**
   * 🔹 Cerca su GBIF
   */
  private static async getFromGbif(query: string) {
    const response = await fetch(
      `https://api.gbif.org/v1/species/search?q=${encodeURIComponent(query)}&limit=5`
    );
    const data = await response.json();

    if (!data.results?.length) return [];

    return data.results.map((species: any) => ({
      plantName: species.vernacularName || species.scientificName,
      scientificName: species.scientificName,
      confidence: species.confidence || 40,
      habitat: species.rank,
      careInstructions: [`Specie trovata tramite GBIF: ${species.scientificName}`],
      provider: 'GBIF'
    }));
  }

  /**
   * 🔹 Fallback statico se tutto il resto fallisce
   */
  private static getStaticFallback() {
    return this.commonHouseplants.map(plant => ({
      plantName: plant.name,
      scientificName: plant.scientific,
      confidence: plant.confidence,
      habitat: 'Pianta da interno comune - identificazione suggerita',
      careInstructions: [`Possibile ${plant.name} - verifica con esperto per conferma`],
      provider: 'fallback'
    }));
  }

  /**
   * 🔹 Entry point: cerca prima iNaturalist, poi GBIF, infine statico
   */
  static async generateFallbackSuggestions(query: string) {
    let plantSuggestions = await this.getFromINaturalist(query);

    if (plantSuggestions.length === 0) {
      plantSuggestions = await this.getFromGbif(query);
    }

    if (plantSuggestions.length === 0) {
      plantSuggestions = this.getStaticFallback();
    }

    return {
      plantIdentification: plantSuggestions,
      diseaseDetection: this.commonPlantIssues.map(issue => ({
        disease: issue.name,
        confidence: issue.confidence,
        symptoms: issue.symptoms,
        treatments: issue.treatments,
        severity: 'medium',
        provider: 'fallback',
        additionalInfo: { cause: issue.cause }
      })),
      products: this.recommendedProducts,
      isFallback: true,
      fallbackMessage: 'Non siamo riusciti a identificare con certezza la tua pianta. Ecco alcune opzioni possibili:'
    };
  }
}
