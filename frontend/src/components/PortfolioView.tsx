import React, { useState, useEffect } from 'react';
import { apiClient } from '../api';
import '../styles.css';

const CATEGORIES = ['Projects', 'Certifications', 'Internships', 'Achievements', 'Academics', 'Skills'];

const THEMES = [
  { id: 'dark', label: '🌑 Dark', desc: 'Elegant dark theme' },
  { id: 'light', label: '☀️ Light', desc: 'Clean and minimal' },
  { id: 'gradient', label: '🌈 Gradient', desc: 'Vivid gradient accents' },
];

export default function PortfolioView() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);

  const [username, setUsername] = useState('');
  const [theme, setTheme] = useState('dark');
  const [visibleCats, setVisibleCats] = useState<string[]>(CATEGORIES);

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getPortfolioSettings();
      setSettings(data);
      setUsername(data.username || '');
      setTheme(data.theme || 'dark');
      setVisibleCats(data.visible_categories?.length ? data.visible_categories : CATEGORIES);
      if (data.is_published && data.username) {
        setPublishedUrl(`${window.location.origin}/p/${data.username}`);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await apiClient.updatePortfolioSettings({ username, theme, visible_categories: visibleCats });
      setSuccess('Portfolio settings saved!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (e: any) {
      setError(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!username) { setError('Set a username before publishing.'); return; }
    setPublishing(true);
    setError(null);
    try {
      const res = await apiClient.publishPortfolio();
      setPublishedUrl(res.url);
      setSuccess(`🎉 Portfolio published at ${res.url}`);
    } catch (e: any) {
      setError(e.message || 'Publish failed');
    } finally {
      setPublishing(false);
    }
  };

  const toggleCat = (cat: string) => {
    setVisibleCats((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  if (loading) {
    return (
      <div className="space-y-6 kx-fade-in">
        <div className="kx-skeleton" style={{ height: 200, borderRadius: 'var(--kx-radius-xl)' }} />
        <div className="kx-grid kx-grid-2">
          <div className="kx-skeleton" style={{ height: 160, borderRadius: 'var(--kx-radius-lg)' }} />
          <div className="kx-skeleton" style={{ height: 160, borderRadius: 'var(--kx-radius-lg)' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Published banner */}
      {settings?.is_published && publishedUrl && (
        <div className="kx-alert kx-alert-success kx-fade-in">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          Portfolio is live!{' '}
          <a href={publishedUrl} target="_blank" rel="noopener noreferrer"
            style={{ color: 'inherit', fontWeight: 600, marginLeft: '0.25rem' }}>
            {publishedUrl} →
          </a>
        </div>
      )}

      {error && (
        <div className="kx-alert kx-alert-error kx-fade-in">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </div>
      )}
      {success && (
        <div className="kx-alert kx-alert-success kx-fade-in">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          {success}
        </div>
      )}

      {/* Portfolio preview hero */}
      <div className="portfolio-preview kx-fade-in">
        <div className="portfolio-hero">
          <div
            style={{
              width: 72,
              height: 72,
              background: 'var(--kx-gradient)',
              borderRadius: 'var(--kx-radius-xl)',
              margin: '0 auto 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
            }}
          >
            💼
          </div>
          <h2 style={{ color: 'var(--kx-text-bright)' }}>
            {username ? `@${username}` : 'Your Portfolio'}
          </h2>
          <p style={{ color: 'var(--kx-text-muted)', fontSize: '0.9375rem', marginTop: '0.5rem' }}>
            {settings?.is_published ? 'Published & live' : 'Draft — not yet published'}
          </p>
        </div>
      </div>

      {/* Settings */}
      <div className="kx-grid kx-grid-2">
        {/* Username & theme */}
        <div className="kx-card kx-fade-in kx-fade-in-delay-1">
          <div className="kx-card-header">
            <span className="kx-card-title">Portfolio Settings</span>
          </div>
          <div className="kx-card-body space-y-4">
            <div>
              <label className="kx-label" htmlFor="portfolio-username">
                Username
              </label>
              <div style={{ position: 'relative' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: '0.875rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--kx-text-muted)',
                    fontSize: '0.875rem',
                    pointerEvents: 'none',
                  }}
                >
                  @
                </span>
                <input
                  id="portfolio-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/[^a-z0-9_-]/g, ''))}
                  placeholder="janedoe"
                  className="kx-input"
                  style={{ paddingLeft: '2rem' }}
                />
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--kx-text-muted)', marginTop: '0.25rem' }}>
                Only lowercase letters, numbers, _ and - allowed.
              </p>
            </div>

            <div>
              <label className="kx-label">Theme</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.625rem 0.875rem',
                      borderRadius: 'var(--kx-radius-md)',
                      border: `1px solid ${theme === t.id ? 'rgba(99,102,241,0.5)' : 'var(--kx-border)'}`,
                      background: theme === t.id ? 'rgba(99,102,241,0.08)' : 'var(--kx-glass)',
                      cursor: 'pointer',
                      color: theme === t.id ? 'var(--kx-text-bright)' : 'var(--kx-text-secondary)',
                      textAlign: 'left',
                      transition: 'var(--kx-transition)',
                    }}
                  >
                    <span style={{ fontSize: '1.125rem' }}>{t.label.split(' ')[0]}</span>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{t.label.split(' ').slice(1).join(' ')}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--kx-text-muted)' }}>{t.desc}</div>
                    </div>
                    {theme === t.id && (
                      <span style={{ marginLeft: 'auto', color: 'var(--kx-indigo)' }}>✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Visible categories */}
        <div className="kx-card kx-fade-in kx-fade-in-delay-2">
          <div className="kx-card-header">
            <span className="kx-card-title">Visible Categories</span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--kx-text-muted)' }}>
              {visibleCats.length}/{CATEGORIES.length}
            </span>
          </div>
          <div className="kx-card-body">
            <p style={{ fontSize: '0.875rem', color: 'var(--kx-text-secondary)', marginBottom: '1rem' }}>
              Choose which document types appear on your public portfolio.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {CATEGORIES.map((cat) => {
                const selected = visibleCats.includes(cat);
                return (
                  <button
                    key={cat}
                    id={`portfolio-cat-${cat.toLowerCase()}`}
                    onClick={() => toggleCat(cat)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.625rem 0.875rem',
                      borderRadius: 'var(--kx-radius-md)',
                      border: `1px solid ${selected ? 'rgba(99,102,241,0.3)' : 'var(--kx-border)'}`,
                      background: selected ? 'rgba(99,102,241,0.06)' : 'var(--kx-glass)',
                      cursor: 'pointer',
                      color: 'var(--kx-text)',
                      fontFamily: 'var(--kx-font)',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      transition: 'var(--kx-transition)',
                    }}
                  >
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: '4px',
                        border: `2px solid ${selected ? 'var(--kx-indigo)' : 'var(--kx-border)'}`,
                        background: selected ? 'var(--kx-indigo)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        transition: 'var(--kx-transition)',
                      }}
                    >
                      {selected && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                    </div>
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div
        className="kx-fade-in"
        style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}
      >
        <button
          id="portfolio-save-btn"
          onClick={handleSave}
          disabled={saving}
          className="kx-btn kx-btn-ghost"
          style={{ minWidth: 140 }}
        >
          {saving ? (
            <><span className="kx-spinner" style={{ width: 16, height: 16, marginBottom: 0 }} /> Saving…</>
          ) : '💾 Save Settings'}
        </button>
        <button
          id="portfolio-publish-btn"
          onClick={handlePublish}
          disabled={publishing || !username}
          className="kx-btn kx-btn-primary"
          style={{ minWidth: 160 }}
        >
          {publishing ? (
            <><span className="kx-spinner" style={{ width: 16, height: 16, marginBottom: 0 }} /> Publishing…</>
          ) : settings?.is_published ? '🔄 Republish' : '🚀 Publish Portfolio'}
        </button>
      </div>
    </div>
  );
}
