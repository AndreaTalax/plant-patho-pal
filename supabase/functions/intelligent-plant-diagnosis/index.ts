// Tipi TypeScript per sicurezza e chiarezza
interface PlantSuggestion {
  name: string;
  scientificName: string;
  confidence: number;
  source: string;
  family: string;
}

interface DiseaseSuggestion {
  name: string;
  confidence: number;
  symptoms: string[];
  treatments: string[];
  cause: string;
  source: string;
}

interface SuggestionResponse {
  plants: PlantSuggestion[];
  diseases: DiseaseSuggestion[];
  message: string;
}

/**
 * Genera suggerimenti intelligenti per la pianta
 * 1️⃣ iNaturalist
 * 2️⃣ GBIF
 * 3️⃣ fallback interno
 */
async function generatePlantSuggestions(
  visualFeatures: any,
  observations?: string
): Promise<SuggestionResponse> {
  // fallback interno
  const fallback = generateIntelligentFallback(visualFeatures, observations);
  let plants: PlantSuggestion[] = fallback.plants;
  let diseases: DiseaseSuggestion[] = fallback.diseases;
  let message: string = fallback.message;

  // Determina query in base alle caratteristiche visive
  let query = "plant";
  if (visualFeatures.plantType === "herb") query = "herb";
  else if (visualFeatures.seemsSucculent) query = "succulent";
  else if (visualFeatures.hasLargeLeaves) query = "houseplant";
  else if (visualFeatures.hasFlowers) query = "flower";

  // ---------- 1. iNaturalist ----------
  try {
    const res = await fetch(
      `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(query)}&rank=species&per_page=5`
    );
    const data = await res.json();

    if (data.results && data.results.length > 0) {
      plants = data.results.map((item: any, index: number) => ({
        name: item.preferred_common_name || item.name,
        scientificName: item.name,
        confidence: 85 - index * 5,
        source: "iNaturalist",
        family: item.iconic_taxon_name || "Sconosciuta"
      }));
      message = `🔍 Ho trovato alcune specie su **iNaturalist**. La più probabile è **${plants[0].name}** (${plants[0].scientificName}).`;
      return { plants, diseases, message };
    }
  } catch (err) {
    console.warn("Errore API iNaturalist:", err);
  }

  // ---------- 2. GBIF ----------
  try {
    const res = await fetch(
      `https://api.gbif.org/v1/species/search?q=${encodeURIComponent(query)}&limit=5`
    );
    const data = await res.json();

    if (data.results && data.results.length > 0) {
      plants = data.results.map((item: any, index: number) => ({
        name: item.vernacularName || item.scientificName,
        scientificName: item.scientificName,
        confidence: 80 - index * 5,
        source: "GBIF",
        family: item.family || "Sconosciuta"
      }));
      message = `🔍 Ho trovato alcune specie su **GBIF**. La più probabile è **${plants[0].name}** (${plants[0].scientificName}).`;
      return { plants, diseases, message };
    }
  } catch (err) {
    console.warn("Errore API GBIF:", err);
  }

  // ---------- 3. fallback interno ----------
  return { plants, diseases, message };
}
