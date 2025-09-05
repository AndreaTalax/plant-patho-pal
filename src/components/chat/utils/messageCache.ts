// Utility: localStorage cache + merge for chat messages
export type MinimalMsg = { id: string; sent_at: string };

const KEY = (cid: string) => `ppp:messages:${cid}`;

export function loadCachedMessages<T extends MinimalMsg>(conversationId: string): T[] {
  try {
    const raw = localStorage.getItem(KEY(conversationId));
    return raw ? JSON.parse(raw) as T[] : [];
  } catch {
    return [];
  }
}

export function saveCachedMessages<T extends MinimalMsg>(conversationId: string, msgs: T[]) {
  try {
    localStorage.setItem(KEY(conversationId), JSON.stringify(msgs));
  } catch {}
}

export function mergeMessages<T extends MinimalMsg>(a: T[], b: T[]) {
  const map = new Map<string, T>();
  [...a, ...b].forEach(m => map.set(m.id, m));
  const merged = Array.from(map.values());
  merged.sort((m1, m2) => {
    const d1 = new Date(m1.sent_at).getTime() || 0;
    const d2 = new Date(m2.sent_at).getTime() || 0;
    if (d1 === d2) return (m1.id || '').localeCompare(m2.id || '');
    return d1 - d2;
  });
  return merged;
}
