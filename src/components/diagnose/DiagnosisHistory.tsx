import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { FirebaseDiagnosisService, type FirebaseDiagnosisResult } from '@/services/firebaseDiagnosisService';
import { Clock, Leaf, AlertTriangle, CheckCircle, TrendingUp, BarChart3, Users } from 'lucide-react';

export const DiagnosisHistory = () => {
  const { user } = useAuth();
  const [userDiagnoses, setUserDiagnoses] = useState<FirebaseDiagnosisResult[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<FirebaseDiagnosisResult | null>(null);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const [diagnoses, statistics] = await Promise.all([
        FirebaseDiagnosisService.getUserDiagnoses(user.id, 20),
        FirebaseDiagnosisService.getDiagnosisStats()
      ]);
      
      setUserDiagnoses(diagnoses);
      setStats(statistics);
    } catch (error) {
      console.error('Errore caricamento dati:', error);
      toast.error('Errore caricamento cronologia');
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (diagnosisId: string, isAccurate: boolean) => {
    try {
      await FirebaseDiagnosisService.submitFeedback(diagnosisId, isAccurate);
      toast.success('Grazie per il feedback!');
    } catch (error) {
      toast.error('Errore invio feedback');
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const DiagnosisCard = ({ diagnosis }: { diagnosis: FirebaseDiagnosisResult }) => (
    <Card className="mb-4 hover:shadow-md transition-shadow cursor-pointer" 
          onClick={() => setSelectedDiagnosis(diagnosis)}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Leaf className="h-5 w-5 text-green-600" />
              {diagnosis.plantName}
            </CardTitle>
            {diagnosis.scientificName && (
              <CardDescription className="italic">
                {diagnosis.scientificName}
              </CardDescription>
            )}
          </div>
          <div className="text-right">
            <Badge variant={diagnosis.isHealthy ? 'default' : 'destructive'}>
              {diagnosis.isHealthy ? 'Sana' : 'Problemi'}
            </Badge>
            <p className="text-sm text-gray-500 mt-1">
              {formatDate(diagnosis.timestamp)}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            <span className="text-sm">Confidenza: {diagnosis.confidence}%</span>
          </div>
          {!diagnosis.isHealthy && (
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <span className="text-sm">{diagnosis.issues.length} problemi</span>
            </div>
          )}
        </div>
        
        {diagnosis.issues.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {diagnosis.issues.slice(0, 3).map((issue, index) => (
              <Badge 
                key={index} 
                variant="outline"
                className={getSeverityColor(issue.severity)}
              >
                {issue.name}
              </Badge>
            ))}
            {diagnosis.issues.length > 3 && (
              <Badge variant="outline" className="bg-gray-100">
                +{diagnosis.issues.length - 3} altri
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const StatCard = ({ title, value, icon: Icon, description }: {
    title: string;
    value: string | number;
    icon: any;
    description: string;
  }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-gray-500">{description}</p>
          </div>
          <Icon className="h-8 w-8 text-green-600" />
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
        <p className="mt-2 text-gray-500">Caricamento cronologia...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Cronologia Diagnosi</h1>
        <p className="text-gray-600">Rivedi le tue diagnosi precedenti e le statistiche generali</p>
      </div>

      <Tabs defaultValue="history" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="history">Le Mie Diagnosi</TabsTrigger>
          <TabsTrigger value="stats">Statistiche</TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="space-y-4">
          {userDiagnoses.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Leaf className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nessuna diagnosi precedente
                </h3>
                <p className="text-gray-500">
                  Inizia a diagnosticare le tue piante per vedere la cronologia qui
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Diagnosi Recenti</h3>
                <ScrollArea className="h-96">
                  {userDiagnoses.map((diagnosis) => (
                    <DiagnosisCard key={diagnosis.id} diagnosis={diagnosis} />
                  ))}
                </ScrollArea>
              </div>

              {selectedDiagnosis && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Dettagli Diagnosi</h3>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Leaf className="h-5 w-5 text-green-600" />
                        {selectedDiagnosis.plantName}
                      </CardTitle>
                      {selectedDiagnosis.scientificName && (
                        <CardDescription className="italic">
                          {selectedDiagnosis.scientificName}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-500">
                          Analizzata il {formatDate(selectedDiagnosis.timestamp)}
                        </p>
                        <p className="text-sm text-gray-500">
                          Fonte: {selectedDiagnosis.analysisSource}
                        </p>
                      </div>

                      <Separator />

                      <div>
                        <h4 className="font-semibold mb-2">Stato di Salute</h4>
                        <div className="flex items-center gap-2">
                          {selectedDiagnosis.isHealthy ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <AlertTriangle className="h-5 w-5 text-orange-600" />
                          )}
                          <span>
                            {selectedDiagnosis.isHealthy ? 'Pianta sana' : 'Problemi rilevati'}
                          </span>
                        </div>
                      </div>

                      {selectedDiagnosis.issues.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-2">Problemi Identificati</h4>
                          <div className="space-y-2">
                            {selectedDiagnosis.issues.map((issue, index) => (
                              <div key={index} className="p-3 border rounded-lg">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-medium">{issue.name}</span>
                                  <Badge className={getSeverityColor(issue.severity)}>
                                    {issue.severity}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">
                                  {issue.description}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Confidenza: {issue.confidence}%
                                </p>
                                {issue.treatment.length > 0 && (
                                  <div className="mt-2">
                                    <p className="text-sm font-medium">Trattamento:</p>
                                    <ul className="text-sm text-gray-600 list-disc list-inside">
                                      {issue.treatment.slice(0, 3).map((treatment, i) => (
                                        <li key={i}>{treatment}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <Separator />

                      <div>
                        <h4 className="font-semibold mb-2">Feedback</h4>
                        <p className="text-sm text-gray-600 mb-3">
                          La diagnosi è stata accurata?
                        </p>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => handleFeedback(selectedDiagnosis.id!, true)}
                          >
                            ✅ Sì
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleFeedback(selectedDiagnosis.id!, false)}
                          >
                            ❌ No
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="stats" className="space-y-6">
          {stats && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                  title="Diagnosi Totali"
                  value={stats.totalDiagnoses}
                  icon={BarChart3}
                  description="Nel database"
                />
                <StatCard
                  title="Confidenza Media"
                  value={`${stats.averageConfidence}%`}
                  icon={TrendingUp}
                  description="Accuratezza del sistema"
                />
                <StatCard
                  title="Piante Diverse"
                  value={stats.topPlants.length}
                  icon={Users}
                  description="Specie identificate"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Piante Più Diagnosticate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {stats.topPlants.slice(0, 10).map((plant: string, index: number) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm">{plant}</span>
                          <Badge variant="outline">{index + 1}°</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Problemi Più Comuni</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {stats.commonIssues.slice(0, 10).map((issue: string, index: number) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm">{issue}</span>
                          <Badge variant="outline">{index + 1}°</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};