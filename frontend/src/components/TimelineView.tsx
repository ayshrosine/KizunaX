import React, { useState, useEffect } from 'react';
import { apiClient } from '../api';
import '../styles.css';

const DOT_COLORS: Record<string, string> = {
  Projects: 'indigo',
  Certifications: 'amber',
  Internships: 'cyan',
  Achievements: 'rose',
  Academics: 'emerald',
  Skills: 'cyan',
};

const CATEGORY_ICONS: Record<string, string> = {
  Projects: '🏗️', Certifications: '🎓', Internships: '💼',
  Achievements: '🏆', Academics: '📚', Skills: '⚡',
};

export default function TimelineView() {
  const [timeline, setTimeline] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState('All');

  useEffect(() => { fetchTimeline(); }, []);

  const fetchTimeline = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getTimeline();
      setTimeline(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load timeline');
    } finally {
      setLoading(false);
    }
  };

  const events: any[] = timeline?.events || [];
  const categories = ['All', ...Array.from(new Set(events.map((e) => e.category).filter(Boolean))) as string[]];

  const filtered = events.filter(
    (e) => filterCategory === 'All' || e.category === filterCategory
  );

  // Group by year
  const byYear: Record<number, any[]> = {};
  filtered.forEach((event) => {
    const year = event.year || new Date(event.created_at).getFullYear();
    byYear[year] = [...(byYear[year] || []), event];
  });
  const sortedYears = Object.keys(byYear)
    .map(Number)
    .sort((a, b) => b - a);

  if (loading) {
    return (
      <div className="space-y-6 kx-fade-in">
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="kx-skeleton" style={{ height: 30, width: 90, borderRadius: 'var(--kx-radius-full)' }} />
          ))}
        </div>
        <div className="timeline">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="timeline-item">
              <div className="timeline-dot" style={{ borderColor: 'var(--kx-border)' }} />
              <div className="timeline-content" style={{ width: '100%' }}>
                <div className="kx-skeleton" style={{ height: 14, width: '40%', marginBottom: 8 }} />
                <div className="kx-skeleton" style={{ height: 12, width: '70%' }} />
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
        <div className="kx-empty-title">Failed to load timeline</div>
        <div className="kx-empty-desc">{error}</div>
        <button onClick={fetchTimeline} className="kx-btn kx-btn-primary">Retry</button>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="kx-empty kx-fade-in">
        <div className="kx-empty-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>
        <div className="kx-empty-title">No timeline events yet</div>
        <div className="kx-empty-desc">
          Upload documents to automatically generate your career timeline.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="kx-fade-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 className="text-xl font-bold text-bright" style={{ marginBottom: '0.25rem' }}>Career Timeline</h2>
          <p className="text-secondary text-sm">
            {events.length} event{events.length !== 1 ? 's' : ''} across {sortedYears.length} year{sortedYears.length !== 1 ? 's' : ''}
          </p>
        </div>
        {/* Category filters */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`kx-tag${filterCategory === cat ? ' active' : ''}`}
              style={{ cursor: 'pointer', border: 'none' }}
            >
              {cat !== 'All' && CATEGORY_ICONS[cat] ? `${CATEGORY_ICONS[cat]} ` : ''}{cat}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline grouped by year */}
      <div className="space-y-8 kx-fade-in kx-fade-in-delay-1">
        {sortedYears.map((year) => (
          <div key={year}>
            {/* Year marker */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1rem',
                background: 'var(--kx-gradient)',
                padding: '4px 14px',
                borderRadius: 'var(--kx-radius-full)',
                fontFamily: 'var(--kx-font-display)',
                fontWeight: 700,
                fontSize: '0.875rem',
                color: 'white',
                boxShadow: '0 2px 12px rgba(99,102,241,0.3)',
              }}
            >
              {year}
            </div>

            <div className="timeline">
              {byYear[year].map((event, i) => {
                const dotColor = DOT_COLORS[event.category] || 'indigo';
                return (
                  <div
                    key={event.id || i}
                    className="timeline-item kx-fade-in"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <div className={`timeline-dot ${dotColor}`} />
                    <div className="timeline-content">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <div>
                          <div className="timeline-title">
                            {CATEGORY_ICONS[event.category] || '📄'} {event.title}
                          </div>
                          <div className="timeline-date">
                            {event.month
                              ? `${new Date(0, event.month - 1).toLocaleString('default', { month: 'long' })} ${year}`
                              : `${year}`}
                          </div>
                        </div>
                        {event.category && (
                          <span
                            style={{
                              fontSize: '0.6875rem',
                              fontWeight: 600,
                              padding: '3px 8px',
                              borderRadius: 'var(--kx-radius-full)',
                              background: 'var(--kx-glass-active)',
                              color: 'var(--kx-text-secondary)',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {event.category}
                          </span>
                        )}
                      </div>
                      {event.description && (
                        <p className="timeline-desc">{event.description}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
