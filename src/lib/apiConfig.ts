// Helper to get API base URL from env or default to localhost
export function getApiBase(): string {
  const fromEnv =
    import.meta.env.VITE_API_BASE ||
    import.meta.env.VITE_API_URL;

  if (fromEnv) {
    return String(fromEnv).replace(/\/$/, '');
  }

  return 'http://localhost:5000';
}

export function getWsUrl(): string {
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL;
  }

  const apiBase = getApiBase();
  if (apiBase.startsWith('https://')) {
    return apiBase.replace(/^https:\/\//, 'wss://');
  }
  if (apiBase.startsWith('http://')) {
    return apiBase.replace(/^http:\/\//, 'ws://');
  }

  return 'ws://localhost:5000';
}
