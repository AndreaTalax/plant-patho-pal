
import { supabase } from '@/integrations/supabase/client'
import { eppoService } from '@/services/eppo-service'

export interface ConsensusDisease {
  name: string
  probability?: number
  description?: string
  symptoms?: string[]
  treatment?: any
}

export interface ConsensusResult {
  isHealthy: boolean
  diseases: ConsensusDisease[]
  validatedByEPPO: string[]
  sources: string[]
}

function normalizeDiseases(raw: any): ConsensusDisease[] {
  if (!raw) return []

  const candidates: ConsensusDisease[] = []
  const tryPush = (d: any) => {
    if (!d) return
    const name = d.name || d.label || d.disease || d.title
    if (!name || typeof name !== 'string') return
    const probability = typeof d.probability === 'number'
      ? d.probability
      : typeof d.score === 'number'
        ? d.score
        : typeof d.confidence === 'number'
          ? d.confidence
          : undefined
    candidates.push({
      name,
      probability,
      description: d.description || d.details || d.summary,
      symptoms: d.symptoms || [],
      treatment: d.treatment || d.treatments,
    })
  }

  // Common shapes we’ve seen across our functions
  const paths = [
    raw?.healthAssessment?.diseases,
    raw?.detectedDiseases,
    raw?.diseases,
    raw?.analysis?.diseases,
    raw?.issues,
  ]

  for (const p of paths) {
    if (Array.isArray(p)) p.forEach(tryPush)
  }

  return candidates
}

function mergeAndRank(diseases: ConsensusDisease[]): ConsensusDisease[] {
  const map = new Map<string, ConsensusDisease>()
  for (const d of diseases) {
    const key = d.name.trim().toLowerCase()
    const existing = map.get(key)
    if (!existing) {
      map.set(key, { ...d })
    } else {
      const p1 = existing.probability ?? 0
      const p2 = d.probability ?? 0
      map.set(key, {
        ...existing,
        probability: Math.max(p1, p2),
        description: existing.description || d.description,
        symptoms: existing.symptoms?.length ? existing.symptoms : d.symptoms,
        treatment: existing.treatment || d.treatment,
      })
    }
  }
  return Array.from(map.values()).sort((a, b) => (b.probability ?? 0) - (a.probability ?? 0))
}

export class DiagnosisConsensusService {
  static async refineDiagnosis(imageBase64: string, comp?: any): Promise<ConsensusResult> {
    const sources: string[] = []

    // Start with comp result if provided
    let allDiseases: ConsensusDisease[] = normalizeDiseases(comp)
    if (allDiseases.length) sources.push('comprehensive-plant-diagnosis')

    // Call extra detectors in parallel to avoid latency
    const [plantDiseasesRes, unifiedRes] = await Promise.allSettled([
      supabase.functions.invoke('analyze-plant-diseases', { body: { imageBase64 } }),
      supabase.functions.invoke('unified-plant-diagnosis', { body: { imageBase64 } }),
    ])

    const safeGet = (p: PromiseSettledResult<any>) => (p.status === 'fulfilled' ? p.value?.data : undefined)

    const plantDiseasesData = safeGet(plantDiseasesRes)
    const unifiedData = safeGet(unifiedRes)

    if (plantDiseasesData) {
      allDiseases = allDiseases.concat(normalizeDiseases(plantDiseasesData))
      sources.push('analyze-plant-diseases')
    }
    if (unifiedData) {
      allDiseases = allDiseases.concat(normalizeDiseases(unifiedData))
      sources.push('unified-plant-diagnosis')
    }

    const ranked = mergeAndRank(allDiseases)

    // Heuristic for health: any credible disease >= 0.5 or 50%
    const topProb = ranked[0]?.probability ?? 0

    let isHealthy = true
    // Consider comp signal if present
    if (comp?.healthAssessment?.isHealthy === false) isHealthy = false

    if (ranked.length > 0 && topProb >= 0.5) isHealthy = false

    // Validate top candidates against EPPO
    const topNames = ranked.slice(0, 3).map(d => d.name)
    const validatedByEPPO: string[] = []

    try {
      const validations = await Promise.allSettled(topNames.map(n => eppoService.searchPathogens(n)))
      validations.forEach((v, idx) => {
        if (v.status === 'fulfilled' && Array.isArray(v.value) && v.value.length > 0) {
          validatedByEPPO.push(topNames[idx])
          // Small boost if validated
          ranked[idx].probability = Math.min(1, (ranked[idx].probability ?? 0.6) + 0.15)
        }
      })
    } catch (_) {
      // EPPO failure shouldn’t break the flow
    }

    const finalRanked = mergeAndRank(ranked)

    return {
      isHealthy,
      diseases: finalRanked,
      validatedByEPPO,
      sources,
    }
  }
}
