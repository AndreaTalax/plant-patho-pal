
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
  content: string;
  excerpt: string;
  category: string;
  tags: string[];
  image_url: string;
  created_at: string;
}

const LibraryTab = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeArticle, setActiveArticle] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Fetch articles
  useEffect(() => {
    fetchArticles();
  }, [activeTab, searchTerm]);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('get-library-articles', {
        body: { 
          category: activeTab === 'all' ? null : activeTab,
          search: searchTerm || null
        }
      });

      if (error) throw error;
      setArticles(data.articles || []);
    } catch (error) {
      console.error('Error fetching articles:', error);
      toast.error('Failed to load articles');
    } finally {
      setLoading(false);
    }
  };

  const fetchArticleDetails = async (articleId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('get-library-articles', {
        body: { id: articleId }
      });

      if (error) throw error;
      setSelectedArticle(data.article);
      setActiveArticle(articleId);
    } catch (error) {
      console.error('Error fetching article:', error);
      toast.error('Failed to load article');
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
          {loading ? (
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
                        src={article.image_url} 
                        alt={article.title} 
                        className="h-full w-full object-cover"
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
          {/* Article detail */}
          {selectedArticle && (
            <>
              <div className="relative h-48">
                <img 
                  src={selectedArticle.image_url} 
                  alt={selectedArticle.title} 
                  className="w-full h-full object-cover brightness-90"
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
              
              <div className="p-4 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-drplant-green mb-2">Article Content</h3>
                  <div className="prose prose-sm max-w-none text-gray-700">
                    {selectedArticle.content.split('\n').map((paragraph, i) => (
                      <p key={i} className="mb-3">{paragraph}</p>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-drplant-green">Tags</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedArticle.tags.map((tag, i) => (
                      <Badge key={i} variant="outline">{tag}</Badge>
                    ))}
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
