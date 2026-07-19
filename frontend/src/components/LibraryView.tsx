import React, { useState, useEffect } from 'react';
import { apiClient, BackendDocument } from '../api';
import '../styles.css';

const CATEGORIES = ['All', 'Projects', 'Certifications', 'Internships', 'Achievements', 'Academics', 'Skills'];

const CATEGORY_ICONS: Record<string, string> = {
  Projects: '🏗️', Certifications: '🎓', Internships: '💼',
  Achievements: '🏆', Academics: '📚', Skills: '⚡', Uncategorized: '📄',
};

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  processed:  { label: 'Processed',  color: 'var(--kx-emerald)' },
  processing: { label: 'Processing', color: 'var(--kx-amber)'   },
  pending:    { label: 'Pending',    color: 'var(--kx-amber)'   },
  failed:     { label: 'Failed',     color: 'var(--kx-rose)'    },
};

const VISUAL_CLASS: Record<string, string> = {
  Projects: 'projects', Certifications: 'certifications',
  Internships: 'internships', Achievements: 'achievements',
  Academics: 'academics', Skills: 'skills',
};

const BADGE_CLASS: Record<string, string> = {
  Projects: 'badge-projects', Certifications: 'badge-certifications',
  Internships: 'badge-internships', Achievements: 'badge-achievements',
  Academics: 'badge-academics', Skills: 'badge-skills',
};

export default function LibraryView() {
  const [documents, setDocuments] = useState<BackendDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => { fetchDocuments(); }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const docs = await apiClient.getDocuments(100);
      setDocuments(docs);
    } catch (e: any) {
      setError(e.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this document? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await apiClient.deleteDocument(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch (e: any) {
      alert(e.message || 'Delete failed');
    } finally {
      setDeleting(null);
    }
  };

  const filtered = documents.filter((doc) => {
    const matchesFilter = filter === 'All' || doc.category === filter;
    const matchesSearch =
      !search ||
      (doc.original_filename || doc.filename).toLowerCase().includes(search.toLowerCase()) ||
      (doc.category || '').toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="space-y-6 kx-fade-in">
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {CATEGORIES.map((c) => (
            <div key={c} className="kx-skeleton" style={{ height: 30, width: 80, borderRadius: 'var(--kx-radius-full)' }} />
          ))}
        </div>
        <div className="kx-grid kx-grid-auto">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="doc-card kx-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
              <div className="kx-skeleton" style={{ height: 140 }} />
              <div className="doc-card-body">
                <div className="kx-skeleton" style={{ height: 14, marginBottom: 8 }} />
                <div className="kx-skeleton" style={{ height: 12, width: '60%' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="kx-empty kx-fade-in">
        <div className="kx-empty-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <div className="kx-empty-title">Failed to load library</div>
        <div className="kx-empty-desc">{error}</div>
        <button onClick={fetchDocuments} className="kx-btn kx-btn-primary">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        {/* Search */}
        <div className="kx-search-wrapper" style={{ maxWidth: 340 }}>
          <span className="kx-search-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </span>
          <input
            id="library-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents…"
            className="kx-search-input"
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* View toggle */}
          <div style={{ display: 'flex', background: 'var(--kx-glass)', border: '1px solid var(--kx-border)', borderRadius: 'var(--kx-radius-md)', padding: '3px' }}>
            {(['grid', 'list'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                style={{
                  padding: '5px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  background: viewMode === mode ? 'var(--kx-glass-active)' : 'transparent',
                  color: viewMode === mode ? 'var(--kx-text-bright)' : 'var(--kx-text-muted)',
                  transition: 'var(--kx-transition-fast)',
                }}
              >
                {mode === 'grid' ? '⊞' : '☰'}
              </button>
            ))}
          </div>
          {/* Doc count */}
          <span style={{ fontSize: '0.8125rem', color: 'var(--kx-text-muted)' }}>
            {filtered.length} / {documents.length} docs
          </span>
        </div>
      </div>

      {/* Category filter pills */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {CATEGORIES.map((cat) => {
          const count = cat === 'All' ? documents.length : documents.filter((d) => d.category === cat).length;
          return (
            <button
              key={cat}
              id={`filter-${cat.toLowerCase()}`}
              onClick={() => setFilter(cat)}
              className={`kx-tag${filter === cat ? ' active' : ''}`}
              style={{ cursor: 'pointer', border: 'none' }}
            >
              {cat !== 'All' && <span>{CATEGORY_ICONS[cat]}</span>}
              {cat}
              <span
                style={{
                  background: 'var(--kx-glass-active)',
                  borderRadius: 'var(--kx-radius-full)',
                  padding: '1px 5px',
                  fontSize: '0.6875rem',
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="kx-empty kx-fade-in">
          <div className="kx-empty-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
          </div>
          <div className="kx-empty-title">No documents found</div>
          <div className="kx-empty-desc">
            {documents.length === 0
              ? 'Upload your first document to get started.'
              : 'Try adjusting your search or filter.'}
          </div>
        </div>
      )}

      {/* Grid view */}
      {viewMode === 'grid' && filtered.length > 0 && (
        <div className="kx-grid kx-grid-auto">
          {filtered.map((doc, i) => {
            const cat = doc.category || 'Uncategorized';
            const visualClass = VISUAL_CLASS[cat] || 'general';
            const badgeClass = BADGE_CLASS[cat] || 'badge-general';
            const status = STATUS_BADGE[doc.status] || { label: doc.status, color: 'var(--kx-text-muted)' };
            return (
              <div key={doc.id} className="doc-card kx-fade-in" style={{ animationDelay: `${Math.min(i, 10) * 40}ms` }}>
                {/* Visual header */}
                <div className={`doc-card-visual ${visualClass}`}>
                  <span className="doc-card-icon">{CATEGORY_ICONS[cat] || '📄'}</span>
                  {/* Status dot */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      width: 9,
                      height: 9,
                      borderRadius: '50%',
                      background: status.color,
                      boxShadow: `0 0 6px ${status.color}`,
                    }}
                  />
                </div>

                {/* Body */}
                <div className="doc-card-body">
                  <div className="doc-card-title" title={doc.original_filename || doc.filename}>
                    {doc.original_filename || doc.filename}
                  </div>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <span className={`doc-card-badge ${badgeClass}`}>{cat}</span>
                  </div>
                  <div className="doc-card-meta">
                    <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                    <span>{doc.file_size_bytes ? `${Math.round(doc.file_size_bytes / 1024)} KB` : '—'}</span>
                  </div>
                  {/* Drive / Notion badges */}
                  {doc.external_links && (
                    <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.5rem' }}>
                      {doc.external_links.google_drive?.status === 'synced' && (
                        <a
                          href={doc.external_links.google_drive.web_view_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontSize: '0.6875rem',
                            background: 'rgba(66,133,244,0.12)',
                            color: '#4285f4',
                            padding: '2px 7px',
                            borderRadius: 'var(--kx-radius-full)',
                            fontWeight: 600,
                            textDecoration: 'none',
                          }}
                        >
                          📂 Drive
                        </a>
                      )}
                      {doc.external_links.notion?.status === 'synced' && (
                        <a
                          href={doc.external_links.notion.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontSize: '0.6875rem',
                            background: 'rgba(255,255,255,0.08)',
                            color: 'var(--kx-text)',
                            padding: '2px 7px',
                            borderRadius: 'var(--kx-radius-full)',
                            fontWeight: 600,
                            textDecoration: 'none',
                          }}
                        >
                          📝 Notion
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="doc-card-actions">
                  {doc.storage_url && (
                    <a
                      href={doc.storage_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="kx-btn kx-btn-ghost kx-btn-sm"
                      style={{ flex: 1 }}
                    >
                      View
                    </a>
                  )}
                  <button
                    onClick={() => handleDelete(doc.id)}
                    disabled={deleting === doc.id}
                    className="kx-btn kx-btn-danger kx-btn-sm"
                  >
                    {deleting === doc.id ? '…' : 'Delete'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List view */}
      {viewMode === 'list' && filtered.length > 0 && (
        <div className="kx-card">
          <div className="kx-card-body" style={{ padding: 0 }}>
            {filtered.map((doc, i) => {
              const cat = doc.category || 'Uncategorized';
              const status = STATUS_BADGE[doc.status] || { label: doc.status, color: 'var(--kx-text-muted)' };
              return (
                <div
                  key={doc.id}
                  className="kx-fade-in"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '0.875rem 1.25rem',
                    borderBottom: i < filtered.length - 1 ? '1px solid var(--kx-border)' : 'none',
                    transition: 'var(--kx-transition-fast)',
                    animationDelay: `${Math.min(i, 10) * 30}ms`,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--kx-glass)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <span style={{ fontSize: '1.25rem' }}>{CATEGORY_ICONS[cat] || '📄'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="truncate" style={{ fontWeight: 500, color: 'var(--kx-text-bright)', fontSize: '0.9375rem' }}>
                      {doc.original_filename || doc.filename}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--kx-text-muted)' }}>
                      {cat} · {new Date(doc.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: status.color, fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {status.label}
                  </span>
                  {doc.storage_url && (
                    <a
                      href={doc.storage_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="kx-btn kx-btn-ghost kx-btn-sm"
                    >
                      View
                    </a>
                  )}
                  <button
                    onClick={() => handleDelete(doc.id)}
                    disabled={deleting === doc.id}
                    className="kx-btn kx-btn-danger kx-btn-sm"
                  >
                    {deleting === doc.id ? '…' : 'Delete'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
