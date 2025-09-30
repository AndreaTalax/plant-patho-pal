import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Environment variables per le API
const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
const plantIdApiKey = Deno.env.get('PLANT_ID_API_KEY');
const plantNetApiKey = Deno.env.get('PLANTNET_API_KEY');
const eppoApiKey = Deno.env.get('EPPO_API_KEY');

console.log('🔑 API Keys available:', {
  openai: !!openaiApiKey,
  plantId: !!plantIdApiKey,
  plantNet: !!plantNetApiKey,
  eppo: !!eppoApiKey,
});

interface PlantIdentification {
  name: string;
  scientificName: string;
  confidence: number;
  source: string;
  family?: string;
}

interface DiseaseDetection {
  name: string;
  confidence: number;
  symptoms: string[];
  treatments: string[];
  cause: string;
  source: string;
  severity: 'low' | 'medium' | 'high';
}

interface DiagnosisResult {
  plantIdentification: PlantIdentification[];
  diseases: DiseaseDetection[];
  healthAnalysis: {
    isHealthy: boolean;
    overallScore: number;
    issues: any[];
  };
  recommendations: {
    immediate: string[];
    longTerm: string[];
  };
  analysisDetails: {
    timestamp: string;
    apiServicesUsed: string[];
    totalConfidence: number;
  };
}

// ------------------------
// Helpers per parsing JSON AI
// ------------------------
function safeParseAIResponse(content: string) {
  try { return JSON.parse(content); }
  catch {
    const match = content.match(/{[\s\S]*}/);
    if (match) {
      try { return JSON.parse(match[0]); }
      catch { return null; }
    }
    return null;
  }
}

function sanitizeAnalysis(parsed: any) {
  if (!parsed) return null;
  if (parsed.pianta?.confidenza) {
    parsed.pianta.confidenza = Math.max(0, Math.min(100, parsed.pianta.confidenza));
    if (parsed.pianta.confidenza < 70) parsed.pianta.nomeScientifico = 'UNKNOWN';
  }
  if (Array.isArray(parsed.malattie)) {
    parsed.malattie = parsed.malattie.map((m: any) => {
      m.confidenza = Math.max(0, Math.min(100, m.confidenza || 50));
      if (m.confidenza < 50) {
        m.nome = m.nome || 'Problema non definito';
        m.causa = 'unknown';
      }
      return m;
    });
  }
  return parsed;
}

// ------------------------
// Plant.id + PlantNet
// ------------------------
async function identifyWithPlantId(imageBase64: string): Promise<PlantIdentification[]> {
  if (!plantIdApiKey) return [];
  try {
    const response = await fetch("https://api.plant.id/v2/identify", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Api-Key": plantIdApiKey },
      body: JSON.stringify({
        images: [imageBase64],
        modifiers: ["crops_fast", "similar_images"],
        plant_language: "it",
        plant_details: ["common_names", "taxonomy"]
      }),
      signal: AbortSignal.timeout(15000)
    });
    const data = await response.json();
    return (data.suggestions || []).slice(0, 3).map((s: any) => ({
      name: s.plant_details?.common_names?.[0] || s.plant_name,
      scientificName: s.plant_name,
      confidence: Math.round(s.probability * 100),
      source: 'Plant.id',
      family: s.plant_details?.taxonomy?.family
    }));
  } catch { return []; }
}

async function diagnoseWithPlantIdHealth(imageBase64: string): Promise<DiseaseDetection[]> {
  if (!plantIdApiKey) return [];
  try {
    const response = await fetch("https://api.plant.id/v2/health_assessment", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Api-Key": plantIdApiKey },
      body: JSON.stringify({ images: [imageBase64], language: "it" }),
      signal: AbortSignal.timeout(15000)
    });
    const data = await response.json();
    return (data.health_assessment?.diseases || [])
      .filter((d: any) => d.probability > 0.05)
      .map((d: any) => ({
        name: d.name || 'Problema identificato',
        confidence: Math.round(d.probability * 100),
        symptoms: [d.disease_details?.description || 'Sintomi da immagine'],
        treatments: ['Consultare fitopatologo'],
        cause: d.disease_details?.cause || 'unknown',
        source: 'Plant.id Health',
        severity: d.probability > 0.6 ? 'high' : d.probability > 0.3 ? 'medium' : 'low'
      }));
  } catch { return []; }
}

async function identifyWithPlantNet(imageBase64: string): Promise<PlantIdentification[]> {
  if (!plantNetApiKey) return [];
  try {
    const base64Data = imageBase64.split('base64,')[1];
    const binaryData = atob(base64Data);
    const uint8Array = new Uint8Array(binaryData.length);
    for (let i = 0; i < binaryData.length; i++) uint8Array[i] = binaryData.charCodeAt(i);
    const blob = new Blob([uint8Array], { type: 'image/jpeg' });
    const formData = new FormData();
    formData.append('images', blob, 'plant.jpg');
    formData.append('modifiers', 'crops');
    formData.append('api-key', plantNetApiKey);
    const response = await fetch('https://my-api.plantnet.org/v1/identify/auto', { method: 'POST', body: formData });
    const data = await response.json();
    return (data.results || []).slice(0, 3).map((r: any) => ({
      name: r.species?.scientificNameWithoutAuthor,
      scientificName: r.species?.scientificNameWithoutAuthor,
      confidence: Math.round(r.score * 100),
      source: 'PlantNet',
      family: r.species?.family?.scientificNameWithoutAuthor
    }));
  } catch { return []; }
}

// ------------------------
// OpenAI Vision
// ------------------------
async function analyzeWithOpenAI(imageBase64: string): Promise<{ plants: PlantIdentification[], diseases: DiseaseDetection[] }> {
  if (!openaiApiKey) return { plants: [], diseases: [] };
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${openaiApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: `Sei un esperto fitopatologo. Rispondi SOLO in JSON valido con schema preciso:
{"pianta":{"nomeComune":"","nomeScientifico":"","famiglia":"","confidenza":0},"malattie":[{"nome":"","confidenza":0,"sintomi":[],"trattamenti":[],"causa":"","gravita":"bassa|media|alta","fonte":"OpenAI Vision"}],"salute":{"punteggioGenerale":0,"sana":true,"insufficient_data":false,"note":""}}
Regole: se confidenza<70 usa UNKNOWN. Se immagine insufficiente, insufficient_data:true e malattie:[].` },
          { role: 'user', content: [ { type: 'text', text: 'Analizza questa pianta' }, { type: 'image_url', image_url: { url: imageBase64 } } ] }
        ],
        temperature: 0.0,
        max_tokens: 900
      })
    });
    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    const parsed = sanitizeAnalysis(safeParseAIResponse(content));
    if (!parsed) return { plants: [], diseases: [] };

    const plants: PlantIdentification[] = parsed.pianta ? [{
      name: parsed.pianta.nomeComune,
      scientificName: parsed.pianta.nomeScientifico,
      confidence: parsed.pianta.confidenza,
      source: 'OpenAI Vision',
      family: parsed.pianta.famiglia
    }] : [];

    const diseases: DiseaseDetection[] = (parsed.malattie || []).map((m: any) => ({
      name: m.nome,
      confidence: m.confidenza,
      symptoms: m.sintomi,
      treatments: m.trattamenti,
      cause: m.causa,
      source: 'OpenAI Vision',
      severity: m.gravita === 'alta' ? 'high' : m.gravita === 'media' ? 'medium' : 'low'
    }));

    return { plants, diseases };
  } catch { return { plants: [], diseases: [] }; }
}

// ------------------------
// Recommendations
// ------------------------
function generateRecommendations(plants: PlantIdentification[], diseases: DiseaseDetection[]) {
  const hasIssues = diseases.length > 0;
  const highSeverityIssues = diseases.some(d => d.severity === 'high');
  const immediate = [
    '🔍 Ispeziona attentamente la pianta',
    hasIssues ? '⚠️ Isola la pianta' : '💧 Controlla umidità',
    highSeverityIssues ? '🚨 Contatta un fitopatologo' : '☀️ Verifica luce'
  ];
  const longTerm = [
    '📅 Controlli regolari',
    '🌱 Mantieni condizioni ottimali',
    '🧪 Considera test di laboratorio'
  ];
  return { immediate, longTerm };
}

// ------------------------
// Server handler
// ------------------------
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  const requestId = crypto.randomUUID();
  const start = Date.now();
  try {
    const { imageBase64 } = await req.json();
    if (!imageBase64) return new Response(JSON.stringify({ success:false,error:'No image' }), { status:400, headers: corsHeaders });

    const [plantIdRes, plantIdHealthRes, plantNetRes, openAiRes] = await Promise.all([
      identifyWithPlantId(imageBase64),
      diagnoseWithPlantIdHealth(imageBase64),
      identifyWithPlantNet(imageBase64),
      analyzeWithOpenAI(imageBase64)
    ]);

    const allPlants = [...plantIdRes, ...plantNetRes, ...(openAiRes.plants||[])];
    const allDiseases = [...plantIdHealthRes, ...(openAiRes.diseases||[])];

    const isHealthy = allDiseases.length === 0 || allDiseases.every(d => d.severity === 'low');
    const overallScore = Math.max(20, 100 - (allDiseases.length * 15));
    const issues = allDiseases.map(d => ({ name: d.name, severity: d.severity, confidence: d.confidence }));

    const result: DiagnosisResult = {
      plantIdentification: allPlants.slice(0,5),
      diseases: allDiseases.slice(0,10),
      healthAnalysis: { isHealthy, overallScore, issues },
      recommendations: generateRecommendations(allPlants, allDiseases),
      analysisDetails: { timestamp:new Date().toISOString(), apiServicesUsed:["Plant.id","PlantNet","OpenAI Vision"], totalConfidence: allPlants.length>0? Math.round(allPlants.reduce((a,p)=>a+p.confidence,0)/allPlants.length):0 }
    };

    const processingTime = Date.now()-start;
    return new Response(JSON.stringify({ success:true, diagnosis:result, processingTime:`${processingTime}ms`, requestId }), { headers:{...corsHeaders,'Content-Type':'application/json'} });
  } catch (err:any) {
    return new Response(JSON.stringify({ success:false,error:err.message,requestId }), { status:500, headers: corsHeaders });
  }
});
