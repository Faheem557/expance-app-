/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Centralised HTTP client for the Laravel REST API.
 * All endpoints live under /api/v1.
 */

const BASE = (import.meta.env.VITE_API_URL as string) ?? 'http://127.0.0.1:8000/api/v1';

function getToken(): string | null {
  return localStorage.getItem('auth_token');
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return undefined as T;
  }

  const json = await res.json();

  if (!res.ok) {
    const msg =
      json?.message ??
      (json?.errors ? Object.values(json.errors).flat().join(' ') : res.statusText);
    throw new Error(msg);
  }

  return json as T;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  register: (name: string, email: string, password: string) =>
    request<{ user: any; token: string }>('POST', '/auth/register', {
      name,
      email,
      password,
      password_confirmation: password,
    }),

  login: (email: string, password: string) =>
    request<{ user: any; token: string }>('POST', '/auth/login', { email, password }),

  logout: () => request<void>('POST', '/auth/logout'),

  me: () => request<any>('GET', '/auth/me'),
};

// ─── Accounts ─────────────────────────────────────────────────────────────────

export const accountsApi = {
  list: () => request<any[]>('GET', '/accounts'),
  create: (data: Record<string, any>) => request<any>('POST', '/accounts', data),
  update: (id: number, data: Record<string, any>) => request<any>('PUT', `/accounts/${id}`, data),
  remove: (id: number) => request<void>('DELETE', `/accounts/${id}`),
  sync: (id: number) => request<any>('POST', `/accounts/${id}/sync`),
  transfer: (data: Record<string, any>) => request<any>('POST', '/accounts/transfer', data),
};

// ─── Transactions ──────────────────────────────────────────────────────────────

export const transactionsApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any[]>('GET', `/transactions${qs}`);
  },
  create: (data: Record<string, any>) => request<any>('POST', '/transactions', data),
  remove: (id: number) => request<void>('DELETE', `/transactions/${id}`),
  clearAll: () => request<void>('DELETE', '/transactions'),
};

// ─── Budgets ──────────────────────────────────────────────────────────────────

export const budgetsApi = {
  list: () => request<any[]>('GET', '/budgets'),
  updateLimit: (id: number, limit_amount: number) =>
    request<any>('PATCH', `/budgets/${id}/limit`, { limit_amount }),
  reset: () => request<any>('POST', '/budgets/reset'),
  recalculate: () => request<any>('POST', '/budgets/recalculate'),
};

// ─── Categories ───────────────────────────────────────────────────────────────

export const categoriesApi = {
  list: () => request<any[]>('GET', '/categories'),
  create: (name: string, color?: string, limit?: number) =>
    request<any>('POST', '/categories', { name, color, limit }),
};

// ─── Goals ────────────────────────────────────────────────────────────────────

export const goalsApi = {
  list: () => request<any[]>('GET', '/goals'),
  create: (data: Record<string, any>) => request<any>('POST', '/goals', data),
  remove: (id: number) => request<void>('DELETE', `/goals/${id}`),
};

// ─── Loans ────────────────────────────────────────────────────────────────────

export const loansApi = {
  list: () => request<any[]>('GET', '/loans'),
  create: (data: Record<string, any>) => request<any>('POST', '/loans', data),
  updateStatus: (id: number, status: string) =>
    request<any>('PATCH', `/loans/${id}/status`, { status }),
  remove: (id: number) => request<void>('DELETE', `/loans/${id}`),
  addPayment: (id: number, data: Record<string, any>) =>
    request<any>('POST', `/loans/${id}/payments`, data),
};

// ─── Misc ─────────────────────────────────────────────────────────────────────

export const miscApi = {
  resetAll: () => request<void>('POST', '/reset'),
};
