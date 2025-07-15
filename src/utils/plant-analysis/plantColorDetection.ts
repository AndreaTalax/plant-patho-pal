
/**
 * Stima la probabilità che un'immagine contenga una pianta basandosi sull'abbondanza di tonalità verdi.
 * Ritorna un valore compreso tra 0 e 1.
 * Più verde => più probabile che sia una pianta.
 */
export async function getPlantGreenConfidence(imageFile: File): Promise<number> {
  try {
    const img = await createImageBitmap(imageFile);
    const canvas = document.createElement('canvas');
    const sampleSize = 100;
    canvas.width = sampleSize;
    canvas.height = sampleSize;

    const ctx = canvas.getContext('2d');
    ctx?.drawImage(img, 0, 0, sampleSize, sampleSize);

    const imageData = ctx?.getImageData(0, 0, sampleSize, sampleSize);
    if (!imageData) return 0.5;

    let greenishPixelCount = 0;
    let totalPixels = imageData.data.length / 4;

    for (let i = 0; i < imageData.data.length; i += 4) {
      const r = imageData.data[i];
      const g = imageData.data[i + 1];
      const b = imageData.data[i + 2];

      // Condizione più permissiva per rilevare piante
      if (
        g > 40 && (g > r + 5) && (g > b + 5) && // verde più dominante (soglia ridotta)
        !(r > 180 && g > 180 && b > 180) // escludi solo pixel molto chiari
      ) {
        greenishPixelCount++;
      }
    }

    const greenRatio = greenishPixelCount / totalPixels;
    // Mappiamo in confidence ragionevole (es: 10% verde → 0.1, 70%+ verde → 1)
    return Math.min(Math.max(greenRatio * 1.2, 0), 1);
  } catch (err) {
    console.error("Errore nella stima cromatica:", err);
    return 0.5;
  }
}
