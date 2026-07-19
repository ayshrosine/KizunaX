import React, { useState, useEffect } from 'react';
import { apiClient, BackendSkill } from '../api';
import '../styles.css';

export default function InsightsView() {
  const [skills, setSkills] = useState<BackendSkill[]>([]);
  const [gaps, setGaps] = useState<any>(null);
  const [careerPaths, setCareerPaths] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'skills' | 'gaps' | 'careers'>('skills');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [skillsData, gapsData, pathsData] = await Promise.all([
        apiClient.getSkillsInsights(),
        apiClient.getSkillGaps(),
        apiClient.getCareerPaths(),
      ]);
      setSkills(skillsData);
      setGaps(gapsData);
      setCareerPaths(pathsData.paths || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load insights');
    } finally {
      setLoading(false);
    }
  };

  const topSkills = [...skills].sort((a, b) => (b.confidence_score || 0) - (a.confidence_score || 0)).slice(0, 15);
  const evidencedSkills = skills.filter((s) => s.has_evidence);
  const resumeSkills = skills.filter((s) => s.on_resume);

  if (loading) {
    return (
      <div className="space-y-6 kx-fade-in">
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {[0, 1, 2].map((i) => (
            <div key={i} className="kx-skeleton" style={{ height: 38, width: 120, borderRadius: 'var(--kx-radius-md)' }} />
          ))}
        </div>
        <div className="kx-grid kx-grid-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="kx-card" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="kx-card-body">
                <div className="kx-skeleton" style={{ height: 40, width: '50%', marginBottom: 8 }} />
                <div className="kx-skeleton" style={{ height: 12, width: '70%' }} />
              </div>
            </div>
          ))}
        </div>
        <div className="kx-card">
          <div className="kx-card-body space-y-4">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div className="kx-skeleton" style={{ height: 14, width: 120 }} />
                <div className="kx-skeleton" style={{ flex: 1, height: 8 }} />
                <div className="kx-skeleton" style={{ height: 14, width: 40 }} />
              </div>
            ))}
          </div>
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
        <div className="kx-empty-title">Failed to load insights</div>
        <div className="kx-empty-desc">{error}</div>
        <button onClick={fetchData} className="kx-btn kx-btn-primary">Retry</button>
      </div>
    );
  }

  if (skills.length === 0) {
    return (
      <div className="kx-empty kx-fade-in">
        <div className="kx-empty-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
          </svg>
        </div>
        <div className="kx-empty-title">No insights yet</div>
        <div className="kx-empty-desc">Upload documents so the AI can extract your skills and generate career insights.</div>
      </div>
    );
  }

  const tabs = [
    { id: 'skills', label: '⚡ Skills', count: skills.length },
    { id: 'gaps', label: '🎯 Skill Gaps', count: gaps?.total || 0 },
    { id: 'careers', label: '🚀 Career Paths', count: careerPaths.length },
  ] as const;

  return (
    <div className="space-y-5">
      {/* Summary stats */}
      <div className="kx-grid kx-grid-3 kx-fade-in">
        <div className="stat-card indigo">
          <div className="stat-icon indigo">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
          </div>
          <div className="stat-info">
            <div className="stat-label">Total Skills</div>
            <div className="stat-value">{skills.length}</div>
          </div>
        </div>
        <div className="stat-card emerald">
          <div className="stat-icon emerald">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <div className="stat-info">
            <div className="stat-label">With Evidence</div>
            <div className="stat-value">{evidencedSkills.length}</div>
          </div>
        </div>
        <div className="stat-card amber">
          <div className="stat-icon amber">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <div className="stat-info">
            <div className="stat-label">On Resume</div>
            <div className="stat-value">{resumeSkills.length}</div>
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div
        className="kx-fade-in kx-fade-in-delay-1"
        style={{
          display: 'flex',
          background: 'var(--kx-glass)',
          border: '1px solid var(--kx-border)',
          borderRadius: 'var(--kx-radius-lg)',
          padding: '4px',
          gap: '4px',
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: '0.625rem 1rem',
              borderRadius: 'var(--kx-radius-md)',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 500,
              fontFamily: 'var(--kx-font)',
              transition: 'var(--kx-transition)',
              background: activeTab === tab.id ? 'var(--kx-glass-active)' : 'transparent',
              color: activeTab === tab.id ? 'var(--kx-text-bright)' : 'var(--kx-text-muted)',
            }}
          >
            {tab.label}
            {tab.count > 0 && (
              <span
                style={{
                  marginLeft: '0.5rem',
                  fontSize: '0.75rem',
                  background: activeTab === tab.id ? 'rgba(99,102,241,0.2)' : 'var(--kx-glass)',
                  padding: '1px 6px',
                  borderRadius: 'var(--kx-radius-full)',
                }}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Skills Tab ── */}
      {activeTab === 'skills' && (
        <div className="kx-card kx-fade-in">
          <div className="kx-card-header">
            <span className="kx-card-title">Top Skills by Confidence</span>
          </div>
          <div className="kx-card-body">
            {topSkills.map((skill, i) => (
              <div
                key={skill.id}
                className="skill-bar kx-fade-in"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="skill-name truncate" title={skill.name}>
                  {skill.name}
                </div>
                <div className="skill-bar-track">
                  <div
                    className="skill-bar-fill"
                    style={{ width: `${Math.round((skill.confidence_score || 0) * 100)}%` }}
                  />
                </div>
                <div className="skill-score">
                  {Math.round((skill.confidence_score || 0) * 100)}
                </div>
                {skill.has_evidence && (
                  <span
                    title="Has documentary evidence"
                    style={{ fontSize: '0.875rem', flexShrink: 0 }}
                  >
                    ✅
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Gaps Tab ── */}
      {activeTab === 'gaps' && (
        <div className="space-y-4 kx-fade-in">
          {gaps?.total === 0 ? (
            <div className="kx-empty">
              <div className="kx-empty-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <div className="kx-empty-title">No skill gaps detected</div>
              <div className="kx-empty-desc">All detected skills have supporting evidence.</div>
            </div>
          ) : (
            <div className="kx-card">
              <div className="kx-card-header">
                <span className="kx-card-title">🎯 Skills Needing Evidence</span>
                <span style={{ fontSize: '0.8125rem', color: 'var(--kx-rose)' }}>
                  {gaps?.total - gaps?.with_evidence} unverified
                </span>
              </div>
              <div className="kx-card-body" style={{ padding: 0 }}>
                {(gaps?.skills || []).filter((s: BackendSkill) => !s.has_evidence).map((skill: BackendSkill, i: number) => (
                  <div
                    key={skill.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.875rem 1.25rem',
                      borderBottom: '1px solid var(--kx-border)',
                    }}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: 'var(--kx-amber)',
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, color: 'var(--kx-text-bright)', fontSize: '0.9375rem' }}>
                        {skill.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--kx-text-muted)' }}>
                        Detected but no document evidence
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        background: 'rgba(245,158,11,0.1)',
                        color: 'var(--kx-amber)',
                        padding: '3px 8px',
                        borderRadius: 'var(--kx-radius-full)',
                        fontWeight: 600,
                      }}
                    >
                      Unverified
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Careers Tab ── */}
      {activeTab === 'careers' && (
        <div className="space-y-4 kx-fade-in">
          {careerPaths.length === 0 ? (
            <div className="kx-empty">
              <div className="kx-empty-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              </div>
              <div className="kx-empty-title">No career paths yet</div>
              <div className="kx-empty-desc">Upload more documents to get AI career path recommendations.</div>
            </div>
          ) : (
            careerPaths.map((path: any, i: number) => (
              <div
                key={path.id || i}
                className="kx-card kx-fade-in"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="kx-card-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div
                      style={{
                        fontFamily: 'var(--kx-font-display)',
                        fontWeight: 700,
                        fontSize: '1.0625rem',
                        color: 'var(--kx-text-bright)',
                      }}
                    >
                      🚀 {path.title}
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--kx-font-display)',
                        fontWeight: 700,
                        fontSize: '1.25rem',
                        color: 'var(--kx-indigo)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {path.match}%
                    </div>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--kx-text-secondary)', marginBottom: '1rem', lineHeight: 1.5 }}>
                    {path.description}
                  </p>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 120 }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--kx-text-muted)', marginBottom: '4px' }}>Technical Skills</div>
                      <div className="kx-progress">
                        <div className="kx-progress-bar indigo" style={{ width: `${path.technicalSkills || 0}%` }} />
                      </div>
                    </div>
                    <div style={{ flex: 1, minWidth: 120 }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--kx-text-muted)', marginBottom: '4px' }}>Leadership</div>
                      <div className="kx-progress">
                        <div className="kx-progress-bar emerald" style={{ width: `${path.leadershipExperience || 0}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
