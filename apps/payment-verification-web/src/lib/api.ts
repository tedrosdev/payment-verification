const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}

export function setStoredToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('access_token', token);
  }
}

export function clearStoredToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token');
  }
}

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getStoredToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401 && typeof window !== 'undefined') {
        clearStoredToken();
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
      const errorData = await response.json().catch(() => ({ message: 'API request failed' }));
      throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    if (error.message && error.message !== 'Failed to fetch') {
      throw error;
    }

    // Strict requirement: Do not log in if backend is offline. Show clear connection error.
    throw new Error(
      `Unable to connect to backend API server at ${API_BASE_URL}. Please ensure the NestJS backend API is running (run 'pnpm dev' or start the server).`,
    );
  }
}
