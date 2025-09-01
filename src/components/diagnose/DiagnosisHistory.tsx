
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { Clock, Leaf, AlertTriangle, CheckCircle, TrendingUp, BarChart3, Users } from 'lucide-react';

export const DiagnosisHistory = () => {
  const { userProfile } = useAuth();
  const [diagnoses, setDiagnoses] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (userProfile) {
      loadDiagnosisHistory();
    }
  }, [userProfile]);

  const loadDiagnosisHistory = async () => {
    if (!userProfile) return;
    
    setIsLoading(true);
    try {
      console.log('🔄 Caricamento cronologia diagnosi per utente:', userProfile.id);
      
      // Load diagnosis history from Supabase
      const { data: diagnosesData, error } = await supabase
        .from('diagnoses')
        .select('*')
        .eq('user_id', userProfile.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('❌ Errore nel caricamento diagnosi:', error);
        throw error;
      }
      
      console.log('✅ Diagnosi caricate:', diagnosesData?.length || 0);
      setDiagnoses(diagnosesData || []);
      
      // Calculate basic statistics
      if (diagnosesData && diagnosesData.length > 0) {
        const stats = {
          totalDiagnoses: diagnosesData.length,
          topPlants: [],
          commonIssues: [],
          averageConfidence: 0
        };
        setStatistics(stats);
      }
    } catch (error) {
      console.error('Error loading diagnosis history:', error);
      toast.error('Errore nel caricamento della cronologia');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedback = async (diagnosisId: string, isAccurate: boolean) => {
    try {
      toast.success('Grazie per il feedback!');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Errore nell\'invio del feedback');
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('it-IT', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Data non valida';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <Skeleton className="w-16 h-16 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-64" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!userProfile) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Devi essere autenticato per visualizzare la cronologia delle diagnosi.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Cronologia Diagnosi</h2>
        <Button onClick={loadDiagnosisHistory} variant="outline" size="sm">
          Aggiorna
        </Button>
      </div>

      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium">Totale Diagnosi</span>
              </div>
              <p className="text-2xl font-bold mt-2">{statistics.totalDiagnoses}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="space-y-4">
        {diagnoses.length === 0 ? (
          <Alert>
            <Leaf className="h-4 w-4" />
            <AlertDescription>
              Non hai ancora eseguito nessuna diagnosi. Inizia caricando una foto di una pianta!
            </AlertDescription>
          </Alert>
        ) : (
          <div>
            {diagnoses.map((diagnosis) => (
              <Card key={diagnosis.id} className="mb-4">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {diagnosis.image_url && (
                      <img 
                        src={diagnosis.image_url} 
                        alt={diagnosis.plant_type || 'Pianta'}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{diagnosis.plant_type || 'Pianta sconosciuta'}</h3>
                        {diagnosis.diagnosis_result?.isHealthy ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-orange-600" />
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatDate(diagnosis.created_at)}
                        </span>
                        {diagnosis.diagnosis_result?.confidence && (
                          <span>Confidenza: {Math.round(diagnosis.diagnosis_result.confidence)}%</span>
                        )}
                      </div>
                      
                      {diagnosis.diagnosis_result?.description && (
                        <div className="mb-3">
                          <p className="text-sm">{diagnosis.diagnosis_result.description}</p>
                        </div>
                      )}
                      
                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleFeedback(diagnosis.id, true)}
                        >
                          👍 Accurata
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleFeedback(diagnosis.id, false)}
                        >
                          👎 Non accurata
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
