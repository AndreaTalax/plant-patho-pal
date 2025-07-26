import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Key, AlertTriangle, CheckCircle, Settings } from 'lucide-react';

interface ApiKeyManagerProps {
  missingApis: string[];
  onConfigured: () => void;
}

export const ApiKeyManager = ({ missingApis, onConfigured }: ApiKeyManagerProps) => {
  const [configuring, setConfiguring] = useState<string | null>(null);

  const apiInfo = {
    'OPENAI_API_KEY': {
      name: 'OpenAI GPT Vision',
      description: 'Analisi avanzata delle immagini con AI',
      url: 'https://platform.openai.com/api-keys',
      instructions: [
        'Vai su platform.openai.com',
        'Accedi al tuo account OpenAI',
        'Vai in "API Keys"',
        'Crea una nuova API key',
        'Copia la key generata'
      ]
    },
    'PLANT_ID_API_KEY': {
      name: 'Plant.ID',
      description: 'Identificazione botanica specializzata',
      url: 'https://plant.id/docs',
      instructions: [
        'Vai su plant.id',
        'Crea un account gratuito',
        'Vai nel dashboard',
        'Copia la tua API key'
      ]
    },
    'EPPO_AUTH_TOKEN': {
      name: 'Database EPPO',
      description: 'Ricerca malattie e parassiti delle piante',
      url: 'https://gd.eppo.int/',
      instructions: [
        'Registrati su gd.eppo.int',
        'Richiedi accesso API',
        'Ottieni il token di autenticazione'
      ]
    }
  };

  const handleConfigureApi = async (apiKey: string) => {
    setConfiguring(apiKey);
    
    // In un'app reale, qui implementeresti la raccolta della API key
    // Per ora simula la configurazione
    console.log(`🔑 Configurazione ${apiKey}...`);
    
    // Simula delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setConfiguring(null);
    onConfigured();
  };

  if (missingApis.length === 0) {
    return (
      <Card className="w-full max-w-2xl mx-auto border-green-200">
        <CardContent className="p-6">
          <div className="text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              🎉 Tutte le API sono configurate!
            </h3>
            <p className="text-green-600">
              Il sistema di diagnosi AI è pronto per l'uso con identificazione botanica, 
              analisi delle malattie e ricerca nel database EPPO.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Configurazione API per Diagnosi AI
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Per abilitare la diagnosi AI delle piante, è necessario configurare almeno una delle seguenti API. 
            Più API configurate = analisi più accurate e complete.
          </AlertDescription>
        </Alert>

        <div className="grid gap-4">
          {missingApis.map((apiKey) => {
            const info = apiInfo[apiKey as keyof typeof apiInfo];
            if (!info) return null;

            return (
              <Card key={apiKey} className="border-orange-200">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Key className="h-4 w-4 text-orange-600" />
                        <h4 className="font-semibold">{info.name}</h4>
                        <Badge variant="outline" className="text-orange-600 border-orange-300">
                          Richiesta
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{info.description}</p>
                      
                      <div className="text-xs text-gray-500 mb-3">
                        <h5 className="font-medium mb-1">Come ottenere la API key:</h5>
                        <ol className="list-decimal list-inside space-y-1">
                          {info.instructions.map((step, index) => (
                            <li key={index}>{step}</li>
                          ))}
                        </ol>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(info.url, '_blank')}
                        className="text-xs"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Ottieni API Key
                      </Button>
                      
                      <Button
                        size="sm"
                        onClick={() => handleConfigureApi(apiKey)}
                        disabled={configuring === apiKey}
                        className="text-xs"
                      >
                        {configuring === apiKey ? 'Configurando...' : 'Configura'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-medium text-blue-800 mb-2">💡 Suggerimenti:</h4>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• <strong>OpenAI</strong>: Migliore per analisi generale e descrizioni dettagliate</li>
            <li>• <strong>Plant.ID</strong>: Eccellente per identificazione botanica precisa</li>
            <li>• <strong>EPPO</strong>: Essenziale per ricerca di malattie e parassiti specifici</li>
            <li>• Configura almeno 2 API per risultati più affidabili</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};