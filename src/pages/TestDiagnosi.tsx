import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePlantAnalysis } from '@/hooks/usePlantAnalysis';
import { toast } from 'sonner';

interface TestCase {
  id: string;
  label: string;
  url: string;
}

const sampleTests: TestCase[] = [
  {
    id: 'user-sample',
    label: 'Foglia con sintomi (immagine utente)',
    url: '/lovable-uploads/825263a1-b385-43d6-a65e-56f21490c860.png',
  },
];

export default function TestDiagnosi() {
  const tests = useMemo(() => sampleTests, []);
  const { analyzeUploadedImage, isAnalyzing, diagnosisResult, diagnosedDisease } = usePlantAnalysis();
  const [results, setResults] = useState<Record<string, { text?: string | null; disease?: any }>>({});
  const [runningId, setRunningId] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Test diagnosi piante | EPPO + AI';
  }, []);

  const runOne = async (t: TestCase) => {
    try {
      setRunningId(t.id);
      const res = await fetch(t.url, { cache: 'no-store' });
      const blob = await res.blob();
      const file = new File([blob], `${t.id}.jpg`, { type: blob.type || 'image/jpeg' });
      await analyzeUploadedImage(file);
      // Piccolo delay per assicurarsi che lo stato sia aggiornato
      await new Promise((r) => setTimeout(r, 50));
      setResults((prev) => ({
        ...prev,
        [t.id]: { text: diagnosisResult, disease: diagnosedDisease },
      }));
      toast.success(`Analisi completata: ${t.label}`);
    } catch (e: any) {
      toast.error(`Errore nel test: ${t.label}`, { description: e?.message });
    } finally {
      setRunningId(null);
    }
  };

  const runAll = async () => {
    for (const t of tests) {
      // Esegui in sequenza per riutilizzare lo stesso hook in sicurezza
      // eslint-disable-next-line no-await-in-loop
      await runOne(t);
    }
  };

  return (
    <main className="container mx-auto px-4 py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Test diagnosi piante (EPPO + AI)</h1>
        <p className="text-muted-foreground">Esegui i casi di test su immagini note per verificare nome pianta e malattia.</p>
      </header>

      <div className="flex gap-3 mb-5">
        <Button onClick={runAll} disabled={isAnalyzing || !!runningId}>
          {isAnalyzing || runningId ? 'In esecuzione…' : 'Analizza tutti'}
        </Button>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tests.map((t) => {
          const r = results[t.id];
          const unhealthy = r?.disease ? r.disease.healthy === false : undefined;
          return (
            <Card key={t.id} className="overflow-hidden">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="font-medium">{t.label}</h2>
                  {unhealthy !== undefined && (
                    <Badge variant={unhealthy ? 'destructive' : 'secondary'}>
                      {unhealthy ? 'Non sana' : 'Sana'}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <img
                  src={t.url}
                  alt={`Immagine test: ${t.label}`}
                  loading="lazy"
                  className="w-full h-48 object-cover rounded-md"
                />
                <div className="mt-3 space-y-2">
                  <Button size="sm" onClick={() => runOne(t)} disabled={isAnalyzing || runningId === t.id}>
                    {runningId === t.id ? 'Analisi in corso…' : 'Analizza'}
                  </Button>
                  {r?.text && (
                    <pre className="whitespace-pre-wrap text-sm bg-muted p-3 rounded-md">
                      {r.text}
                    </pre>
                  )}
                  {r?.disease && (
                    <div className="text-sm">
                      <div>
                        Malattia più probabile: <strong>{r.disease.name}</strong>
                        {typeof r.disease.confidence === 'number' ? ` (${r.disease.confidence}%)` : ''}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <link rel="canonical" href="/test-diagnosi" />
      <meta name="description" content="Test diagnosi piante con EPPO e AI: verifica automatica nome pianta e malattie." />
    </main>
  );
}
