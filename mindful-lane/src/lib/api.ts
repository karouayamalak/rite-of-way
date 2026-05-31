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

  const response = await fetch(url, config);
  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(data.message || 'Something went wrong', response.status, data);
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
