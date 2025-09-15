import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';

interface APIStatus {
  openai: boolean;
  plantid: boolean;
  eppo: boolean;
  plantnet: boolean;
  summary: {
    total: number;
    configured: number;
    missing: string[];
  };
}

interface SystemHealth {
  apiKeys: APIStatus | null;
  secrets: any;
  dbConnection: boolean;
  securityIssues: number;
}

export const SystemHealthChecker = () => {
  const [health, setHealth] = useState<SystemHealth>({
    apiKeys: null,
    secrets: null,
    dbConnection: false,
    securityIssues: 5
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const checkSystemHealth = async () => {
    setLoading(true);
    try {
      // Test DB connection
      const { error: dbError } = await supabase.from('profiles').select('id').limit(1);
      const dbConnection = !dbError;

      // Test API Keys via edge function
      const { data: apiStatus, error: apiError } = await supabase.functions.invoke('check-api-status');
      
      // Test Secrets via edge function  
      const { data: secretsStatus, error: secretsError } = await supabase.functions.invoke('test-secrets');

      setHealth({
        apiKeys: apiError ? null : apiStatus,
        secrets: secretsError ? null : secretsStatus,
        dbConnection,
        securityIssues: 5
      });

      if (dbConnection && !apiError && !secretsError) {
        toast({
          title: "✅ Sistema OK",
          description: "Tutti i servizi principali funzionano correttamente"
        });
      } else {
        toast({
          title: "⚠️ Problemi rilevati", 
          description: "Alcuni servizi necessitano attenzione",
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('❌ Errore controllo sistema:', error);
      toast({
        title: "Errore controllo sistema",
        description: error instanceof Error ? error.message : "Errore sconosciuto",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const StatusIcon = ({ status }: { status: boolean | null }) => {
    if (status === null) return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    return status ? 
      <CheckCircle className="h-4 w-4 text-green-500" /> : 
      <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getBadgeVariant = (status: boolean | null) => {
    if (status === null) return "secondary";
    return status ? "default" : "destructive";
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          System Health Dashboard
          <Button 
            variant="outline" 
            size="sm" 
            onClick={checkSystemHealth}
            disabled={loading}
          >
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Controlla
          </Button>
        </CardTitle>
        <CardDescription>
          Stato di tutti gli endpoint, API key e configurazioni di sistema
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Database Connection */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Database Connection</h3>
          <div className="flex items-center gap-2">
            <StatusIcon status={health.dbConnection} />
            <Badge variant={getBadgeVariant(health.dbConnection)}>
              {health.dbConnection ? 'Connesso' : 'Disconnesso'}
            </Badge>
          </div>
        </div>

        <Separator />

        {/* API Keys Status */}
        <div>
          <h3 className="text-lg font-semibold mb-3">API Keys Status</h3>
          {health.apiKeys ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <StatusIcon status={health.apiKeys.openai} />
                <span className="text-sm">OpenAI</span>
                <Badge variant={getBadgeVariant(health.apiKeys.openai)}>
                  {health.apiKeys.openai ? 'OK' : 'Missing'}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <StatusIcon status={health.apiKeys.plantid} />
                <span className="text-sm">Plant.ID</span>
                <Badge variant={getBadgeVariant(health.apiKeys.plantid)}>
                  {health.apiKeys.plantid ? 'OK' : 'Missing'}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <StatusIcon status={health.apiKeys.eppo} />
                <span className="text-sm">EPPO</span>
                <Badge variant={getBadgeVariant(health.apiKeys.eppo)}>
                  {health.apiKeys.eppo ? 'OK' : 'Missing'}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <StatusIcon status={health.apiKeys.plantnet} />
                <span className="text-sm">PlantNet</span>
                <Badge variant={getBadgeVariant(health.apiKeys.plantnet)}>
                  {health.apiKeys.plantnet ? 'OK' : 'Missing'}
                </Badge>
              </div>
            </div>
          ) : (
            <Badge variant="secondary">Non testato</Badge>
          )}
          
          {health.apiKeys?.summary && (
            <div className="mt-3 p-3 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-600">
                API configurate: {health.apiKeys.summary.configured}/{health.apiKeys.summary.total}
              </p>
              {health.apiKeys.summary.missing.length > 0 && (
                <p className="text-sm text-red-600 mt-1">
                  Mancanti: {health.apiKeys.summary.missing.join(', ')}
                </p>
              )}
            </div>
          )}
        </div>

        <Separator />

        {/* Security Issues */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Security Status</h3>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <Badge variant="secondary">
              {health.securityIssues} problemi di sicurezza rilevati
            </Badge>
          </div>
          <div className="mt-3 p-3 bg-yellow-50 rounded-md">
            <p className="text-sm text-yellow-800">
              Problemi rilevati: OTP expiry, password protection, versione Postgres, tabelle pubbliche
            </p>
          </div>
        </div>

        <Separator />

        {/* Secrets Status */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Secrets Configuration</h3>
          {health.secrets ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <StatusIcon status={health.secrets.secrets?.openai} />
                <span className="text-sm">OpenAI Secret</span>
                <Badge variant={getBadgeVariant(health.secrets.secrets?.openai)}>
                  {health.secrets.secrets?.openai ? 'OK' : 'Missing'}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <StatusIcon status={health.secrets.secrets?.plantId} />
                <span className="text-sm">Plant.ID Secret</span>
                <Badge variant={getBadgeVariant(health.secrets.secrets?.plantId)}>
                  {health.secrets.secrets?.plantId ? 'OK' : 'Missing'}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <StatusIcon status={health.secrets.secrets?.eppo} />
                <span className="text-sm">EPPO Secret</span>
                <Badge variant={getBadgeVariant(health.secrets.secrets?.eppo)}>
                  {health.secrets.secrets?.eppo ? 'OK' : 'Missing'}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <StatusIcon status={health.secrets.secrets?.plantNet} />
                <span className="text-sm">PlantNet Secret</span>
                <Badge variant={getBadgeVariant(health.secrets.secrets?.plantNet)}>
                  {health.secrets.secrets?.plantNet ? 'OK' : 'Missing'}
                </Badge>
              </div>
            </div>
          ) : (
            <Badge variant="secondary">Non testato</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};