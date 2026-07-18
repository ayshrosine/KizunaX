/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// Types matching backend response structure
export interface User {
  id: number;
  email: string;
  username: string;
  full_name?: string;
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

export interface BackendDocument {
  id: number;
  user_id: number;
  filename: string;
  original_filename: string;
  file_path: string;
  file_size: number;
  file_type: string;
  category: string;
  title?: string;
  content?: string;
  summary?: string;
  upload_date: string;
  document_date?: string;
  author?: string;
  organization?: string;
  embedding_id?: string;
  categorization_confidence?: number;
  processing_status: string;
}

export interface BackendSkill {
  id: number;
  user_id: number;
  name: string;
  category: string;
  confidence: number;
  source_document_id?: number;
  created_at: string;
}

export interface BackendTimelineEvent {
  id: number;
  user_id: number;
  document_id?: number;
  event_type: string;
  title: string;
  description?: string;
  event_date: string;
  end_date?: string;
  skills?: string;
  importance: number;
  created_at: string;
}

// Convert backend document to frontend document type
export function convertBackendToFrontendDoc(backendDoc: BackendDocument) {
  return {
    id: backendDoc.id.toString(),
    title: backendDoc.title || backendDoc.original_filename,
    date: new Date(backendDoc.upload_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    category: backendDoc.category || 'General',
    size: formatFileSize(backendDoc.file_size),
    iconType: getIconType(backendDoc.file_type, backendDoc.category),
    bgImageUrl: getPlaceholderImage(backendDoc.category),
    altText: backendDoc.summary || backendDoc.content?.substring(0, 100) || 'No description available'
  };
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function getIconType(fileType: string, category: string): 'paper' | 'cert' | 'draw' | 'receipt' | 'home' | 'medical' | 'flight' | 'security' | 'table' | 'image' {
  const ext = fileType.toLowerCase();
  if (ext.includes('pdf')) return 'paper';
  if (ext.includes('image') || ext.includes('png') || ext.includes('jpg')) return 'image';
  if (category === 'Certifications') return 'cert';
  if (category === 'Projects') return 'draw';
  if (category === 'Internships') return 'receipt';
  if (category === 'Academics') return 'home';
  return 'paper';
}

function getPlaceholderImage(category: string): string {
  const categoryColors: Record<string, string> = {
    'Projects': '#34618e',
    'Certifications': '#059669',
    'Internships': '#0891b2',
    'Academics': '#7c3aed',
    'Achievements': '#d97706',
    'General': '#64748b'
  };
  const color = categoryColors[category] || '#64748b';
  return `https://via.placeholder.com/400x300/${color.replace('#', '')}/ffffff?text=${category}`;
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

  async register(email: string, username: string, password: string, full_name?: string): Promise<User> {
    return this.request<User>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, username, password, full_name }),
    });
  }

  // Documents
  async getDocuments(limit: number = 100): Promise<BackendDocument[]> {
    return this.request<BackendDocument[]>(`/documents?limit=${limit}`);
  }

  async uploadDocument(file: File): Promise<BackendDocument> {
    const formData = new FormData();
    formData.append('file', file);

    return this.request<BackendDocument>('/upload', {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    });
  }

  async updateDocument(id: number, data: Partial<BackendDocument>): Promise<BackendDocument> {
    return this.request<BackendDocument>(`/documents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteDocument(id: number): Promise<void> {
    return this.request<void>(`/documents/${id}`, {
      method: 'DELETE',
    });
  }

  // Search
  async searchDocuments(query: string, limit: number = 10): Promise<BackendDocument[]> {
    return this.request<BackendDocument[]>(`/search/documents?query=${encodeURIComponent(query)}&limit=${limit}`);
  }

  async searchSkills(query: string): Promise<BackendSkill[]> {
    return this.request<BackendSkill[]>(`/search/skills?query=${encodeURIComponent(query)}`);
  }

  // Timeline
  async getTimelineEvents(): Promise<BackendTimelineEvent[]> {
    return this.request<BackendTimelineEvent[]>('/timeline/');
  }

  async createTimelineEvent(event: Partial<BackendTimelineEvent>): Promise<BackendTimelineEvent> {
    return this.request<BackendTimelineEvent>('/timeline/', {
      method: 'POST',
      body: JSON.stringify(event),
    });
  }
}

export const apiClient = new ApiClient();
