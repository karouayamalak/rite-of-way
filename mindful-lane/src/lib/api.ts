// Centralized API client for the Rite of Way backend
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const getAuthHeader = (): Record<string, string> => {
  const token = localStorage.getItem('row_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const request = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const url = `${API_URL}/api${endpoint}`;

  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
      ...(options.headers as Record<string, string>),
    },
    ...options,
  };

  // Don't set Content-Type for FormData
  if (options.body instanceof FormData) {
    const headers = config.headers as Record<string, string>;
    delete headers['Content-Type'];
  }

  let response: Response;
  try {
    response = await fetch(url, config);
  } catch {
    // Network error — server is unreachable or CORS preflight failed
    throw new ApiError('Cannot connect to server. Please check your connection and try again.', 0);
  }

  let data: Record<string, unknown>;
  try {
    data = await response.json();
  } catch {
    // Response was not valid JSON (e.g. nginx HTML error page, rate-limit plain-text)
    throw new ApiError(
      response.ok ? 'Unexpected server response.' : `Server error (${response.status})`,
      response.status
    );
  }

  if (!response.ok) {
    throw new ApiError(
      (data.message as string) || 'Something went wrong',
      response.status,
      data
    );
  }

  return data as T;
};

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint),

  post: <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  put: <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  delete: <T>(endpoint: string) =>
    request<T>(endpoint, { method: 'DELETE' }),

  upload: <T>(endpoint: string, formData: FormData) =>
    request<T>(endpoint, {
      method: 'POST',
      body: formData,
      headers: {},
    }),
};

export { API_URL };
