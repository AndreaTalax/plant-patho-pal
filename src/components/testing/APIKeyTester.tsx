import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface APITestResult {
  plantId: { status: string; error?: string };
  plantNet: { status: string; error?: string };
  eppo: { status: string; error?: string };
}

const APIKeyTester = () => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<APITestResult | null>(null);

  const testAPIKeys = async () => {
    setTesting(true);
    setResults(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('test-api-keys');
      
      if (error) {
        console.error('Test API Keys error:', error);
        return;
      }
      
      setResults(data);
      console.log('API Test Results:', data);
    } catch (err) {
      console.error('Failed to test API keys:', err);
    } finally {
      setTesting(false);
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
    const colors = {
      working: 'bg-green-100 text-green-800',
      error: 'bg-red-100 text-red-800',
      expired: 'bg-red-100 text-red-800',
      missing_key: 'bg-yellow-100 text-yellow-800',
      unknown: 'bg-gray-100 text-gray-800'
    };
    
    return (
      <Badge className={colors[status as keyof typeof colors] || colors.unknown}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔑 Test API Keys
          {testing && <Loader2 className="h-4 w-4 animate-spin" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={testAPIKeys} 
          disabled={testing}
          className="w-full"
        >
          {testing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Testing...
            </>
          ) : (
            'Test All API Keys'
          )}
        </Button>

        {results && (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                {getStatusIcon(results.plantId.status)}
                <span className="font-medium">Plant.ID API</span>
              </div>
              <div className="flex flex-col items-end gap-1">
                {getStatusBadge(results.plantId.status)}
                {results.plantId.error && (
                  <span className="text-xs text-red-600 max-w-xs text-right">
                    {results.plantId.error}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                {getStatusIcon(results.plantNet.status)}
                <span className="font-medium">PlantNet API</span>
              </div>
              <div className="flex flex-col items-end gap-1">
                {getStatusBadge(results.plantNet.status)}
                {results.plantNet.error && (
                  <span className="text-xs text-red-600 max-w-xs text-right">
                    {results.plantNet.error}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                {getStatusIcon(results.eppo.status)}
                <span className="font-medium">EPPO API</span>
              </div>
              <div className="flex flex-col items-end gap-1">
                {getStatusBadge(results.eppo.status)}
                {results.eppo.error && (
                  <span className="text-xs text-red-600 max-w-xs text-right">
                    {results.eppo.error}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default APIKeyTester;