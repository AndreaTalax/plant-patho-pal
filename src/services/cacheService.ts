
export class CacheService {
  private static cache = new Map<string, any>();

  static async get<T>(key: string): Promise<T | null> {
    const cached = this.cache.get(key);
    return cached || null;
  }

  static async set<T>(key: string, value: T): Promise<void> {
    this.cache.set(key, value);
  }

  static generateImageHash(imageData: string): string {
    // Simple hash generation based on image data length and substring
    const hash = imageData.length.toString() + imageData.substring(0, 50);
    return btoa(hash).substring(0, 16);
  }
}
