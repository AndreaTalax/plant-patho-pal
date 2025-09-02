import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Leaf, Calendar, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';
import LocationService, { LocationData, NativePlantData } from '@/services/locationService';
import { triggerHaptic } from '@/utils/hapticFeedback';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface NativePlantsPanelProps {
  className?: string;
}

export const NativePlantsPanel: React.FC<NativePlantsPanelProps> = ({ className }) => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [nativePlants, setNativePlants] = useState<NativePlantData[]>([]);
  const [filteredPlants, setFilteredPlants] = useState<NativePlantData[]>([]);
  const [regionInfo, setRegionInfo] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [rarityFilter, setRarityFilter] = useState<string>('all');
  const [selectedPlant, setSelectedPlant] = useState<NativePlantData | null>(null);

  const locationService = LocationService.getInstance();

  useEffect(() => {
    loadLocationAndPlants();
  }, []);

  useEffect(() => {
    filterPlants();
  }, [nativePlants, searchTerm, rarityFilter]);

  const loadLocationAndPlants = async () => {
    setLoading(true);
    try {
      // Feedback tattile per iniziare la ricerca
      triggerHaptic('medium');
      
      const currentLocation = await locationService.getCurrentPosition();
      setLocation(currentLocation);

      const [plants, info] = await Promise.all([
        locationService.getNativePlantsForLocation(currentLocation),
        locationService.getRegionInfo(currentLocation)
      ]);

      setNativePlants(plants);
      setRegionInfo(info);
      
      toast.success(`🌿 Trovate ${plants.length} piante native nella tua zona`);
      triggerHaptic('success');
    } catch (error) {
      console.error('❌ Errore caricamento piante native:', error);
      toast.error('Impossibile ottenere la posizione per le piante native');
      triggerHaptic('error');
    } finally {
      setLoading(false);
    }
  };

  const filterPlants = () => {
    let filtered = nativePlants;

    if (searchTerm) {
      filtered = filtered.filter(plant => 
        plant.commonName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plant.scientificName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plant.family.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (rarityFilter !== 'all') {
      filtered = filtered.filter(plant => plant.rarity === rarityFilter);
    }

    setFilteredPlants(filtered);
  };

  const getRarityColor = (rarity: string) => {
    const colors = {
      'comune': 'bg-green-100 text-green-800',
      'non_comune': 'bg-yellow-100 text-yellow-800',
      'raro': 'bg-orange-100 text-orange-800',
      'molto_raro': 'bg-red-100 text-red-800'
    };
    return colors[rarity as keyof typeof colors] || colors.comune;
  };

  const getRarityEmoji = (rarity: string) => {
    const emojis = {
      'comune': '🌿',
      'non_comune': '🌱',
      'raro': '🌾',
      'molto_raro': '🌺'
    };
    return emojis[rarity as keyof typeof emojis] || '🌿';
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <div className="animate-pulse flex flex-col items-center gap-3">
            <MapPin className="h-8 w-8 text-muted-foreground" />
            <p>Ottenendo la tua posizione...</p>
            <p className="text-sm text-muted-foreground">
              Ricerca piante native della zona in corso
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      {/* Header con info regione */}
      {regionInfo && (
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-5 w-5 text-primary" />
              <span className="font-medium">La tua zona biogeografica</span>
            </div>
            <p className="text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: regionInfo }} />
          </CardContent>
        </Card>
      )}

      {/* Filtri e ricerca */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Cerca piante per nome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={rarityFilter} onValueChange={setRarityFilter}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Rarità" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutte</SelectItem>
                  <SelectItem value="comune">🌿 Comune</SelectItem>
                  <SelectItem value="non_comune">🌱 Non comune</SelectItem>
                  <SelectItem value="raro">🌾 Raro</SelectItem>
                  <SelectItem value="molto_raro">🌺 Molto raro</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={loadLocationAndPlants}
                className="whitespace-nowrap"
              >
                <MapPin className="h-4 w-4 mr-2" />
                Ricarica
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista piante */}
      <div className="grid gap-4">
        {filteredPlants.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Leaf className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                {nativePlants.length === 0 
                  ? 'Nessuna pianta nativa trovata per la tua zona'
                  : 'Nessuna pianta corrisponde ai filtri selezionati'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredPlants.map((plant, index) => (
            <Card 
              key={index} 
              className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                selectedPlant === plant ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => {
                triggerHaptic('light');
                setSelectedPlant(selectedPlant === plant ? null : plant);
              }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <span>{getRarityEmoji(plant.rarity)}</span>
                      {plant.commonName}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground italic">
                      {plant.scientificName}
                    </p>
                  </div>
                  <Badge className={getRarityColor(plant.rarity)}>
                    {plant.rarity.replace('_', ' ')}
                  </Badge>
                </div>
              </CardHeader>
              
              {selectedPlant === plant && (
                <CardContent className="pt-0 animate-fade-in">
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="font-medium">🏞️ Habitat:</span>
                      <p className="text-muted-foreground mt-1">{plant.habitat}</p>
                    </div>
                    
                    <div>
                      <span className="font-medium">🌸 Fioritura:</span>
                      <p className="text-muted-foreground mt-1">{plant.bloomingSeason}</p>
                    </div>
                    
                    <div>
                      <span className="font-medium">🔬 Famiglia:</span>
                      <p className="text-muted-foreground mt-1">{plant.family}</p>
                    </div>
                    
                    <div>
                      <span className="font-medium">📝 Descrizione:</span>
                      <p className="text-muted-foreground mt-1">{plant.description}</p>
                    </div>
                    
                    {plant.uses && plant.uses.length > 0 && (
                      <div>
                        <span className="font-medium">🔧 Usi:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {plant.uses.map((use, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {use}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {plant.conservationStatus && (
                      <div>
                        <span className="font-medium">⚠️ Stato di conservazione:</span>
                        <Badge variant="destructive" className="ml-2">
                          {plant.conservationStatus}
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Footer info */}
      {location && (
        <Card className="mt-4">
          <CardContent className="p-3 bg-muted/30">
            <p className="text-xs text-muted-foreground text-center">
              📍 Posizione: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
              {location.accuracy && ` • Precisione: ±${Math.round(location.accuracy)}m`}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NativePlantsPanel;