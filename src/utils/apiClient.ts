/**
 * Robust API Client with auto-retry and graceful fallbacks.
 * Handles transient network glitches, dev-server reboots, and cross-origin iframe requests.
 */

interface SafeFetchOptions extends RequestInit {
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
}

export async function safeFetchJson<T>(
  url: string,
  options: SafeFetchOptions = {},
  fallback: T | null = null
): Promise<T | null> {
  const {
    timeoutMs = 6000,
    retries = 2,
    retryDelayMs = 400,
    ...fetchOptions
  } = options;

  let lastError: any = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...(fetchOptions.headers || {}),
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = (await response.json()) as T;
      return data;
    } catch (err: any) {
      clearTimeout(timeoutId);
      lastError = err;

      // Only retry if we have attempts remaining
      if (attempt < retries) {
        await new Promise((resolve) =>
          setTimeout(resolve, retryDelayMs * (attempt + 1))
        );
      }
    }
  }

  // Graceful fallback without noisy console.error spamming
  console.warn(`[API] Resource unavailable at ${url}, using offline fallback:`, lastError?.message || lastError);
  return fallback;
}
