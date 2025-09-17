import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface APITestResult {
  status: 'unknown' | 'working' | 'error' | 'missing_key' | 'expired';
  error?: string | null;
}

interface TestResults {
  plantId: APITestResult;
  plantNet: APITestResult;
  eppo: APITestResult;
}

const APIKeyTester: React.FC = () => {
  const [results, setResults] = useState<TestResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const testAPIKeys = async () => {
    setIsLoading(true);
    try {
      console.log('🔍 Testing API keys...');
      
      const { data, error } = await supabase.functions.invoke('test-api-keys');
      
      if (error) {
        console.error('Error testing API keys:', error);
        toast.error('Errore nel test delle API keys');
        return;
      }
      
      console.log('📊 API test results:', data);
      setResults(data);
      toast.success('Test delle API keys completato');
      
    } catch (error) {
      console.error('Failed to test API keys:', error);
      toast.error('Errore nel test delle API keys');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'working':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
      case 'expired':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'missing_key':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'working':
        return <Badge variant="default" className="bg-green-500">Funzionante</Badge>;
      case 'error':
        return <Badge variant="destructive">Errore</Badge>;
      case 'expired':
        return <Badge variant="destructive">Scaduta</Badge>;
      case 'missing_key':
        return <Badge variant="secondary">Key mancante</Badge>;
      default:
        return <Badge variant="outline">Sconosciuto</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Test API Keys
        </CardTitle>
        <CardDescription>
          Verifica lo stato e la validità delle chiavi API esterne
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button 
            onClick={testAPIKeys} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Testa API Keys
              </>
            )}
          </Button>

          {results && (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  {getStatusIcon(results.plantId.status)}
                  <span className="font-medium">Plant.ID</span>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {getStatusBadge(results.plantId.status)}
                  {results.plantId.error && (
                    <span className="text-xs text-red-600">{results.plantId.error}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  {getStatusIcon(results.plantNet.status)}
                  <span className="font-medium">PlantNet</span>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {getStatusBadge(results.plantNet.status)}
                  {results.plantNet.error && (
                    <span className="text-xs text-red-600">{results.plantNet.error}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  {getStatusIcon(results.eppo.status)}
                  <span className="font-medium">EPPO</span>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {getStatusBadge(results.eppo.status)}
                  {results.eppo.error && (
                    <span className="text-xs text-red-600">{results.eppo.error}</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default APIKeyTester;