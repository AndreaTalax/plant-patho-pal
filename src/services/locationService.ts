/**
 * Location Service - Gestisce i servizi di geolocalizzazione
 */

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
}

export interface NativePlantData {
  scientificName: string;
  commonName: string;
  family: string;
  habitat: string;
  bloomingSeason: string;
  rarity: 'comune' | 'non_comune' | 'raro' | 'molto_raro';
  conservationStatus?: string;
  description: string;
  uses?: string[];
}

class LocationService {
  private static instance: LocationService;
  private currentLocation: LocationData | null = null;

  public static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  /**
   * Ottiene la posizione corrente dell'utente
   */
  async getCurrentPosition(): Promise<LocationData> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocalizzazione non supportata'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: Date.now()
          };
          
          this.currentLocation = locationData;
          console.log('📍 Posizione ottenuta:', locationData);
          resolve(locationData);
        },
        (error) => {
          console.error('❌ Errore geolocalizzazione:', error);
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000 // Cache per 1 minuto
        }
      );
    });
  }

  /**
   * Ottiene le piante native della zona basate sulla posizione
   */
  async getNativePlantsForLocation(location: LocationData): Promise<NativePlantData[]> {
    try {
      // Determina la regione biogeografica italiana basata su coordinate
      const region = this.determineItalianRegion(location.latitude, location.longitude);
      
      console.log('🌿 Ricerca piante native per regione:', region);
      
      // Database semplificato di piante italiane per regione
      const nativePlantsDatabase = this.getNativePlantsDatabase();
      
      return nativePlantsDatabase[region] || nativePlantsDatabase['centro']; // Fallback al centro Italia
    } catch (error) {
      console.error('❌ Errore ricerca piante native:', error);
      return [];
    }
  }

  /**
   * Determina la regione italiana basata su coordinate
   */
  private determineItalianRegion(lat: number, lng: number): string {
    // Divisione semplificata dell'Italia in macro-regioni
    if (lat > 45.5) {
      return 'nord'; // Valle d'Aosta, Trentino, Lombardia nord, Veneto nord
    } else if (lat > 44.0) {
      return 'pianura_padana'; // Pianura Padana
    } else if (lat > 42.0) {
      return 'centro'; // Toscana, Marche, Umbria, Lazio, Abruzzo
    } else if (lat > 40.0) {
      return 'sud'; // Campania, Puglia, Basilicata, Calabria
    } else {
      return 'isole'; // Sicilia, Sardegna
    }
  }

  /**
   * Database semplificato di piante native italiane
   */
  private getNativePlantsDatabase(): Record<string, NativePlantData[]> {
    return {
      nord: [
        {
          scientificName: 'Larix decidua',
          commonName: 'Larice europeo',
          family: 'Pinaceae',
          habitat: 'Foreste montane, 1000-2400m',
          bloomingSeason: 'Maggio-Giugno',
          rarity: 'comune',
          description: 'Conifera decidua tipica delle Alpi, unica conifera europea che perde gli aghi in inverno.',
          uses: ['Legname', 'Ornamentale', 'Medicina tradizionale']
        },
        {
          scientificName: 'Rhododendron ferrugineum',
          commonName: 'Rododendro rosso',
          family: 'Ericaceae',
          habitat: 'Brughiere alpine, 1500-3000m',
          bloomingSeason: 'Giugno-Agosto',
          rarity: 'non_comune',
          description: 'Arbusto sempreverde tipico delle Alpi, con splendide fioriture rosa-rosse.',
          uses: ['Ornamentale', 'Indicatore ambientale']
        }
      ],
      pianura_padana: [
        {
          scientificName: 'Quercus robur',
          commonName: 'Farnia',
          family: 'Fagaceae',
          habitat: 'Pianure alluvionali, boschi umidi',
          bloomingSeason: 'Aprile-Maggio',
          rarity: 'comune',
          description: 'Quercia tipica della pianura padana, forma boschi planiziali.',
          uses: ['Legname', 'Fauna selvatica', 'Paesaggistica']
        },
        {
          scientificName: 'Populus nigra',
          commonName: 'Pioppo nero',
          family: 'Salicaceae',
          habitat: 'Rive dei fiumi, terreni umidi',
          bloomingSeason: 'Marzo-Aprile',
          rarity: 'comune',
          description: 'Albero pioniere tipico degli ambienti ripariali padani.',
          uses: ['Legname', 'Biomassa', 'Consolidamento sponde']
        }
      ],
      centro: [
        {
          scientificName: 'Quercus ilex',
          commonName: 'Leccio',
          family: 'Fagaceae',
          habitat: 'Macchia mediterranea, boschi termofili',
          bloomingSeason: 'Aprile-Maggio',
          rarity: 'comune',
          description: 'Quercia sempreverde simbolo della macchia mediterranea italiana.',
          uses: ['Legname', 'Carbone', 'Ghiande per animali']
        },
        {
          scientificName: 'Olea europaea',
          commonName: 'Olivo',
          family: 'Oleaceae',
          habitat: 'Colline mediterrane, coltivazioni',
          bloomingSeason: 'Maggio-Giugno',
          rarity: 'comune',
          description: 'Albero simbolo del Mediterraneo, coltivato da millenni.',
          uses: ['Alimentare', 'Olio', 'Legname', 'Ornamentale']
        }
      ],
      sud: [
        {
          scientificName: 'Arbutus unedo',
          commonName: 'Corbezzolo',
          family: 'Ericaceae',
          habitat: 'Macchia mediterranea, 0-800m',
          bloomingSeason: 'Ottobre-Dicembre',
          rarity: 'comune',
          description: 'Arbusto sempreverde con frutti rossi commestibili, simbolo italiano.',
          uses: ['Alimentare', 'Miele', 'Ornamentale', 'Medicina tradizionale']
        },
        {
          scientificName: 'Myrtus communis',
          commonName: 'Mirto',
          family: 'Myrtaceae',
          habitat: 'Macchia mediterranea, gariga',
          bloomingSeason: 'Maggio-Luglio',
          rarity: 'comune',
          description: 'Arbusto aromatico tipico del sud Italia, con bacche blu-nere.',
          uses: ['Liquori', 'Aromatica', 'Medicina tradizionale', 'Ornamentale']
        }
      ],
      isole: [
        {
          scientificName: 'Pistacia lentiscus',
          commonName: 'Lentisco',
          family: 'Anacardiaceae',
          habitat: 'Macchia mediterranea, gariga',
          bloomingSeason: 'Marzo-Maggio',
          rarity: 'comune',
          description: 'Arbusto sempreverde tipico delle isole mediterrane italiane.',
          uses: ['Resina', 'Medicina tradizionale', 'Ornamentale']
        },
        {
          scientificName: 'Juniperus phoenicea',
          commonName: 'Ginepro rosso',
          family: 'Cupressaceae',
          habitat: 'Coste rocciose, dune costiere',
          bloomingSeason: 'Febbraio-Aprile',
          rarity: 'non_comune',
          conservationStatus: 'Specie protetta',
          description: 'Ginepro adattato agli ambienti costieri salini.',
          uses: ['Consolidamento dune', 'Ornamentale', 'Aromatica']
        }
      ]
    };
  }

  /**
   * Ottiene piante native con filtri
   */
  async searchNativePlants(location: LocationData, filters?: {
    rarity?: string;
    bloomingSeason?: string;
    family?: string;
  }): Promise<NativePlantData[]> {
    let plants = await this.getNativePlantsForLocation(location);

    if (filters) {
      if (filters.rarity) {
        plants = plants.filter(plant => plant.rarity === filters.rarity);
      }
      if (filters.bloomingSeason) {
        plants = plants.filter(plant => 
          plant.bloomingSeason.toLowerCase().includes(filters.bloomingSeason!.toLowerCase())
        );
      }
      if (filters.family) {
        plants = plants.filter(plant => 
          plant.family.toLowerCase().includes(filters.family!.toLowerCase())
        );
      }
    }

    return plants;
  }

  /**
   * Formatta informazioni di una pianta per display
   */
  formatPlantInfo(plant: NativePlantData): string {
    const rarityEmoji = {
      'comune': '🌿',
      'non_comune': '🌱',  
      'raro': '🌾',
      'molto_raro': '🌺'
    };

    return `${rarityEmoji[plant.rarity]} **${plant.commonName}** _(${plant.scientificName})_
    
📍 **Habitat:** ${plant.habitat}
🌸 **Fioritura:** ${plant.bloomingSeason}
🔬 **Famiglia:** ${plant.family}
📝 **Descrizione:** ${plant.description}
${plant.uses ? `🔧 **Usi:** ${plant.uses.join(', ')}` : ''}
${plant.conservationStatus ? `⚠️ **Stato:** ${plant.conservationStatus}` : ''}`;
  }

  /**
   * Ottiene informazioni sulla regione attuale
   */
  async getRegionInfo(location: LocationData): Promise<string> {
    const region = this.determineItalianRegion(location.latitude, location.longitude);
    
    const regionInfo = {
      nord: '🏔️ **Alpi e Pre-Alpi** - Clima continentale montano, ricco di conifere e flora alpina.',
      pianura_padana: '🌾 **Pianura Padana** - Ambiente planiziale con boschi ripariali e coltivazioni.',
      centro: '🌳 **Italia Centrale** - Clima mediterraneo-continentale con querceti e macchia.',
      sud: '🌊 **Sud Italia** - Clima mediterraneo caldo con macchia e gariga tipiche.',
      isole: '🏝️ **Isole** - Ambiente insulare mediterraneo con endemismi e adattamenti costieri.'
    };

    return regionInfo[region] || regionInfo['centro'];
  }
}

export default LocationService;