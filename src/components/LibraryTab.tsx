
import { useState } from 'react';
import { Search, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Mock disease data
const DISEASES = [
  {
    id: '1',
    name: 'Powdery Mildew',
    category: 'Fungal',
    plants: ['Roses', 'Squash', 'Cucumber'],
    symptoms: 'White powdery spots on leaves and stems',
    image: 'https://images.unsplash.com/photo-1635752094661-39507259008e?q=80&w=400&h=400&auto=format&fit=crop',
    treatments: ['Neem oil', 'Potassium bicarbonate', 'Milk spray'],
    prevention: 'Improve air circulation, avoid overhead watering'
  },
  {
    id: '2',
    name: 'Aphid Infestation',
    category: 'Pest',
    plants: ['Roses', 'Vegetable garden', 'Fruit trees'],
    symptoms: 'Curling leaves, sticky residue, small green or black insects',
    image: 'https://images.unsplash.com/photo-1559563060-e01e3ec4edd2?q=80&w=400&h=400&auto=format&fit=crop',
    treatments: ['Insecticidal soap', 'Neem oil', 'Ladybugs (natural predators)'],
    prevention: 'Regular plant inspection, healthy soil'
  },
  {
    id: '3',
    name: 'Black Spot',
    category: 'Fungal',
    plants: ['Roses', 'Apple trees'],
    symptoms: 'Black spots on leaves, yellowing leaves that fall off',
    image: 'https://images.unsplash.com/photo-1598512199776-e0e1b3957f44?q=80&w=400&h=400&auto=format&fit=crop',
    treatments: ['Fungicidal sprays', 'Baking soda solution'],
    prevention: 'Remove fallen leaves, improve air circulation'
  },
  {
    id: '4',
    name: 'Root Rot',
    category: 'Fungal',
    plants: ['Houseplants', 'Garden vegetables', 'Trees'],
    symptoms: 'Wilting despite watering, brown roots, stunted growth',
    image: 'https://images.unsplash.com/photo-1647472239493-8a193fc4bcb4?q=80&w=400&h=400&auto=format&fit=crop',
    treatments: ['Remove affected parts', 'Fungicide drench'],
    prevention: 'Well-drained soil, avoid overwatering'
  },
  {
    id: '5',
    name: 'Leaf Spot',
    category: 'Bacterial',
    plants: ['Philodendron', 'Pothos', 'Peppers'],
    symptoms: 'Brown or black spots with yellow halos',
    image: 'https://images.unsplash.com/photo-1633114127188-99b4dd741180?q=80&w=400&h=400&auto=format&fit=crop',
    treatments: ['Copper-based bactericides', 'Remove infected leaves'],
    prevention: 'Avoid wetting leaves, sterilize tools'
  }
];

const LibraryTab = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeDisease, setActiveDisease] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  
  const categories = Array.from(new Set(DISEASES.map(d => d.category)));
  
  const filteredDiseases = DISEASES.filter(disease => {
    const matchesSearch = disease.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         disease.symptoms.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeTab === 'all' ? true : disease.category.toLowerCase() === activeTab.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const getSelectedDisease = () => DISEASES.find(d => d.id === activeDisease);
  
  return (
    <div className="flex flex-col pt-6 pb-24">
      {!activeDisease ? (
        <div className="px-4">
          <h2 className="text-2xl font-bold mb-6 text-drplant-green">Disease Library</h2>
          
          {/* Search */}
          <div className="mb-6 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input 
              className="pl-10 bg-white"
              placeholder="Search diseases..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Category tabs */}
          <Tabs defaultValue="all" className="mb-6" value={activeTab} onValueChange={setActiveTab}>
            <ScrollArea className="w-full">
              <div className="flex p-1">
                <TabsList className="flex bg-transparent p-0 h-auto w-auto space-x-2 overflow-visible">
                  <TabsTrigger 
                    value="all"
                    className="h-9 px-4 data-[state=active]:bg-drplant-blue data-[state=active]:text-white"
                  >
                    All
                  </TabsTrigger>
                  {categories.map(category => (
                    <TabsTrigger 
                      key={category}
                      value={category.toLowerCase()}
                      className="h-9 px-4 whitespace-nowrap data-[state=active]:bg-drplant-blue data-[state=active]:text-white"
                    >
                      {category}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
            </ScrollArea>
          </Tabs>
          
          {/* Disease list */}
          <div className="space-y-3">
            {filteredDiseases.map(disease => (
              <Card 
                key={disease.id} 
                className="flex overflow-hidden cursor-pointer hover:bg-gray-50"
                onClick={() => setActiveDisease(disease.id)}
              >
                <div className="w-24 h-24">
                  <img 
                    src={disease.image} 
                    alt={disease.name} 
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex-1 p-3 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium">{disease.name}</h3>
                      <Badge className="bg-gray-100 text-gray-800 text-xs">
                        {disease.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2 mt-1">{disease.symptoms}</p>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <div className="flex gap-1">
                      {disease.plants.slice(0, 2).map((plant, i) => (
                        <Badge key={i} variant="outline" className="text-xs bg-gray-50">
                          {plant}
                        </Badge>
                      ))}
                      {disease.plants.length > 2 && (
                        <Badge variant="outline" className="text-xs bg-gray-50">
                          +{disease.plants.length - 2}
                        </Badge>
                      )}
                    </div>
                    <ChevronRight className="text-gray-400" size={18} />
                  </div>
                </div>
              </Card>
            ))}
            
            {filteredDiseases.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No diseases found matching your search</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-full">
          {/* Disease detail */}
          <div className="relative h-48">
            <img 
              src={getSelectedDisease()?.image} 
              alt={getSelectedDisease()?.name} 
              className="w-full h-full object-cover brightness-90"
            />
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-4 left-4 h-8 w-8 rounded-full bg-black/30 text-white hover:bg-black/40"
              onClick={() => setActiveDisease(null)}
            >
              <ChevronRight className="rotate-180" />
            </Button>
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-white">
              <h2 className="text-2xl font-bold">{getSelectedDisease()?.name}</h2>
              <div className="flex gap-2 mt-1">
                <Badge className="bg-drplant-blue/80">{getSelectedDisease()?.category}</Badge>
              </div>
            </div>
          </div>
          
          <div className="p-4 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-drplant-green">Symptoms</h3>
              <p className="mt-1 text-gray-700">{getSelectedDisease()?.symptoms}</p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-drplant-green">Common in</h3>
              <div className="flex flex-wrap gap-2 mt-2">
                {getSelectedDisease()?.plants.map((plant, i) => (
                  <Badge key={i} variant="outline">{plant}</Badge>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-drplant-green">Treatments</h3>
              <ul className="mt-1 list-disc pl-5 text-gray-700">
                {getSelectedDisease()?.treatments.map((treatment, i) => (
                  <li key={i}>{treatment}</li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-drplant-green">Prevention</h3>
              <p className="mt-1 text-gray-700">{getSelectedDisease()?.prevention}</p>
            </div>
            
            <div className="pt-4">
              <Button className="w-full bg-drplant-blue hover:bg-drplant-blue-dark">
                Shop Recommended Products
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LibraryTab;
