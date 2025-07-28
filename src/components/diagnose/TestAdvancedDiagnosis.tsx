import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Brain, Leaf, CheckCircle, AlertTriangle, Settings, Microscope } from 'lucide-react';

interface TestResult {
  plantIdentification: {
    name: string;
    scientificName: string;
    family: string;
    confidence: number;
  };
  healthAnalysis: {
    isHealthy: boolean;
    overallScore: number;
    issues: Array<{
      name: string;
      type: string;
      severity: string;
      confidence: number;
      description: string;
    }>;
  };
  recommendations: {
    immediate: string[];
    longTerm: string[];
  };
  careInstructions: {
    watering: string;
    light: string;
    temperature: string;
    fertilization: string;
  };
}

const TestAdvancedDiagnosis: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const testDiagnosis = async () => {
    setIsLoading(true);
    setError(null);
    setTestResult(null);

    try {
      // Test con un'immagine di esempio (puoi sostituire con una vera immagine base64)
      const testImageBase64 = "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="; 
      
      console.log('🧪 Test diagnosi avanzata avviato...');
      
      const response = await supabase.functions.invoke('advanced-plant-diagnosis', {
        body: { 
          imageBase64: testImageBase64,
          plantInfo: {
            symptoms: "Test per verifica funzionamento",
            plantName: "Test Plant",
            isIndoor: true
          }
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Test fallito');
      }

      setTestResult(response.data.diagnosis);
      toast.success('Test diagnosi avanzata completato!');
      
    } catch (err: any) {
      console.error('❌ Errore test:', err);
      setError(err.message || 'Errore durante il test');
      toast.error('Test fallito', {
        description: err.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Microscope className="h-5 w-5" />
          Test Diagnosi Avanzata AI
        </CardTitle>
        <CardDescription>
          Testa il nuovo sistema di diagnosi avanzata con GPT-4o Vision per identificazione piante e problemi specifici
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="flex gap-4">
          <Button 
            onClick={testDiagnosis} 
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <Brain className="h-4 w-4" />
            {isLoading ? 'Test in corso...' : 'Avvia Test Diagnosi'}
          </Button>
        </div>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">Errore Test</span>
              </div>
              <p className="text-red-600 mt-2">{error}</p>
            </CardContent>
          </Card>
        )}

        {testResult && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-semibold">Test Completato!</h3>
            </div>

            {/* Identificazione Pianta */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Leaf className="h-4 w-4" />
                  Identificazione Pianta
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="font-medium">Nome: {testResult.plantIdentification.name}</p>
                    <p className="text-sm text-gray-600">Scientifico: {testResult.plantIdentification.scientificName}</p>
                    <p className="text-sm text-gray-600">Famiglia: {testResult.plantIdentification.family}</p>
                  </div>
                  <div>
                    <Badge variant="secondary">
                      Confidenza: {Math.round(testResult.plantIdentification.confidence * 100)}%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Analisi Salute */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Analisi Salute
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Stato Generale:</span>
                    <Badge variant={testResult.healthAnalysis.isHealthy ? "default" : "destructive"}>
                      {testResult.healthAnalysis.isHealthy ? 'Sana' : 'Problemi Rilevati'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Punteggio Salute:</span>
                    <Badge variant="secondary">
                      {Math.round(testResult.healthAnalysis.overallScore * 100)}%
                    </Badge>
                  </div>
                </div>

                {testResult.healthAnalysis.issues.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Problemi Rilevati:</h4>
                    <div className="space-y-2">
                      {testResult.healthAnalysis.issues.map((issue, index) => (
                        <div key={index} className="border rounded p-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium">{issue.name}</span>
                            <div className="flex gap-2">
                              <Badge variant="outline">{issue.type}</Badge>
                              <Badge variant={issue.severity === 'high' ? 'destructive' : issue.severity === 'medium' ? 'secondary' : 'default'}>
                                {issue.severity}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600">{issue.description}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Confidenza: {Math.round(issue.confidence * 100)}%
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Raccomandazioni */}
            <Card>
              <CardHeader>
                <CardTitle>Raccomandazioni</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Immediate:</h4>
                    <ul className="text-sm space-y-1">
                      {testResult.recommendations.immediate.map((rec, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-orange-500">•</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Lungo Termine:</h4>
                    <ul className="text-sm space-y-1">
                      {testResult.recommendations.longTerm.map((rec, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-blue-500">•</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Istruzioni Cura */}
            <Card>
              <CardHeader>
                <CardTitle>Istruzioni di Cura</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm"><strong>💧 Irrigazione:</strong> {testResult.careInstructions.watering}</p>
                  </div>
                  <div>
                    <p className="text-sm"><strong>☀️ Luce:</strong> {testResult.careInstructions.light}</p>
                  </div>
                  <div>
                    <p className="text-sm"><strong>🌡️ Temperatura:</strong> {testResult.careInstructions.temperature}</p>
                  </div>
                  <div>
                    <p className="text-sm"><strong>🌿 Fertilizzazione:</strong> {testResult.careInstructions.fertilization}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TestAdvancedDiagnosis;