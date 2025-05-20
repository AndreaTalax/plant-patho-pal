
// Aggiornamento della funzione checkForEppoConcerns per gestire in modo sicuro valori non stringa.
// Ad esempio, nel caso in cui sia chiamata direttamente con un oggetto che potrebbe non avere una proprietà label,
// o dove la label non è una stringa.

export function checkForEppoConcerns(labelOrData: any): any {
  // Se è un ArrayBuffer (dall'altra versione sovraccaricata), restituisci semplicemente un risultato predefinito
  if (labelOrData instanceof ArrayBuffer) {
    return {
      isEppoConcern: false,
      concernName: null,
      eppoCode: null,
      concernType: null,
      regulatoryStatus: null
    };
  }
  
  // Assicurati che stiamo lavorando con una stringa
  const label = typeof labelOrData === 'string' ? labelOrData : 
                (labelOrData?.label && typeof labelOrData.label === 'string') ? 
                labelOrData.label : '';
  
  // Ora possiamo usare toLowerCase() in modo sicuro poiché abbiamo garantito che label sia una stringa
  const lowerLabel = label.toLowerCase();
  
  const eppoRegulatedKeywords = [
    { keywords: ["xylella", "fastidiosa"], name: "Xylella fastidiosa", code: "XYLEFA", type: "Bacteria", regulatoryStatus: "Quarantine" },
    { keywords: ["fire", "blight", "erwinia", "amylovora"], name: "Erwinia amylovora (Fire Blight)", code: "ERWIAM", type: "Bacteria", regulatoryStatus: "Regulated" },
    { keywords: ["potato", "cyst", "nematode", "globodera"], name: "Globodera (Potato Cyst Nematode)", code: "HETDSP", type: "Nematode", regulatoryStatus: "Quarantine" },
    { keywords: ["asian", "longhorn", "beetle", "anoplophora"], name: "Anoplophora glabripennis (Asian Longhorn Beetle)", code: "ANOLGL", type: "Insect", regulatoryStatus: "Quarantine" },
    { keywords: ["pine", "wood", "nematode", "bursaphelenchus"], name: "Bursaphelenchus xylophilus (Pine Wood Nematode)", code: "BURSXY", type: "Nematode", regulatoryStatus: "Quarantine" }
  ];
  
  for (const entry of eppoRegulatedKeywords) {
    if (entry.keywords.some(keyword => lowerLabel.includes(keyword))) {
      return {
        isEppoConcern: true,
        concernName: entry.name,
        eppoCode: entry.code,
        concernType: entry.type,
        regulatoryStatus: entry.regulatoryStatus
      };
    }
  }
  
  return {
    isEppoConcern: false,
    concernName: null,
    eppoCode: null,
    concernType: null,
    regulatoryStatus: null
  };
}
