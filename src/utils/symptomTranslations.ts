/**
 * Traduzione sintomi da inglese a italiano
 */

const symptomTranslations: Record<string, string> = {
  // Sintomi foglie
  'yellowing leaves': 'ingiallimento delle foglie',
  'yellow leaves': 'foglie gialle',
  'brown spots': 'macchie marroni',
  'wilting': 'appassimento',
  'drooping': 'afflosciamento',
  'curling leaves': 'foglie arricciate',
  'leaf curl': 'arricciamento fogliare',
  'leaf drop': 'caduta delle foglie',
  'falling leaves': 'caduta delle foglie',
  'brown tips': 'punte marroni',
  'brown edges': 'bordi marroni',
  'dried leaves': 'foglie secche',
  'dry leaves': 'foglie secche',
  'crispy leaves': 'foglie croccanti',
  'pale leaves': 'foglie pallide',
  'dark spots': 'macchie scure',
  'black spots': 'macchie nere',
  'white spots': 'macchie bianche',
  'holes in leaves': 'buchi nelle foglie',
  'leaf damage': 'danni alle foglie',
  'deformed leaves': 'foglie deformate',
  'stunted growth': 'crescita stentata',
  'slow growth': 'crescita lenta',
  'no growth': 'assenza di crescita',
  
  // Sintomi malattie
  'powdery mildew': 'oidio',
  'mold': 'muffa',
  'mildew': 'muffa',
  'fungal infection': 'infezione fungina',
  'fungus': 'fungo',
  'bacterial infection': 'infezione batterica',
  'virus': 'virus',
  'rot': 'marciume',
  'root rot': 'marciume radicale',
  'stem rot': 'marciume del fusto',
  'blight': 'peronospora',
  'rust': 'ruggine',
  'necrosis': 'necrosi',
  'chlorosis': 'clorosi',
  'lesions': 'lesioni',
  
  // Sintomi parassiti
  'pests': 'parassiti',
  'insects': 'insetti',
  'aphids': 'afidi',
  'spider mites': 'ragnetto rosso',
  'scale insects': 'cocciniglie',
  'mealybugs': 'cocciniglie cotonose',
  'whiteflies': 'mosche bianche',
  'thrips': 'tripidi',
  'caterpillars': 'bruchi',
  'snails': 'lumache',
  'slugs': 'limacce',
  
  // Sintomi ambientali
  'sunburn': 'scottatura solare',
  'sun damage': 'danni da sole',
  'frost damage': 'danni da gelo',
  'cold damage': 'danni da freddo',
  'heat stress': 'stress da caldo',
  'overwatering': 'eccesso di acqua',
  'underwatering': 'carenza di acqua',
  'drought stress': 'stress da siccità',
  'nutrient deficiency': 'carenza nutrizionale',
  'nitrogen deficiency': 'carenza di azoto',
  'iron deficiency': 'carenza di ferro',
  'magnesium deficiency': 'carenza di magnesio',
  'phosphorus deficiency': 'carenza di fosforo',
  'potassium deficiency': 'carenza di potassio',
  
  // Altri sintomi
  'weak stems': 'fusti deboli',
  'thin stems': 'fusti sottili',
  'leggy growth': 'crescita filata',
  'etiolation': 'eziolamento',
  'discoloration': 'scolorimento',
  'fading color': 'sbiadimento del colore',
  'loss of color': 'perdita di colore',
  'sticky leaves': 'foglie appiccicose',
  'sooty mold': 'fumaggine',
  'webbing': 'ragnatele',
  'distorted growth': 'crescita distorta',
  'malformed': 'malformato',
};

/**
 * Traduce un sintomo dall'inglese all'italiano
 */
export const translateSymptom = (symptom: string): string => {
  const lowerSymptom = symptom.toLowerCase().trim();
  
  // Cerca corrispondenza esatta
  if (symptomTranslations[lowerSymptom]) {
    return symptomTranslations[lowerSymptom];
  }
  
  // Cerca corrispondenza parziale
  for (const [english, italian] of Object.entries(symptomTranslations)) {
    if (lowerSymptom.includes(english) || english.includes(lowerSymptom)) {
      return italian;
    }
  }
  
  // Se non trovata, ritorna l'originale
  return symptom;
};

/**
 * Traduce un array di sintomi
 */
export const translateSymptoms = (symptoms: string[]): string[] => {
  return symptoms.map(translateSymptom);
};

/**
 * Traduce una stringa di sintomi separati da virgola
 */
export const translateSymptomsString = (symptomsString: string): string => {
  const symptoms = symptomsString.split(',').map(s => s.trim());
  const translated = translateSymptoms(symptoms);
  return translated.join(', ');
};
