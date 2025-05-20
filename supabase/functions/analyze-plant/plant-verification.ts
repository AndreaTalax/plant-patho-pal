
// Just updating the checkForEppoConcerns function to ensure it safely handles non-string values.
// For example, in the case where it's called directly with an object that might not have a label property,
// or where the label is not a string.

export function checkForEppoConcerns(labelOrData: any): any {
  // If it's an ArrayBuffer (from the other overloaded version), just return a default result
  if (labelOrData instanceof ArrayBuffer) {
    return {
      isEppoConcern: false,
      concernName: null,
      eppoCode: null,
      concernType: null,
      regulatoryStatus: null
    };
  }
  
  // Make sure we're working with a string
  const label = typeof labelOrData === 'string' ? labelOrData : 
                (labelOrData?.label && typeof labelOrData.label === 'string') ? 
                labelOrData.label : '';
  
  // Now we can safely use toLowerCase() since we ensured label is a string
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
