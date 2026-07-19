import React, { useState } from 'react';
import { apiClient, BackendDocument } from '../api';
import '../styles.css';

interface SearchResult extends BackendDocument {
  score?: number;
}

export default function SearchView() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const res = await apiClient.searchDocuments(query.trim(), 15);
      setResults(res.results || []);
    } catch (err: any) {
      setError(err.message || 'Search failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const SUGGESTION_QUERIES = [
    'machine learning certifications',
    'internship experience',
    'web development projects',
    'academic achievements',
    'leadership skills',
    'cloud computing',
  ];

  const CATEGORY_ICONS: Record<string, string> = {
    Projects: '🏗️', Certifications: '🎓', Internships: '💼',
    Achievements: '🏆', Academics: '📚', Skills: '⚡',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="kx-fade-in">
        <h2 className="text-xl font-bold text-bright" style={{ marginBottom: '0.5rem' }}>
          Semantic Search
        </h2>
        <p className="text-secondary" style={{ fontSize: '0.9375rem' }}>
          Ask questions in natural language — powered by vector embeddings across your entire vault.
        </p>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="kx-fade-in kx-fade-in-delay-1">
        <div style={{ position: 'relative', display: 'flex', gap: '0.75rem' }}>
          <div className="kx-search-wrapper" style={{ flex: 1 }}>
            <span className="kx-search-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </span>
            <input
              id="semantic-search-input"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask anything about your documents…"
              className="kx-search-input"
              style={{ fontSize: '1rem' }}
            />
          </div>
          <button
            id="search-submit-btn"
            type="submit"
            disabled={loading || !query.trim()}
            className="kx-btn kx-btn-primary"
            style={{ padding: '0 1.5rem' }}
          >
            {loading ? (
              <span className="kx-spinner" style={{ width: 18, height: 18, marginBottom: 0 }} />
            ) : (
              'Search'
            )}
          </button>
        </div>
      </form>

      {/* Suggestions */}
      {!searched && (
        <div className="kx-fade-in kx-fade-in-delay-2">
          <div style={{ fontSize: '0.8125rem', color: 'var(--kx-text-muted)', marginBottom: '0.75rem' }}>
            Try searching for:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {SUGGESTION_QUERIES.map((q) => (
              <button
                key={q}
                onClick={() => { setQuery(q); }}
                className="kx-tag"
                style={{ cursor: 'pointer', border: 'none' }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="kx-alert kx-alert-error kx-fade-in">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3 kx-fade-in">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="kx-card" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="kx-card-body" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div className="kx-skeleton" style={{ width: 44, height: 44, borderRadius: 'var(--kx-radius-md)', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div className="kx-skeleton" style={{ height: 14, width: '70%', marginBottom: 8 }} />
                  <div className="kx-skeleton" style={{ height: 12, width: '90%', marginBottom: 6 }} />
                  <div className="kx-skeleton" style={{ height: 12, width: '50%' }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {!loading && searched && results.length === 0 && !error && (
        <div className="kx-empty kx-fade-in">
          <div className="kx-empty-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </div>
          <div className="kx-empty-title">No results found</div>
          <div className="kx-empty-desc">
            Try different keywords or upload more documents related to your query.
          </div>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-3 kx-fade-in">
          <div style={{ fontSize: '0.8125rem', color: 'var(--kx-text-muted)' }}>
            Found <strong style={{ color: 'var(--kx-text)' }}>{results.length}</strong> result{results.length !== 1 ? 's' : ''} for "{query}"
          </div>
          {results.map((doc, i) => {
            const cat = doc.category || 'Uncategorized';
            const icon = CATEGORY_ICONS[cat] || '📄';
            return (
              <div
                key={doc.id}
                className="kx-card kx-fade-in"
                style={{ animationDelay: `${i * 40}ms`, cursor: 'default' }}
              >
                <div className="kx-card-body" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  {/* Icon */}
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 'var(--kx-radius-md)',
                      background: 'var(--kx-glass-active)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.375rem',
                      flexShrink: 0,
                    }}
                  >
                    {icon}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <div
                        style={{
                          fontFamily: 'var(--kx-font-display)',
                          fontWeight: 600,
                          color: 'var(--kx-text-bright)',
                          fontSize: '1rem',
                        }}
                      >
                        {doc.original_filename || doc.filename}
                      </div>
                      <span
                        style={{
                          fontSize: '0.6875rem',
                          fontWeight: 600,
                          padding: '3px 8px',
                          borderRadius: 'var(--kx-radius-full)',
                          background: 'rgba(99,102,241,0.12)',
                          color: 'var(--kx-indigo)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {cat}
                      </span>
                    </div>
                    {doc.extracted_text && (
                      <p
                        style={{
                          fontSize: '0.875rem',
                          color: 'var(--kx-text-secondary)',
                          marginTop: '0.375rem',
                          lineHeight: 1.5,
                          overflow: 'hidden',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {doc.extracted_text.slice(0, 240)}…
                      </p>
                    )}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        marginTop: '0.625rem',
                        fontSize: '0.75rem',
                        color: 'var(--kx-text-muted)',
                      }}
                    >
                      <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                      {doc.category_confidence && (
                        <span>Confidence: {Math.round(doc.category_confidence * 100)}%</span>
                      )}
                      {doc.storage_url && (
                        <a
                          href={doc.storage_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="kx-btn kx-btn-ghost kx-btn-sm"
                          style={{ marginLeft: 'auto' }}
                        >
                          View →
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
