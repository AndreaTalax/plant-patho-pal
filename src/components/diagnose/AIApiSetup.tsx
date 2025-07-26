import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Settings, Bot, Leaf, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface APIStatus {
  name: string;
  status: 'configured' | 'missing' | 'checking';
  description: string;
  icon: any;
}

export const AIApiSetup = () => {
  const [apiStatuses, setApiStatuses] = useState<APIStatus[]>([
    {
      name: 'OpenAI GPT Vision',
      status: 'checking',
      description: 'Analisi avanzata delle immagini con AI',
      icon: Bot
    },
    {
      name: 'Plant.ID',
      status: 'checking', 
      description: 'Identificazione botanica specializzata',
      icon: Leaf
    },
    {
      name: 'Database EPPO',
      status: 'checking',
      description: 'Ricerca malattie e parassiti delle piante',
      icon: Search
    }
  ]);

  const checkAPIStatus = async () => {
    try {
      console.log('🔍 Verifica stato API per diagnosi AI...');
      
      const { data, error } = await supabase.functions.invoke('check-api-status', {
        body: {}
      });

      if (error) {
        console.error('❌ Errore verifica API:', error);
        return;
      }

      console.log('✅ Stato API ricevuto:', data);
      
      setApiStatuses(prev => prev.map(api => {
        switch (api.name) {
          case 'OpenAI GPT Vision':
            return { ...api, status: data.openai ? 'configured' : 'missing' };
          case 'Plant.ID':
            return { ...api, status: data.plantid ? 'configured' : 'missing' };
          case 'Database EPPO':
            return { ...api, status: data.eppo ? 'configured' : 'missing' };
          default:
            return api;
        }
      }));

    } catch (error) {
      console.error('❌ Errore controllo API:', error);
      setApiStatuses(prev => prev.map(api => ({ ...api, status: 'missing' })));
    }
  };

  useEffect(() => {
    checkAPIStatus();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'configured':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Configurata</Badge>;
      case 'missing':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Mancante</Badge>;
      case 'checking':
        return <Badge variant="outline">Verifica...</Badge>;
      default:
        return <Badge variant="outline">Sconosciuto</Badge>;
    }
  };

  const allConfigured = apiStatuses.every(api => api.status === 'configured');
  const missingApis = apiStatuses.filter(api => api.status === 'missing');

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Configurazione API per Diagnosi AI
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {apiStatuses.map((api) => {
          const Icon = api.icon;
          return (
            <div key={api.name} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Icon className="h-5 w-5 text-gray-600" />
                <div>
                  <h4 className="font-medium">{api.name}</h4>
                  <p className="text-sm text-gray-600">{api.description}</p>
                </div>
              </div>
              {getStatusBadge(api.status)}
            </div>
          );
        })}

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          {allConfigured ? (
            <div className="text-center">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-medium text-green-800">Tutte le API sono configurate!</h3>
              <p className="text-sm text-green-600">Il sistema di diagnosi AI è pronto per l'uso</p>
            </div>
          ) : (
            <div className="text-center">
              <AlertCircle className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <h3 className="font-medium text-orange-800">Configurazione API necessaria</h3>
              <p className="text-sm text-orange-600 mb-3">
                {missingApis.length} API devono essere configurate per abilitare la diagnosi AI
              </p>
              <Button 
                onClick={checkAPIStatus}
                variant="outline"
                size="sm"
              >
                Ricontrolla Stato
              </Button>
            </div>
          )}
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-medium text-blue-800 mb-2">📋 Come configurare le API:</h4>
          <ol className="text-xs text-blue-700 space-y-1">
            <li>1. Le API key vengono configurate automaticamente negli secrets di Supabase</li>
            <li>2. Il sistema verificherà la disponibilità quando necessario</li>
            <li>3. Se mancano API key, verrai guidato nella configurazione</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};