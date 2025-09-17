import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Loader2, Key, AlertTriangle, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface APIStatus {
  openai: boolean;
  plantid: boolean;
  eppo: boolean;
  plantnet: boolean;
  firebase: boolean;
  summary: {
    total: number;
    configured: number;
    missing: string[];
  };
}

interface APITestResult {
  status: 'unknown' | 'working' | 'error' | 'missing_key' | 'expired';
  error?: string | null;
}

interface TestResults {
  plantId: APITestResult;
  plantNet: APITestResult;
  eppo: APITestResult;
}

const APIConfigChecker: React.FC = () => {
  const [status, setStatus] = useState<APIStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [testResults, setTestResults] = useState<TestResults | null>(null);
  const [isTestingKeys, setIsTestingKeys] = useState(false);

  const checkAPIStatus = async () => {
    setIsLoading(true);
    try {
      console.log('🔍 Checking API configuration...');
      
      const { data, error } = await supabase.functions.invoke('check-api-status');
      
      if (error) {
        console.error('❌ Error checking API status:', error);
        toast.error('Errore nel controllo API');
        return;
      }

      if (data) {
        setStatus(data);
        setLastChecked(new Date());
        toast.success('Configurazione API verificata');
        console.log('✅ API Status:', data);
      }
    } catch (error) {
      console.error('❌ Error:', error);
      toast.error('Errore nella verifica API');
    } finally {
      setIsLoading(false);
    }
  };

  const testSecrets = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('test-secrets');
      
      if (error) {
        console.error('❌ Error testing secrets:', error);
        toast.error('Errore nel test secrets');
        return;
      }

      console.log('🔐 Secrets test result:', data);
      toast.success('Test secrets completato');
    } catch (error) {
      console.error('❌ Error:', error);
      toast.error('Errore nel test secrets');
    } finally {
      setIsLoading(false);
    }
  };

  const testAPIKeys = async () => {
    setIsTestingKeys(true);
    try {
      console.log('🔍 Testing API keys functionality...');
      
      const { data, error } = await supabase.functions.invoke('test-api-keys');
      
      if (error) {
        console.error('Error testing API keys:', error);
        toast.error('Errore nel test delle API keys');
        return;
      }
      
      console.log('📊 API test results:', data);
      setTestResults(data);
      
      // Check for expired keys
      const hasExpired = Object.values(data).some((result: any) => result.status === 'expired');
      if (hasExpired) {
        toast.error('⚠️ Alcune API keys sono scadute!');
      } else {
        toast.success('Test delle API keys completato');
      }
      
    } catch (error) {
      console.error('Failed to test API keys:', error);
      toast.error('Errore nel test delle API keys');  
    } finally {
      setIsTestingKeys(false);
    }
  };

  useEffect(() => {
    checkAPIStatus();
  }, []);

  const getStatusIcon = (isConfigured: boolean) => {
    if (isConfigured) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    return <XCircle className="h-5 w-5 text-red-500" />;
  };

  const getStatusBadge = (isConfigured: boolean) => {
    if (isConfigured) {
      return <Badge variant="default" className="bg-green-100 text-green-700">Configurato</Badge>;
    }
    return <Badge variant="destructive">Mancante</Badge>;
  };

  const getTestStatusIcon = (status: string) => {
    switch (status) {
      case 'working':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
      case 'expired':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'missing_key':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTestStatusBadge = (status: string) => {
    switch (status) {
      case 'working':
        return <Badge variant="default" className="bg-green-500">✅ Funzionante</Badge>;
      case 'error':
        return <Badge variant="destructive">❌ Errore</Badge>;
      case 'expired':
        return <Badge variant="destructive">⏰ Scaduta</Badge>;
      case 'missing_key':
        return <Badge variant="secondary">🔑 Key mancante</Badge>;
      default:
        return <Badge variant="outline">❓ Sconosciuto</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Configurazione API Esterne
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={checkAPIStatus} 
              disabled={isLoading}
              variant="outline"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Verifica Configurazione
            </Button>
            
            <Button 
              onClick={testSecrets} 
              disabled={isLoading}
              variant="outline"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Key className="h-4 w-4 mr-2" />
              )}
              Test Secrets
            </Button>
            
            <Button 
              onClick={testAPIKeys} 
              disabled={isTestingKeys}
              variant="default"
            >
              {isTestingKeys ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Test Funzionalità API
            </Button>
          </div>

          {lastChecked && (
            <p className="text-sm text-muted-foreground">
              Ultimo controllo: {lastChecked.toLocaleString()}
            </p>
          )}

          {status && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(status.openai)}
                    <span className="font-medium">OpenAI</span>
                  </div>
                  {getStatusBadge(status.openai)}
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(status.plantid)}
                    <span className="font-medium">Plant.ID</span>
                  </div>
                  {getStatusBadge(status.plantid)}
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(status.eppo)}
                    <span className="font-medium">EPPO</span>
                  </div>
                  {getStatusBadge(status.eppo)}
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(status.plantnet)}
                    <span className="font-medium">PlantNet</span>
                  </div>
                  {getStatusBadge(status.plantnet)}
                </div>
              </div>

              <Card className="bg-background">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Riepilogo Configurazione</h3>
                      <p className="text-sm text-muted-foreground">
                        {status.summary.configured} di {status.summary.total} API configurate
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        {Math.round((status.summary.configured / status.summary.total) * 100)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Completezza</div>
                    </div>
                  </div>

                  {status.summary.missing.length > 0 && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <span className="font-medium text-yellow-800">API Mancanti</span>
                      </div>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        {status.summary.missing.map((api) => (
                          <li key={api}>• {api}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {status.summary.configured === status.summary.total && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-green-800">
                          Tutte le API sono configurate correttamente!
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {testResults && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  Test Funzionalità API
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      {getTestStatusIcon(testResults.plantId.status)}
                      <span className="font-medium">Plant.ID</span>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {getTestStatusBadge(testResults.plantId.status)}
                      {testResults.plantId.error && (
                        <span className="text-xs text-red-600">{testResults.plantId.error}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      {getTestStatusIcon(testResults.plantNet.status)}
                      <span className="font-medium">PlantNet</span>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {getTestStatusBadge(testResults.plantNet.status)}
                      {testResults.plantNet.error && (
                        <span className="text-xs text-red-600">{testResults.plantNet.error}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      {getTestStatusIcon(testResults.eppo.status)}
                      <span className="font-medium">EPPO</span>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {getTestStatusBadge(testResults.eppo.status)}
                      {testResults.eppo.error && (
                        <span className="text-xs text-red-600">{testResults.eppo.error}</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default APIConfigChecker;