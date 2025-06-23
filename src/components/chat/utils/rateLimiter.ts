
// Rate limiting utility for chat operations
const rateLimitMap = new Map<string, number>();

export const canMakeRequest = (key: string, minInterval: number = 1000) => {
  const now = Date.now();
  const lastRequest = rateLimitMap.get(key) || 0;
  if (now - lastRequest < minInterval) {
    console.log(`⏳ Rate limiting ${key}, skipping request`);
    return false;
  }
  rateLimitMap.set(key, now);
  return true;
};

export const clearRateLimit = (key?: string) => {
  if (key) {
    rateLimitMap.delete(key);
  } else {
    rateLimitMap.clear();
  }
};
