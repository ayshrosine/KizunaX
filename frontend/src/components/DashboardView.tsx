import React, { useState, useEffect } from 'react';
import { apiClient, BackendDocument } from '../api';
import '../styles.css';

function StatCard({
  label,
  value,
  color,
  icon,
  delay = 0,
}: {
  label: string;
  value: number | string;
  color: 'indigo' | 'cyan' | 'emerald' | 'amber' | 'rose';
  icon: React.ReactNode;
  delay?: number;
}) {
  return (
    <div className={`stat-card ${color} kx-fade-in`} style={{ animationDelay: `${delay}ms` }}>
      <div className={`stat-icon ${color}`}>{icon}</div>
      <div className="stat-info">
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
      </div>
    </div>
  );
}

const CATEGORY_COLORS: Record<string, string> = {
  Projects: 'var(--kx-indigo)',
  Certifications: 'var(--kx-amber)',
  Internships: 'var(--kx-purple)',
  Achievements: 'var(--kx-cyan)',
  Academics: 'var(--kx-emerald)',
  Skills: 'var(--kx-sky)',
};

const CATEGORY_ICONS: Record<string, string> = {
  Projects: '🏗️',
  Certifications: '🎓',
  Internships: '💼',
  Achievements: '🏆',
  Academics: '📚',
  Skills: '⚡',
};

export default function DashboardView() {
  const [documents, setDocuments] = useState<BackendDocument[]>([]);
  const [timeline, setTimeline] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const user = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  })();

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [docs, timelineData] = await Promise.all([
        apiClient.getDocuments(50),
        apiClient.getTimeline(),
      ]);
      setDocuments(docs);
      setTimeline(timelineData);
    } catch (e: any) {
      setError(e.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const categoryCounts: Record<string, number> = {};
  documents.forEach((d) => {
    const cat = d.category || 'Uncategorized';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  const processedDocs = documents.filter((d) => d.status === 'processed').length;
  const pendingDocs = documents.filter((d) => d.status === 'pending' || d.status === 'processing').length;

  if (loading) {
    return (
      <div className="space-y-6 kx-fade-in">
        {/* Skeleton stats */}
        <div className="kx-grid kx-grid-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="stat-card" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="kx-skeleton" style={{ width: 44, height: 44, borderRadius: 'var(--kx-radius-md)' }} />
              <div className="stat-info">
                <div className="kx-skeleton" style={{ height: 12, width: '60%', marginBottom: 8 }} />
                <div className="kx-skeleton" style={{ height: 28, width: '40%' }} />
              </div>
            </div>
          ))}
        </div>
        {/* Skeleton cards */}
        <div className="kx-grid kx-grid-2">
          {[0, 1].map((i) => (
            <div key={i} className="kx-card">
              <div className="kx-card-header">
                <div className="kx-skeleton" style={{ height: 16, width: '40%' }} />
              </div>
              <div className="kx-card-body space-y-3">
                {[0, 1, 2, 3].map((j) => (
                  <div key={j} className="kx-skeleton" style={{ height: 14 }} />
                ))}
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
        <div className="kx-empty-title">Failed to load dashboard</div>
        <div className="kx-empty-desc">{error}</div>
        <button onClick={fetchData} className="kx-btn kx-btn-primary">Retry</button>
      </div>
    );
  }

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div
        className="kx-fade-in"
        style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.06))',
          border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: 'var(--kx-radius-xl)',
          padding: '1.75rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ fontSize: '0.875rem', color: 'var(--kx-text-muted)', marginBottom: '4px' }}>
            {greeting} 👋
          </div>
          <div
            style={{
              fontFamily: 'var(--kx-font-display)',
              fontSize: '1.5rem',
              fontWeight: 700,
              color: 'var(--kx-text-bright)',
            }}
          >
            {user.full_name || 'Welcome back'}
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--kx-text-secondary)', marginTop: '4px' }}>
            {documents.length === 0
              ? "You haven't uploaded any documents yet."
              : `You have ${documents.length} document${documents.length !== 1 ? 's' : ''} in your vault.`}
          </div>
        </div>
        {documents.length === 0 && (
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <div
              style={{
                background: 'var(--kx-gradient)',
                borderRadius: 'var(--kx-radius-md)',
                padding: '0.6rem 1.25rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'white',
                cursor: 'pointer',
                boxShadow: '0 2px 12px rgba(99,102,241,0.3)',
              }}
            >
              ↑ Upload First Document
            </div>
          </div>
        )}
      </div>

      {/* Stat Cards */}
      <div className="kx-grid kx-grid-4">
        <StatCard
          label="Total Documents"
          value={documents.length}
          color="indigo"
          delay={50}
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
            </svg>
          }
        />
        <StatCard
          label="Processed"
          value={processedDocs}
          color="emerald"
          delay={100}
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          }
        />
        <StatCard
          label="Categories"
          value={Object.keys(categoryCounts).length}
          color="amber"
          delay={150}
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
            </svg>
          }
        />
        <StatCard
          label="Timeline Events"
          value={timeline?.total_events || 0}
          color="cyan"
          delay={200}
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          }
        />
      </div>

      {/* Two-column layout */}
      <div className="kx-grid kx-grid-2">
        {/* Recent documents */}
        <div className="kx-card kx-fade-in kx-fade-in-delay-2">
          <div className="kx-card-header">
            <span className="kx-card-title">Recent Documents</span>
            {pendingDocs > 0 && (
              <span
                style={{
                  fontSize: '0.75rem',
                  background: 'rgba(245,158,11,0.15)',
                  color: 'var(--kx-amber)',
                  padding: '3px 8px',
                  borderRadius: 'var(--kx-radius-full)',
                  fontWeight: 600,
                }}
              >
                {pendingDocs} processing
              </span>
            )}
          </div>
          <div className="kx-card-body">
            {documents.length === 0 ? (
              <div className="text-center text-muted" style={{ padding: '2rem' }}>
                No documents yet
              </div>
            ) : (
              <div className="space-y-1">
                {documents.slice(0, 8).map((doc, i) => (
                  <div
                    key={doc.id}
                    className="kx-fade-in"
                    style={{
                      animationDelay: `${i * 40}ms`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.625rem 0.75rem',
                      borderRadius: 'var(--kx-radius-md)',
                      transition: 'var(--kx-transition)',
                      cursor: 'default',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--kx-glass)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 'var(--kx-radius-sm)',
                        background: `${CATEGORY_COLORS[doc.category || ''] || 'rgba(148,163,184,0.15)'}22`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.875rem',
                        flexShrink: 0,
                      }}
                    >
                      {CATEGORY_ICONS[doc.category || ''] || '📄'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="truncate" style={{ fontSize: '0.875rem', color: 'var(--kx-text)', fontWeight: 500 }}>
                        {doc.original_filename || doc.filename}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--kx-text-muted)' }}>
                        {doc.category || 'Uncategorized'} ·{' '}
                        {new Date(doc.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background:
                          doc.status === 'processed'
                            ? 'var(--kx-emerald)'
                            : doc.status === 'failed'
                            ? 'var(--kx-rose)'
                            : 'var(--kx-amber)',
                        flexShrink: 0,
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Category breakdown */}
        <div className="kx-card kx-fade-in kx-fade-in-delay-3">
          <div className="kx-card-header">
            <span className="kx-card-title">Category Breakdown</span>
          </div>
          <div className="kx-card-body">
            {Object.keys(categoryCounts).length === 0 ? (
              <div className="text-center text-muted" style={{ padding: '2rem' }}>
                Upload documents to see categories
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(categoryCounts)
                  .sort(([, a], [, b]) => b - a)
                  .map(([category, count], i) => {
                    const total = documents.length;
                    const pct = Math.round((count / total) * 100);
                    return (
                      <div key={category} className="kx-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                          <span style={{ fontSize: '0.875rem', color: 'var(--kx-text)', fontWeight: 500 }}>
                            {CATEGORY_ICONS[category] || '📄'} {category}
                          </span>
                          <span style={{ fontSize: '0.875rem', color: 'var(--kx-text-muted)' }}>
                            {count} · {pct}%
                          </span>
                        </div>
                        <div className="kx-progress">
                          <div
                            className="kx-progress-bar indigo"
                            style={{
                              width: `${pct}%`,
                              background: CATEGORY_COLORS[category] || 'var(--kx-gradient)',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Processing status indicator */}
      {pendingDocs > 0 && (
        <div className="kx-alert kx-alert-info kx-fade-in">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          {pendingDocs} document{pendingDocs !== 1 ? 's are' : ' is'} still being processed by the AI pipeline. Refresh to check status.
          <button
            onClick={fetchData}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              color: 'var(--kx-indigo)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.8125rem',
            }}
          >
            Refresh
          </button>
        </div>
      )}
    </div>
  );
}
