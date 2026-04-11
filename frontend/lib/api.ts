const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: FetchOptions = {}, token?: string): Promise<T> {
    const { params, ...fetchOptions } = options;
    
    let url = `${this.baseUrl}${endpoint}`;
    
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
      url += `?${searchParams.toString()}`;
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...fetchOptions.headers as Record<string, string>,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: `HTTP ${response.status}` }));
      const errorMessage = error.message || error.error || `HTTP ${response.status}`;
      throw new Error(errorMessage);
    }

    return response.json();
  }

  async get<T>(endpoint: string, token?: string, options: FetchOptions = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' }, token);
  }

  async post<T>(endpoint: string, data?: unknown, token?: string, options: FetchOptions = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }, token);
  }

  async postFormData<T>(endpoint: string, formData: FormData, token?: string): Promise<T> {
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      body: formData,
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: `HTTP ${response.status}` }));
      const errorMessage = error.message || error.error || `HTTP ${response.status}`;
      throw new Error(errorMessage);
    }

    return response.json();
  }
}

export const apiClient = new ApiClient(API_URL);

export const apiEndpoints = {
  health: '/v1/health',
  catalog: '/v1/catalog',
  catalogById: (id: string) => `/v1/catalog/${id}`,
  categories: '/v1/categories',
  ingest: '/v1/admin/ingest',
  auth: {
    callback: '/v1/auth/callback',
    logout: '/v1/auth/logout',
    me: '/v1/auth/me',
    login: '/v1/auth/login',
    register: '/v1/auth/register',
  },
};
