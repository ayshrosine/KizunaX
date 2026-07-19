import React from 'react';
import '../styles.css';

interface HeaderProps {
  currentView: string;
  onViewChange: (view: string) => void;
  onLogout: () => void;
}

const viewTitles: Record<string, { title: string; description: string }> = {
  dashboard: { title: 'Dashboard', description: 'Your identity at a glance' },
  library: { title: 'Document Library', description: 'All your documents' },
  ingestion: { title: 'Upload Documents', description: 'Add files to your vault' },
  search: { title: 'Semantic Search', description: 'AI-powered document discovery' },
  timeline: { title: 'Career Timeline', description: 'Your journey through time' },
  graph: { title: 'Relationship Graph', description: 'See how everything connects' },
  insights: { title: 'AI Insights', description: 'Skill gaps and career paths' },
  portfolio: { title: 'Public Portfolio', description: 'Share your achievements' },
  settings: { title: 'Settings', description: 'Integrations and preferences' },
};

export default function Header({ currentView, onViewChange, onLogout }: HeaderProps) {
  const view = viewTitles[currentView] || { title: 'KizunaX', description: '' };
  const user = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  })();
  const initials = user.full_name
    ? user.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <header className="header">
      {/* Left: title */}
      <div>
        <h1 className="header-title">{view.title}</h1>
        {view.description && (
          <p style={{ fontSize: '0.75rem', color: 'var(--kx-text-muted)', marginTop: '1px' }}>
            {view.description}
          </p>
        )}
      </div>

      {/* Right: actions */}
      <div className="header-actions">
        {/* Quick search */}
        <button
          id="header-search-btn"
          className="header-btn"
          onClick={() => onViewChange('search')}
          title="Search"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </button>

        {/* Upload */}
        <button
          id="header-upload-btn"
          className="header-btn"
          onClick={() => onViewChange('ingestion')}
          title="Upload document"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
        </button>

        {/* Divider */}
        <div style={{ width: '1px', height: '24px', background: 'var(--kx-border)' }} />

        {/* User avatar */}
        <div
          style={{
            width: '34px',
            height: '34px',
            borderRadius: 'var(--kx-radius-md)',
            background: 'var(--kx-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.8125rem',
            fontWeight: '700',
            color: 'white',
            cursor: 'default',
          }}
          title={user.full_name || user.email || ''}
        >
          {initials}
        </div>

        {/* Logout */}
        <button
          id="header-logout-btn"
          className="header-btn danger"
          onClick={onLogout}
          title="Sign out"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>
    </header>
  );
}
