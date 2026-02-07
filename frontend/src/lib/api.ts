import { buildApiUrl, getApiBase } from './apiBase'

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {},
  timeoutMs: number = 60000  // Default 60 second timeout
): Promise<ApiResponse<T>> {
  try {
    const token = localStorage.getItem('admin_token');
    const headers = new Headers(options.headers);
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(buildApiUrl(getApiBase(), endpoint), {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timed out. Please check your network and SMTP configuration.');
      }
      throw error;
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Paper Preview (step 1)
export interface PaperPreviewRequest {
  openreview_url: string;
  openreview_username?: string;
  openreview_password?: string;
}

export interface PaperPreview {
  openreview_id: string;
  title: string | null;
  venue: string | null;
  authors: string[];
}

// Paper Create (step 2 - after confirmation)
export interface PaperCreate {
  openreview_id: string;
  title: string;
  venue: string;
  email: string;
  verification_code: string;
  openreview_username?: string;
  openreview_password?: string;
  notify_on_review: boolean;
  notify_on_review_modified: boolean;
  notify_on_decision: boolean;
}

export interface EmailVerificationRequest {
  email: string;
  openreview_id: string;
}

export interface EmailVerificationResponse {
  message: string;
  expires_in_minutes: number;
}

export interface Paper {
  id: number;
  openreview_id: string;
  title: string | null;
  venue: string | null;
  status: string;
  last_checked: string | null;
  created_at: string;
  subscriber_count?: number;
  notified_review?: boolean;
  notified_decision?: boolean;
}

export interface Subscriber {
  id: number;
  paper_id: number;
  email: string;
  notify_on_review: boolean;
  notify_on_review_modified: boolean;
  notify_on_decision: boolean;
  notified_review: boolean;
  notified_decision: boolean;
  created_at: string;
  paper_title: string | null;
  paper_venue: string | null;
}

export interface Config {
  check_interval: number;
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  from_email: string;
}

export interface ConfigUpdate {
  check_interval?: number;
  smtp_host?: string;
  smtp_port?: number;
  smtp_user?: string;
  smtp_password?: string;
  from_email?: string;
}

export interface PublicEmailConfig {
  from_email: string;
}

export const api = {
  // Public APIs
  previewPaper: (data: PaperPreviewRequest) =>
    fetchApi<PaperPreview>('/papers/preview', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  addPaper: (data: PaperCreate) =>
    fetchApi<{ message: string; success: boolean }>('/papers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  requestEmailVerification: (data: EmailVerificationRequest) =>
    fetchApi<EmailVerificationResponse>('/papers/verify-email', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getPublicEmailConfig: () =>
    fetchApi<PublicEmailConfig>('/public/email-config'),

  getPaperStatus: (paperId: number) =>
    fetchApi<{ id: number; title: string; status: string; venue: string; review_data: object }>(
      `/papers/${paperId}/status`
    ),

  // Admin APIs
  login: (password: string) =>
    fetchApi<{ token: string; token_type: string }>('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),

  getPapers: () => fetchApi<Paper[]>('/admin/papers'),

  deletePaper: (paperId: number) =>
    fetchApi<{ message: string }>(`/admin/papers/${paperId}`, {
      method: 'DELETE',
    }),

  updatePaper: (paperId: number, data: Partial<Paper>) =>
    fetchApi<Paper>(`/admin/papers/${paperId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getSubscribers: () => fetchApi<Subscriber[]>('/admin/subscribers'),

  deleteSubscriber: (subscriberId: number) =>
    fetchApi<{ message: string }>(`/admin/subscribers/${subscriberId}`, {
      method: 'DELETE',
    }),

  resetSubscriberNotifications: (subscriberId: number) =>
    fetchApi<{ message: string }>(`/admin/subscribers/${subscriberId}/reset-notifications`, {
      method: 'POST',
    }),

  getConfig: () => fetchApi<Config>('/admin/config'),

  updateConfig: (data: ConfigUpdate) =>
    fetchApi<{ message: string }>('/admin/config', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Test email with longer timeout (45 seconds)
  sendTestEmail: (to_email: string) =>
    fetchApi<{ message: string }>('/admin/test-email', {
      method: 'POST',
      body: JSON.stringify({ to_email }),
    }, 45000),

  checkNow: () =>
    fetchApi<{ message: string }>('/admin/check-now', {
      method: 'POST',
    }),
};
