import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Bookmark } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SavedArticle {
  id: string;
  title: string;
  excerpt: string;
  image_url: string;
  category: string;
  created_at: string;
}

const SavedArticles = () => {
  const [savedArticles, setSavedArticles] = useState<SavedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSavedArticles();
  }, []);

  const fetchSavedArticles = async () => {
    try {
      // For now, fetch all articles as saved articles since we don't have a saved articles table yet
      const { data, error } = await supabase
        .from('library_articles')
        .select('*')
        .eq('is_published', true)
        .limit(10);

      if (error) throw error;
      setSavedArticles(data || []);
    } catch (error) {
      console.error('Error fetching saved articles:', error);
      toast.error("Failed to load saved articles");
    } finally {
      setLoading(false);
    }
  };

  const handleArticleClick = (articleId: string) => {
    navigate(`/library/${articleId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Saved Articles</h1>
          </div>
          <div className="text-center py-8">Loading saved articles...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Saved Articles</h1>
        </div>

        {savedArticles.length === 0 ? (
          <div className="text-center py-12">
            <Bookmark className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No saved articles yet</h3>
            <p className="text-muted-foreground mb-4">
              Start saving articles from the library to read them later
            </p>
            <Button onClick={() => navigate('/library')}>
              Browse Library
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {savedArticles.map((article) => (
              <Card key={article.id} className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleArticleClick(article.id)}>
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-4">
                    {article.image_url && (
                      <img 
                        src={article.image_url} 
                        alt={article.title}
                        className="w-16 h-16 object-cover rounded-md flex-shrink-0"
                      />
                    )}
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-1">{article.title}</CardTitle>
                      {article.category && (
                        <span className="text-sm text-primary bg-primary/10 px-2 py-1 rounded">
                          {article.category}
                        </span>
                      )}
                    </div>
                    <Bookmark className="h-5 w-5 text-primary flex-shrink-0" />
                  </div>
                </CardHeader>
                {article.excerpt && (
                  <CardContent className="pt-0">
                    <p className="text-muted-foreground text-sm line-clamp-2">
                      {article.excerpt}
                    </p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedArticles;