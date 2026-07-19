/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// Types matching backend MongoDB schema
export interface User {
  id: string;
  full_name: string;
  email: string;
  auth_provider: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface ExternalLinkDetails {
  file_id?: string;
  web_view_link?: string;
  page_id?: string;
  url?: string;
  pushed_at?: string;
  status: string;
}

export interface ExternalLinks {
  google_drive?: ExternalLinkDetails;
  notion?: ExternalLinkDetails;
}

export interface IntegrationStatus {
  provider: string;
  status: string;
  workspace_name?: string;
  last_synced_at?: string;
  last_error?: string;
  connected_at?: string;
}

export interface BackendDocument {
  id: string;
  user_id: string;
  filename: string;
  original_filename?: string;
  file_type: string;
  file_size_bytes?: number;
  storage_key?: string;
  storage_url?: string;
  status: string;
  failure_reason?: string;
  category?: string;
  category_confidence?: number;
  category_overridden: boolean;
  extracted_text?: string;
  extracted_fields?: {
    issuer?: string;
    issue_date?: string;
    expiry_date?: string;
    organization?: string;
    skills_detected?: string[];
  };
  chroma_vector_id?: string;
  ocr_applied: boolean;
  is_deleted: boolean;
  external_links?: ExternalLinks;
  created_at: string;
  updated_at: string;
}

export interface BackendSkill {
  id: string;
  user_id: string;
  name: string;
  normalized_name: string;
  source_document_ids: string[];
  confidence_score?: number;
  on_resume: boolean;
  has_evidence: boolean;
  first_detected_at: string;
  updated_at: string;
}

export interface BackendRelationship {
  id: string;
  user_id: string;
  source_type: string;
  source_id: string;
  target_type: string;
  target_id: string;
  relationship_type: string;
  strength?: number;
  ai_generated: boolean;
  created_at: string;
}

export interface BackendTimelineEvent {
  id: string;
  user_id: string;
  year: number;
  month?: number;
  title: string;
  category: string;
  document_id?: string;
  description?: string;
  created_at: string;
}

// Convert backend document to frontend document type
export function convertBackendToFrontendDoc(backendDoc: BackendDocument) {
  return {
    ...backendDoc,
    id: backendDoc.id,
    title: backendDoc.filename,
    date: new Date(backendDoc.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    category: backendDoc.category || 'General',
    size: formatFileSize(backendDoc.file_size_bytes || 0),
    iconType: getIconType(backendDoc.file_type, backendDoc.category),
    bgImageUrl: getPlaceholderImage(backendDoc.category),
    altText: backendDoc.extracted_text?.substring(0, 100) || 'No description available',
    status: backendDoc.status,
    confidence: backendDoc.category_confidence
  };
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function getIconType(fileType: string, category?: string): 'paper' | 'cert' | 'draw' | 'receipt' | 'home' | 'medical' | 'flight' | 'security' | 'table' | 'image' {
  const ext = fileType.toLowerCase();
  if (ext.includes('pdf')) return 'paper';
  if (ext.includes('image') || ext.includes('png') || ext.includes('jpg')) return 'image';
  if (category === 'Certifications') return 'cert';
  if (category === 'Projects') return 'draw';
  if (category === 'Internships') return 'receipt';
  if (category === 'Academics') return 'home';
  return 'paper';
}

function getPlaceholderImage(category?: string): string {
  const categoryColors: Record<string, string> = {
    'Projects': '#2F5D8A',
    'Skills': '#2E8B57',
    'Certifications': '#B5652A',
    'Internships': '#8A4FA0',
    'Achievements': '#2E8B8B',
    'Academics': '#6B7280',
    'General': '#64748b'
  };
  const color = categoryColors[category || 'General'] || '#64748b';
  return `https://via.placeholder.com/400x300/${color.replace('#', '')}/ffffff?text=${category || 'General'}`;
}

function mapStatus(status: string): string {
  if (status === 'indexed') return 'processed';
  if (status === 'failed') return 'failed';
  return 'processing';
}

// API Client Class
class ApiClient {
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token');
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(error.detail || 'Request failed');
    }

    return response.json();
  }

  // Authentication
  async login(email: string, password: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(email: string, password: string, full_name?: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name }),
    });
  }

  // Documents
  async getDocuments(limit: number = 100): Promise<BackendDocument[]> {
    const res = await this.request<{ documents: BackendDocument[]; total: number; page: number; limit: number }>(`/documents?limit=${limit}`);
    return (res.documents || []).map(d => ({ ...d, status: mapStatus(d.status) }));
  }

  async uploadDocument(file: File): Promise<{ id: string; filename: string; status: string; storage_url: string | null; message: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const url = `${API_BASE_URL}/upload`;
    const headers: HeadersInit = {};

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(error.detail || 'Upload failed');
    }

    return response.json();
  }

  async getDocumentStatus(documentId: string): Promise<{ id: string; status: string; category: string | null; created_at: string }> {
    const res = await this.request<{ id: string; status: string; category: string | null; created_at: string }>(`/upload/${documentId}/status`);
    return res;
  }

  async updateDocument(id: string, data: Partial<BackendDocument>): Promise<BackendDocument> {
    const doc = await this.request<BackendDocument>(`/documents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return { ...doc, status: mapStatus(doc.status) };
  }

  async deleteDocument(id: string): Promise<void> {
    return this.request<void>(`/documents/${id}`, {
      method: 'DELETE',
    });
  }

  // Search
  async searchDocuments(query: string, limit: number = 10): Promise<{ query: string; total_results: number; results: BackendDocument[] }> {
    const res = await this.request<{ query: string; total_results: number; results: BackendDocument[] }>('/search', {
      method: 'POST',
      body: JSON.stringify({ query, limit }),
    });
    if (res.results) {
      res.results = res.results.map(d => ({ ...d, status: mapStatus(d.status) }));
    }
    return res;
  }

  async getSkills(): Promise<BackendSkill[]> {
    return this.request<BackendSkill[]>('/search/skills');
  }

  // Timeline
  async getTimeline(): Promise<{ events: any[]; grouped: any; total_events: number }> {
    return this.request<{ events: any[]; grouped: any; total_events: number }>('/timeline');
  }

  // Graph
  async getGraph(): Promise<{ nodes: any[]; edges: any[]; total_nodes: number; total_edges: number }> {
    return this.request<{ nodes: any[]; edges: any[]; total_nodes: number; total_edges: number }>('/graph');
  }

  // Insights
  async getSkillsInsights(): Promise<{ skills: any[]; total: number; with_evidence: number }> {
    return this.request<{ skills: any[]; total: number; with_evidence: number }>('/insights/skills');
  }

  async getSkillGaps(): Promise<{ missing_categories: string[]; missing_skills: string[]; categories_present: string[] }> {
    return this.request<{ missing_categories: string[]; missing_skills: string[]; categories_present: string[] }>('/insights/gaps');
  }

  async getCareerPaths(): Promise<{ paths: any[] }> {
    return this.request<{ paths: any[] }>('/insights/career-paths');
  }

  // Portfolio
  async getPortfolioSettings(): Promise<{ username: string | null; theme: string | null; visible_categories: string[]; is_published: boolean; published_at: string | null }> {
    return this.request<{ username: string | null; theme: string | null; visible_categories: string[]; is_published: boolean; published_at: string | null }>('/portfolio/settings');
  }

  async updatePortfolioSettings(data: { username?: string; theme?: string; visible_categories?: string[]; is_published?: boolean }): Promise<{ username: string | null; theme: string | null; visible_categories: string[]; is_published: boolean; published_at: string | null }> {
    return this.request<{ username: string | null; theme: string | null; visible_categories: string[]; is_published: boolean; published_at: string | null }>('/portfolio/settings', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async publishPortfolio(): Promise<{ message: string; username: string; url: string }> {
    return this.request<{ message: string; username: string; url: string }>('/portfolio/publish', {
      method: 'POST',
    });
  }

  async getPublicPortfolio(username: string): Promise<{ username: string; theme: string; documents: any[]; skills: string[]; timeline: any[] }> {
    return this.request<{ username: string; theme: string; documents: any[]; skills: string[]; timeline: any[] }>(`/portfolio/u/${username}`);
  }

  // Integrations
  async getIntegrationStatuses(): Promise<IntegrationStatus[]> {
    return this.request<IntegrationStatus[]>('/integrations/status');
  }

  async getGoogleAuthUrl(): Promise<{ authUrl: string }> {
    return this.request<{ authUrl: string }>('/integrations/google/auth-url');
  }

  async getNotionAuthUrl(): Promise<{ authUrl: string }> {
    return this.request<{ authUrl: string }>('/integrations/notion/auth-url');
  }

  async disconnectIntegration(provider: string): Promise<{ status: string; message: string }> {
    return this.request<{ status: string; message: string }>(`/integrations/${provider}`, {
      method: 'DELETE',
    });
  }

  async resyncIntegration(provider: string): Promise<{ status: string; message: string }> {
    return this.request<{ status: string; message: string }>(`/integrations/${provider}/resync`, {
      method: 'POST',
    });
  }
}

export const apiClient = new ApiClient();
