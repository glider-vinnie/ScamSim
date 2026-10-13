/**
 * Client ID generator and retriever.
 * Uses UUID v4 stored in localStorage for pseudonymous ownership.
 */
export function getClientId(): string {
  const STORAGE_KEY = "scamsim_client_id";
  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing) {
      return existing;
    }
    const newId = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, newId);
    return newId;
  } catch {
    // Fallback if localStorage or crypto.randomUUID is unavailable
    return "anonymous-" + Math.random().toString(36).substring(2, 15);
  }
}
