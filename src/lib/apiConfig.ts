// Helper to get API base URL from env or default to localhost
export function getApiBase(): string {
  // If VITE_API_BASE is set (e.g., https://your-backend.onrender.com), use it
  if (import.meta.env.VITE_API_BASE) {
    return import.meta.env.VITE_API_BASE;
  }
  // Fallback to localhost for local development
  return 'http://localhost:5000';
}
