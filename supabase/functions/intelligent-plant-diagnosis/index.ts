function generateIntelligentFallback(visualFeatures: any, observations?: string) {
  const plants = [];
  const diseases = [];
  let message = "Non sono riuscito a identificare con certezza la pianta";

  // ----- Piante aromatiche -----
  if (visualFeatures.plantType === 'herb') {
    plants.push(
      { name: 'Basilico', scientificName: 'Ocimum basilicum', confidence: 65, source: 'Analisi Caratteristiche', family: 'Lamiaceae' },
      { name: 'Menta', scientificName: 'Mentha spicata', confidence: 60, source: 'Analisi Caratteristiche', family: 'Lamiaceae' },
      { name: 'Rosmarino', scientificName: 'Rosmarinus officinalis', confidence: 55, source: 'Analisi Caratteristiche', family: 'Lamiaceae' },
      { name: 'Timo', scientificName: 'Thymus vulgaris', confidence: 50, source: 'Analisi Caratteristiche', family: 'Lamiaceae' },
      { name: 'Prezzemolo', scientificName: 'Petroselinum crispum', confidence: 50, source: 'Analisi Caratteristiche', family: 'Apiaceae' }
    );
    message = "Sembra essere un'erba aromatica. Ecco i suggerimenti più probabili:";
    
    // Malattie comuni delle erbe
    diseases.push(
      { name: 'Oidio', confidence: 60, symptoms: ['Polvere bianca sulle foglie'], treatments: ['Rimuovere foglie infette', 'Spruzzare fungicida'], cause: 'Funghi', source: 'Analisi Visiva' },
      { name: 'Afidi', confidence: 55, symptoms: ['Piccoli insetti verdi o neri sulle foglie'], treatments: ['Sapone insetticida', 'Rimuovere manualmente'], cause: 'Insetti', source: 'Analisi Visiva' }
    );
  } 
  // ----- Piante succulente -----
  else if (visualFeatures.seemsSucculent) {
    plants.push(
      { name: 'Aloe Vera', scientificName: 'Aloe barbadensis', confidence: 70, source: 'Analisi Caratteristiche', family: 'Asphodelaceae' },
      { name: 'Echeveria', scientificName: 'Echeveria elegans', confidence: 65, source: 'Analisi Caratteristiche', family: 'Crassulaceae' },
      { name: 'Jade Plant', scientificName: 'Crassula ovata', confidence: 60, source: 'Analisi Caratteristiche', family: 'Crassulaceae' },
      { name: 'Sedum', scientificName: 'Sedum morganianum', confidence: 55, source: 'Analisi Caratteristiche', family: 'Crassulaceae' }
    );
    message = "Sembra essere una pianta succulenta. Ecco i tipi più comuni:";
    
    // Malattie comuni delle succulente
    diseases.push(
      { name: 'Marciume del fusto', confidence: 60, symptoms: ['Fusto molle', 'Foglie cadenti'], treatments: ['Ridurre irrigazione', 'Tagliare parti marce'], cause: 'Eccesso d’acqua', source: 'Analisi Visiva' },
      { name: 'Cocciniglia', confidence: 55, symptoms: ['Punti bianchi o cotonosi sulle foglie'], treatments: ['Rimuovere con cotton fioc', 'Insetticida'], cause: 'Insetti', source: 'Analisi Visiva' }
    );
  } 
  // ----- Piante da interno con foglie grandi -----
  else if (visualFeatures.hasLargeLeaves) {
    plants.push(
      { name: 'Monstera Deliciosa', scientificName: 'Monstera deliciosa', confidence: 60, source: 'Analisi Caratteristiche', family: 'Araceae' },
      { name: 'Filodendro', scientificName: 'Philodendron hederaceum', confidence: 55, source: 'Analisi Caratteristiche', family: 'Araceae' },
      { name: 'Pothos', scientificName: 'Epipremnum aureum', confidence: 50, source: 'Analisi Caratteristiche', family: 'Araceae' },
      { name: 'Ficus Benjamina', scientificName: 'Ficus benjamina', confidence: 50, source: 'Analisi Caratteristiche', family: 'Moraceae' }
    );
    message = "Sembra avere foglie grandi. Potrebbe essere una di queste piante da interno:";
    
    // Malattie comuni
    diseases.push(
      { name: 'Marciume radicale', confidence: 60, symptoms: ['Foglie cadenti', 'Terreno umido'], treatments: ['Controllare drenaggio', 'Ridurre irrigazione'], cause: 'Eccesso d’acqua', source: 'Analisi Visiva' },
      { name: 'Ruggine fogliare', confidence: 55, symptoms: ['Macchie arancioni o marroni sulle foglie'], treatments: ['Rimuovere foglie infette', 'Fungicida'], cause: 'Funghi', source: 'Analisi Visiva' }
    );
  } 
  // ----- Piante da fiore -----
  else if (visualFeatures.hasFlowers) {
    plants.push(
      { name: 'Rosa', scientificName: 'Rosa spp.', confidence: 55, source: 'Analisi Caratteristiche', family: 'Rosaceae' },
      { name: 'Orchidea', scientificName: 'Orchidaceae', confidence: 50, source: 'Analisi Caratteristiche', family: 'Orchidaceae' },
      { name: 'Geranio', scientificName: 'Pelargonium spp.', confidence: 45, source: 'Analisi Caratteristiche', family: 'Geraniaceae' },
      { name: 'Giglio', scientificName: 'Lilium spp.', confidence: 45, source: 'Analisi Caratteristiche', family: 'Liliaceae' },
      { name: 'Tulipano', scientificName: 'Tulipa spp.', confidence: 45, source: 'Analisi Caratteristiche', family: 'Liliaceae' }
    );
    message = "Vedo dei fiori. Potrebbe essere una di queste piante da fiore:";
    
    // Malattie comuni dei fiori
    diseases.push(
      { name: 'Oidio', confidence: 60, symptoms: ['Polvere bianca sulle foglie e fiori'], treatments: ['Fungicida', 'Rimuovere foglie infette'], cause: 'Funghi', source: 'Analisi Visiva' },
      { name: 'Afidi', confidence: 55, symptoms: ['Insetti sulle foglie o boccioli'], treatments: ['Sapone insetticida', 'Rimuovere manualmente'], cause: 'Insetti', source: 'Analisi Visiva' },
      { name: 'Botrite', confidence: 50, symptoms: ['Macchie grigie sulle foglie o fiori'], treatments: ['Rimuovere parti infette', 'Fungicida'], cause: 'Funghi', source: 'Analisi Visiva' }
    );
  } 
  // ----- Fallback generale -----
  else {
    plants.push(
      { name: 'Monstera Deliciosa', scientificName: 'Monstera deliciosa', confidence: 55, source: 'Suggerimento Generale', family: 'Araceae' },
      { name: 'Filodendro', scientificName: 'Philodendron hederaceum', confidence: 50, source: 'Suggerimento Generale', family: 'Araceae' },
      { name: 'Pothos', scientificName: 'Epipremnum aureum', confidence: 50, source: 'Suggerimento Generale', family: 'Araceae' },
      { name: 'Ficus Benjamina', scientificName: 'Ficus benjamina', confidence: 45, source: 'Suggerimento Generale', family: 'Moraceae' },
      { name: 'Sansevieria', scientificName: 'Sansevieria trifasciata', confidence: 45, source: 'Suggerimento Generale', family: 'Asparagaceae' }
    );
    message = "Ecco alcune piante da interno comuni che potrebbero corrispondere:";
    
    // Problemi generici
    diseases.push(
      { name: 'Foglie ingiallite', confidence: 55, symptoms: ['Foglie gialle'], treatments: ['Controllare irrigazione', 'Luce adeguata'], cause: 'Stress idrico/nutrizionale', source: 'Analisi Visiva' },
      { name: 'Foglie secche ai bordi', confidence: 50, symptoms: ['Bordi marroni e secchi'], treatments: ['Aumentare umidità', 'Fertilizzante'], cause: 'Secchezza ambientale', source: 'Analisi Visiva' },
      { name: 'Marciume radicale', confidence: 50, symptoms: ['Foglie cadenti', 'Terreno troppo bagnato'], treatments: ['Ridurre irrigazione', 'Controllare drenaggio'], cause: 'Eccesso d’acqua', source: 'Analisi Visiva' }
    );
  }

  return { plants, diseases, message };
}
