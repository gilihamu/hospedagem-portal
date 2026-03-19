const API_URL = import.meta.env.VITE_API_URL || '/api';

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getToken(): string | null {
    try {
      const auth = localStorage.getItem('hbs_auth');
      if (auth) {
        const parsed = JSON.parse(auth);
        return parsed?.token ?? null;
      }
    } catch {
      // ignore
    }
    return null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { params, ...fetchOptions } = options;

    let url = this.baseUrl + endpoint;

    if (params) {
      const searchParams = new URLSearchParams(params);
      url += '?' + searchParams.toString();
    }

    const token = this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      (headers as Record<string, string>)['Authorization'] = 'Bearer ' + token;
    }

    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    if (!response.ok) {
      // Handle expired token: clear auth and redirect to login
      if (response.status === 401) {
        try {
          localStorage.removeItem('hbs_auth');
        } catch { /* ignore */ }
        const error = new Error('Sessão expirada. Faça login novamente.');
        // Redirect to login after a small delay so the toast can show
        setTimeout(() => { window.location.href = '/login'; }, 1500);
        throw error;
      }

      const body = await response.json().catch(() => ({}));
      const errorMessage = body.error || body.message || body.detail || response.statusText;
      throw new Error(errorMessage || 'Request failed');
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', params });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiClient(API_URL);
