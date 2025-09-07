import { useState, useEffect } from 'react';
import { Search, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Article {
  id: string;
  title: string;
  text: string;
  excerpt: string;
  category: string;
  tags: string[];
  image_url: string;
  created_at: string;
  content: string; // Added content field
}

/**
 * Get a fallback image URL based on category or title.
 */
const getArticleFallbackImage = (article: Article) => {
  const category = article.category?.toLowerCase() || '';
  const title = article.title?.toLowerCase() || '';

  if (category.includes('fungicidi') || title.includes('neem')) {
    // Fungicide, Neem oil, Powdery Mildew
    return 'https://images.unsplash.com/photo-1585687433492-9c648106f131?q=80&w=400&h=400&auto=format&fit=crop';
  }
  if (category.includes('insetti') || title.includes('insetti') || title.includes('afidi')) {
    // Insect control
    return 'https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?q=80&w=400&h=400&auto=format&fit=crop';
  }
  if (category.includes('nutrienti') || category.includes('vitality') || title.includes('vitality')) {
    // Plant vitality
    return 'https://images.unsplash.com/photo-1625246333195-78d73c0c15b1?q=80&w=400&h=400&auto=format&fit=crop';
  }
  if (category.includes('ph') || title.includes('ph')) {
    // Soil pH Kit
    return 'https://images.unsplash.com/photo-1603912699214-92627f304eb6?q=80&w=400&h=400&auto=format&fit=crop';
  }
  // Default: generic plant book or hand with plant
  return 'https://images.unsplash.com/photo-1464983953574-0892a716854b?q=80&w=400&h=400&auto=format&fit=crop';
};

/**
 * Renders a knowledge library with searchable and filterable article lists and detailed view for individual articles.
 * @example
 * LibraryTab()
 * <div className="flex flex-col pt-6 pb-24">...</div>
 * @param {Object} props - The properties object.
 * @returns {JSX.Element} A React component representing the library tab.
 * @description
 *   - Utilizes Supabase functions to fetch articles and article details.
 *   - Filters articles by category and search term.
 *   - Displays a loading state while articles are being fetched.
 */
// Symptom explanations database
const symptomExplanations = {
  'foglie-gialle': {
    title: 'Foglie Gialle - Ingiallimento Fogliare',
    content: 'L\'ingiallimento delle foglie può indicare: sovra-irrigazione, carenza di azoto, stress idrico, invecchiamento naturale, problemi alle radici o eccesso di luce. Controlla il terreno e regola l\'irrigazione.',
    category: 'Sintomi Foglie',
    image: 'https://images.unsplash.com/photo-1583478615043-16ec8e3734b2?q=80&w=400&h=400&auto=format&fit=crop'
  },
  'foglie-marroni': {
    title: 'Foglie Marroni - Imbrunimento',
    content: 'Le foglie marroni possono essere causate da: scottature solari, carenza d\'acqua, aria troppo secca, danni da freddo, accumulo di sali nel terreno. Sposta la pianta in zona meno esposta.',
    category: 'Sintomi Foglie',
    image: 'https://images.unsplash.com/photo-1578662767947-948d39efdf98?q=80&w=400&h=400&auto=format&fit=crop'
  },
  'foglie-secche': {
    title: 'Foglie Secche e Croccanti',
    content: 'Foglie secche indicano stress idrico grave, aria troppo secca, esposizione eccessiva al sole o vento, danni alle radici. Aumenta umidità e controlla irrigazione.',
    category: 'Sintomi Foglie',
    image: 'https://images.unsplash.com/photo-1582719188393-bb71ca45dbb9?q=80&w=400&h=400&auto=format&fit=crop'
  },
  'macchie-marroni': {
    title: 'Macchie Marroni sulle Foglie',
    content: 'Macchie marroni possono indicare malattie fungine come antracnosi, batteriosi o alternaria. Rimuovi foglie colpite, migliora aerazione e tratta con fungicida se necessario.',
    category: 'Malattie Fungine',
    image: 'https://images.unsplash.com/photo-1587829369692-5add15cf7d1e?q=80&w=400&h=400&auto=format&fit=crop'
  },
  'muffa-bianca': {
    title: 'Muffa Bianca - Oidio',
    content: 'L\'oidio appare come polvere bianca sulle foglie. Causato da alta umidità e scarsa ventilazione. Tratta con fungicidi specifici, migliora aerazione e riduci umidità.',
    category: 'Malattie Fungine',
    image: 'https://images.unsplash.com/photo-1504630083234-14187a9df0f5?q=80&w=400&h=400&auto=format&fit=crop'
  },
  'insetti-visibili': {
    title: 'Insetti e Parassiti Visibili',
    content: 'Presenza di insetti come afidi, cocciniglie, tripidi. Identifica il parassita specifico e tratta con insetticidi appropriati. I rimedi naturali includono sapone molle e olio di neem.',
    category: 'Parassiti',
    image: 'https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?q=80&w=400&h=400&auto=format&fit=crop'
  },
  'ragnatele': {
    title: 'Ragnatele - Ragnetto Rosso',
    content: 'Sottili ragnatele indicano ragnetto rosso, acaro che prospera in ambiente secco. Aumenta umidità, spruzza acqua sulle foglie e usa acaricidi specifici se necessario.',
    category: 'Parassiti',
    image: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?q=80&w=400&h=400&auto=format&fit=crop'
  },
  'stelo-molle': {
    title: 'Stelo Molle e Marcio',
    content: 'Stelo molle indica marciume del colletto causato da eccesso d\'acqua, funghi patogeni o terreno mal drenato. Riduci irrigazione, migliora drenaggio e rimuovi parti marce.',
    category: 'Problemi Strutturali',
    image: 'https://images.unsplash.com/photo-1578320339911-74f22e3e6e98?q=80&w=400&h=400&auto=format&fit=crop'
  },
  'crescita-lenta': {
    title: 'Crescita Lenta e Stentata',
    content: 'Crescita lenta può essere dovuta a carenze nutrizionali, terreno povero, poca luce, radici legate o temperatura inadeguata. Valuta concimazione e condizioni ambientali.',
    category: 'Problemi di Crescita',
    image: 'https://images.unsplash.com/photo-1625246333195-78d73c0c15b1?q=80&w=400&h=400&auto=format&fit=crop'
  },
  'marciume-radici': {
    title: 'Marciume delle Radici',
    content: 'Radici nere, molli e maleodoranti indicano marciume radicale da eccesso d\'acqua. Rinvasa immediatamente, rimuovi radici marce e migliora drenaggio del terreno.',
    category: 'Problemi Radicali',
    image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?q=80&w=400&h=400&auto=format&fit=crop'
  }
};

const LibraryTab = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeArticle, setActiveArticle] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [symptomHelpMode, setSymptomHelpMode] = useState<string | null>(null);

  // Check if user came from symptom help request
  useEffect(() => {
    const symptomRequest = localStorage.getItem('symptomHelpRequest');
    if (symptomRequest) {
      setSymptomHelpMode(symptomRequest);
      localStorage.removeItem('symptomHelpRequest');
      
      // Show the symptom explanation if available
      const explanation = symptomExplanations[symptomRequest as keyof typeof symptomExplanations];
      if (explanation) {
        setSelectedArticle({
          id: `symptom-${symptomRequest}`,
          title: explanation.title,
          content: explanation.content,
          text: explanation.content,
          excerpt: explanation.content.substring(0, 150) + '...',
          category: explanation.category,
          tags: ['sintomi', 'diagnosi'],
          image_url: explanation.image,
          created_at: new Date().toISOString()
        });
      }
    }
  }, []);

  
  
  // Fetch articles
  useEffect(() => {
    fetchArticles();
  }, [activeTab, searchTerm]);

  /**
   * Fetches and updates the list of library articles based on the active tab and search term.
   * @example
   * sync()
   * No direct return value, updates the component's state.
   * @param {void} No parameters are required for this function.
   * @returns {void} This function does not return a value, it updates the state.
   * @description
   *   - Uses Supabase's invoke function to fetch articles from the backend.
   *   - Throws an error if there is a failure in fetching articles.
   *   - Uses the try-catch-finally block to manage loading state and errors.
   *   - Invokes toast notifications to display errors during data fetching.
   */
  const fetchArticles = async () => {
    try {
      setIsLoading(true);
      
      // Use URL parameters for better compatibility with the backend
      const supabaseUrl = 'https://otdmqmpxukifoxjlgzmq.supabase.co';
      const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90ZG1xbXB4dWtpZm94amxnem1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NDQ5ODksImV4cCI6MjA2MjIyMDk4OX0.re4vu-banv0K-hBFNRYZGy5VucPkk141Pa--x-QiGr4';
      
      const params = new URLSearchParams();
      if (activeTab !== 'all') params.append('category', activeTab);
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await fetch(`${supabaseUrl}/functions/v1/get-library-articles?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch articles');
      
      const result = await response.json();
      setArticles(result.articles || []);
      console.log('[LibraryTab] Articles loaded:', result.articles);
    } catch (error) {
      console.error('Error fetching articles:', error);
      toast.error('Failed to load articles');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Fetches and sets the selected article based on the provided article ID.
   * @example
   * sync("12345")
   * // Successfully sets the selected and active article.
   * @param {string} articleId - The unique identifier of the article to fetch.
   * @returns {Promise<void>} Executes asynchronous operations and returns no value.
   * @description
   *   - Invokes the 'get-library-articles' function from Supabase to retrieve article data.
   *   - Sets the 'selected article' state using the retrieved article data.
   *   - Sets the 'active article' state to the provided article ID.
   *   - Displays an error toast notification if the invocation fails.
   */
  const fetchArticleDetails = async (articleId: string) => {
    try {
      // Use URL parameters instead of body for article ID  
      const supabaseUrl = 'https://otdmqmpxukifoxjlgzmq.supabase.co';
      const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90ZG1xbXB4dWtpZm94amxnem1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NDQ5ODksImV4cCI6MjA2MjIyMDk4OX0.re4vu-banv0K-hBFNRYZGy5VucPkk141Pa--x-QiGr4';
      
      const response = await fetch(`${supabaseUrl}/functions/v1/get-library-articles?id=${articleId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch article');
      
      const result = await response.json();
      setSelectedArticle(result.article);
      setActiveArticle(articleId);
      console.log('[LibraryTab] Fetched selectedArticle:', result.article);
    } catch (error) {
      console.error('Error fetching article:', error);
      toast.error('Failed to load article');
      setSelectedArticle(null);
    }
  };

  const categories = Array.from(new Set(articles.map(a => a.category)));
  
  return (
    <div className="flex flex-col pt-6 pb-24">
      {!activeArticle ? (
        <div className="px-4">
          <h2 className="text-2xl font-bold mb-6 text-drplant-green">Knowledge Library</h2>
          
          {/* Search */}
          <div className="mb-6 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input 
              className="pl-10 bg-white"
              placeholder="Search articles..."
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
          
          {/* Articles list */}
          {isLoading ? (
            <div className="text-center py-8">Loading articles...</div>
          ) : (
            <>
              <div className="space-y-3">
                {articles.map(article => (
                  <Card 
                    key={article.id} 
                    className="flex overflow-hidden cursor-pointer hover:bg-gray-50"
                    onClick={() => fetchArticleDetails(article.id)}
                  >
                    <div className="w-24 h-24">
                      <img 
                        src={
                          article.image_url && article.image_url.trim() !== ""
                            ? article.image_url
                            : getArticleFallbackImage(article)
                        } 
                        alt={article.title} 
                        className="h-full w-full object-cover"
                        onError={e => {
                          (e.currentTarget as HTMLImageElement).src = getArticleFallbackImage(article);
                        }}
                      />
                    </div>
                    <div className="flex-1 p-3 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start">
                          <h3 className="font-medium">{article.title}</h3>
                          <Badge className="bg-gray-100 text-gray-800 text-xs">
                            {article.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2 mt-1">{article.excerpt}</p>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <div className="flex gap-1">
                          {article.tags.slice(0, 2).map((tag, i) => (
                            <Badge key={i} variant="outline" className="text-xs bg-gray-50">
                              {tag}
                            </Badge>
                          ))}
                          {article.tags.length > 2 && (
                            <Badge variant="outline" className="text-xs bg-gray-50">
                              +{article.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                        <ChevronRight className="text-gray-400" size={18} />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
              
              {articles.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No articles found matching your search</p>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="flex flex-col h-full">
          {/* DEBUG: Se nessun selectedArticle, mostra placeholder e bottone indietro */}
          {!selectedArticle ? (
            <div className="flex flex-col items-center justify-center h-full p-6">
              <p className="text-center text-gray-500 mb-4">
                Articolo non trovato o errore di caricamento.<br />
                <span className="text-xs">Riprovare oppure tornare indietro.</span>
              </p>
              <Button
                variant="outline"
                onClick={() => setActiveArticle(null)}
              >
                Torna alla libreria
              </Button>
            </div>
          ) : (
            <>
              <div className="relative h-48">
                <img 
                  src={
                    selectedArticle.image_url && selectedArticle.image_url.trim() !== ""
                      ? selectedArticle.image_url
                      : getArticleFallbackImage(selectedArticle)
                  }
                  alt={selectedArticle.title}
                  className="w-full h-full object-cover brightness-90"
                  onError={e => {
                    (e.currentTarget as HTMLImageElement).src = getArticleFallbackImage(selectedArticle);
                  }}
                />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute top-4 left-4 h-8 w-8 rounded-full bg-black/30 text-white hover:bg-black/40"
                  onClick={() => setActiveArticle(null)}
                >
                  <ChevronRight className="rotate-180" />
                </Button>
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-white">
                  <h2 className="text-2xl font-bold">{selectedArticle.title}</h2>
                  <div className="flex gap-2 mt-1">
                    <Badge className="bg-drplant-blue/80">{selectedArticle.category}</Badge>
                  </div>
                </div>
              </div>
              
              {/* Symptom help notification */}
              {symptomHelpMode && (
                <div className="mx-4 mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-800 font-medium">🔍 Informazioni Sintomo</p>
                      <p className="text-blue-600 text-sm">Stai visualizzando la spiegazione di un sintomo dalla diagnosi</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSymptomHelpMode(null);
                        setSelectedArticle(null);
                        window.dispatchEvent(new CustomEvent('switchTab', { detail: 'diagnose' }));
                      }}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      ← Torna alla Diagnosi
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="p-4 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-drplant-green mb-2">Article Content</h3>
                  <div className="prose prose-sm max-w-none text-gray-700">
                    {(selectedArticle.content || selectedArticle.text || '').split('\n').map((paragraph, i) => (
                      <p key={i} className="mb-3">{paragraph}</p>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-drplant-green">Tags</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedArticle.tags && selectedArticle.tags.length > 0 ? (
                      selectedArticle.tags.map((tag, i) => (
                        <Badge key={i} variant="outline">{tag}</Badge>
                      ))
                    ) : (
                      <span className="text-gray-400 text-sm">No tag for this article</span>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default LibraryTab;
