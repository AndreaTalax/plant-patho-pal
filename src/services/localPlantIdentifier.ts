import { pipeline } from '@huggingface/transformers';
import { extractPlantName, detectPlantType } from '@/utils/plant-analysis/plant-name-extractor';

export interface LocalIdentificationResult {
  plantName: string | null;
  confidence: number; // 0-100
  labels: Array<{ label: string; score: number }>;
  plantType?: string | null;
}

export class LocalPlantIdentifier {
  private static pipePromise: Promise<any> | null = null;

  private static getPipeline() {
    if (!this.pipePromise) {
      // Lightweight general classifier; runs fully in-browser
      this.pipePromise = pipeline('image-classification', 'Xenova/vit-base-patch16-224');
    }
    return this.pipePromise;
  }

  static async identify(input: File | string): Promise<LocalIdentificationResult> {
    const pipe = await this.getPipeline();
    const src = typeof input === 'string' ? input : URL.createObjectURL(input);

    try {
      const outputs = await pipe(src, { topk: 5 });
      // outputs: [{ label: string, score: number }, ...]
      const labels = (Array.isArray(outputs) ? outputs : []).map((o: any) => ({ label: o.label, score: o.score })) as Array<{label: string; score: number}>;
      const top = labels[0];
      let plantName: string | null = null;
      for (const cand of labels) {
        const name = extractPlantName(cand.label);
        if (name && name !== 'Pianta') { plantName = name; break; }
      }
      if (!plantName) {
        plantName = top ? extractPlantName(top.label) : null;
        if (plantName === 'Pianta') plantName = null;
      }
      const confidence = Math.round((top?.score ?? 0) * 100);
      const plantType = detectPlantType(plantName);

      return { plantName, confidence, labels, plantType };
    } finally {
      if (typeof input !== 'string') {
        // Revoke created object URL to avoid memory leaks
        URL.revokeObjectURL(src);
      }
    }
  }
}
