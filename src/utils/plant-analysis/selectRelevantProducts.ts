
/**
 * Seleziona prodotti rilevanti basandosi sulle malattie effettivamente rilevate
 * @param {string} plantName - Nome della pianta
 * @param {boolean} isHealthy - Indica se la pianta è sana
 * @param {Array} diseases - Array di malattie rilevate
 * @returns {string[]} Array di codici prodotto su misura per i problemi rilevati
 */
export const selectRelevantProducts = (
  plantName: string, 
  isHealthy: boolean,
  diseases?: Array<{ name: string; cause?: string; symptoms?: string[] }>
): string[] => {
  // Se la pianta è sana, prodotti di mantenimento
  if (isHealthy) {
    return ['2', '1']; // Fertilizzanti e cura generica
  }

  // Se abbiamo malattie specifiche, selezioniamo in base a quelle
  if (diseases && diseases.length > 0) {
    const productCodes = new Set<string>();
    
    diseases.forEach(disease => {
      const diseaseLower = (disease.name || '').toLowerCase();
      const causeLower = (disease.cause || '').toLowerCase();
      const symptomsText = (disease.symptoms || []).join(' ').toLowerCase();
      const combinedText = `${diseaseLower} ${causeLower} ${symptomsText}`;
      
      // Funghi e malattie fungine
      if (
        combinedText.includes('fungo') || 
        combinedText.includes('fungal') ||
        combinedText.includes('muffa') ||
        combinedText.includes('oidio') ||
        combinedText.includes('peronospora') ||
        combinedText.includes('ruggine') ||
        combinedText.includes('mold') ||
        combinedText.includes('rust') ||
        combinedText.includes('mildew')
      ) {
        productCodes.add('1'); // Fungicida Rame Biologico
        productCodes.add('3'); // Altro fungicida
      }
      
      // Insetti e parassiti
      if (
        combinedText.includes('insetto') ||
        combinedText.includes('insect') ||
        combinedText.includes('afide') ||
        combinedText.includes('aphid') ||
        combinedText.includes('parassita') ||
        combinedText.includes('pest') ||
        combinedText.includes('cocciniglia') ||
        combinedText.includes('tripidi') ||
        combinedText.includes('acari')
      ) {
        productCodes.add('4'); // Bacillus Thuringiensis (insetticida biologico)
      }
      
      // Problemi batterici
      if (
        combinedText.includes('batter') ||
        combinedText.includes('bacterial')
      ) {
        productCodes.add('1'); // Fungicida Rame (ha anche effetto battericida)
        productCodes.add('3');
      }
      
      // Carenze nutrizionali
      if (
        combinedText.includes('carenza') ||
        combinedText.includes('deficiency') ||
        combinedText.includes('nutrient') ||
        combinedText.includes('giallo') ||
        combinedText.includes('yellow') ||
        combinedText.includes('clorosi')
      ) {
        productCodes.add('2'); // Fertilizzante
      }
    });
    
    // Se abbiamo trovato prodotti specifici, restituiscili
    if (productCodes.size > 0) {
      return Array.from(productCodes);
    }
  }
  
  // Default per piante malate senza diagnosi specifica
  return ['1', '2']; // Fungicida base + fertilizzante
};
