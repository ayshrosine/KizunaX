import React, { useState, useEffect } from 'react';
import { apiClient, IntegrationStatus } from '../api';
import '../styles.css';

interface IntegrationCardProps {
  provider: 'google' | 'notion';
  status?: IntegrationStatus;
  onConnect: () => void;
  onDisconnect: () => void;
  onResync: () => void;
  loading: boolean;
}

function IntegrationCard({ provider, status, onConnect, onDisconnect, onResync, loading }: IntegrationCardProps) {
  const connected = status?.status === 'connected' || status?.status === 'active';
  const isGoogle = provider === 'google';

  return (
    <div className="settings-integration">
      {/* Icon */}
      <div className={`settings-integration-icon ${isGoogle ? 'gdrive' : 'notion'}`}>
        {isGoogle ? (
          <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
            <path fill="#4285F4" d="M6.28 10.34L3.22 5 0 10.34h6.28z"/>
            <path fill="#00AC47" d="M9.71 17l3.07-5.33H3.22L0 17h9.71z"/>
            <path fill="#FFBA00" d="M15.99 5H9.71L6.28 10.34h6.28L15.99 5z"/>
            <path fill="#FF6F00" d="M15.99 5l3.22 5.34H12.8L9.71 17l3.28 5.34 9.65-16.68L15.99 5z"/>
            <path fill="#00832D" d="M13 22.34L9.71 17H0l3.22 5.34H13z"/>
          </svg>
        ) : (
          <svg viewBox="0 0 100 100" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
            <rect width="100" height="100" rx="16" fill="white"/>
            <path d="M29.5 17.5c0-6.6 5.4-12 12-12s12 5.4 12 12v16h-12c-6.6 0-12-5.4-12-12zM17.5 29.5c6.6 0 12 5.4 12 12s-5.4 12-12 12H7.5v-12c0-6.6 5.4-12 12-12z" fill="#000"/>
            <path d="M29.5 82.5c0 6.6 5.4 12 12 12s12-5.4 12-12v-16h-12c-6.6 0-12 5.4-12 12zM82.5 70.5c-6.6 0-12-5.4-12-12s5.4-12 12-12h10v12c0 6.6-5.4 12-12 12z" fill="#000"/>
          </svg>
        )}
      </div>

      {/* Info */}
      <div className="settings-integration-info">
        <div className="settings-integration-name">
          {isGoogle ? 'Google Drive' : 'Notion'}
        </div>
        <div className={`settings-integration-status${connected ? ' connected' : ''}`}>
          {connected
            ? `✓ Connected${status?.workspace_name ? ` — ${status.workspace_name}` : ''}`
            : 'Not connected'}
        </div>
        {connected && status?.last_synced_at && (
          <div style={{ fontSize: '0.75rem', color: 'var(--kx-text-muted)', marginTop: '2px' }}>
            Last synced: {new Date(status.last_synced_at).toLocaleDateString()}
          </div>
        )}
        {status?.last_error && (
          <div style={{ fontSize: '0.75rem', color: 'var(--kx-rose)', marginTop: '2px' }}>
            ⚠ {status.last_error}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="settings-integration-actions">
        {connected ? (
          <>
            <button
              id={`resync-${provider}-btn`}
              onClick={onResync}
              disabled={loading}
              className="kx-btn kx-btn-ghost kx-btn-sm"
            >
              {loading ? '…' : '🔄 Resync'}
            </button>
            <button
              id={`disconnect-${provider}-btn`}
              onClick={onDisconnect}
              disabled={loading}
              className="kx-btn kx-btn-danger kx-btn-sm"
            >
              Disconnect
            </button>
          </>
        ) : (
          <button
            id={`connect-${provider}-btn`}
            onClick={onConnect}
            disabled={loading}
            className="kx-btn kx-btn-primary kx-btn-sm"
          >
            {loading ? (
              <><span className="kx-spinner" style={{ width: 14, height: 14, marginBottom: 0 }} /> Connecting…</>
            ) : (
              `Connect ${isGoogle ? 'Drive' : 'Notion'}`
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export default function SettingsView() {
  const [statuses, setStatuses] = useState<IntegrationStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => { fetchStatuses(); }, []);

  const fetchStatuses = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getIntegrationStatuses();
      setStatuses(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load integration status');
    } finally {
      setLoading(false);
    }
  };

  const getStatus = (provider: string) =>
    statuses.find((s) => s.provider === provider);

  const setProviderLoading = (provider: string, val: boolean) =>
    setActionLoading((prev) => ({ ...prev, [provider]: val }));

  const handleConnect = async (provider: 'google' | 'notion') => {
    setError(null);
    setProviderLoading(provider, true);
    try {
      const res =
        provider === 'google'
          ? await apiClient.getGoogleAuthUrl()
          : await apiClient.getNotionAuthUrl();
      window.location.href = (res as any).authUrl || (res as any).auth_url;
    } catch (e: any) {
      setError(e.message || 'Failed to start OAuth flow');
      setProviderLoading(provider, false);
    }
  };

  const handleDisconnect = async (provider: 'google' | 'notion') => {
    if (!confirm(`Disconnect ${provider === 'google' ? 'Google Drive' : 'Notion'}?`)) return;
    setError(null);
    setProviderLoading(provider, true);
    try {
      await apiClient.disconnectIntegration(provider);
      await fetchStatuses();
      setSuccess(`${provider === 'google' ? 'Google Drive' : 'Notion'} disconnected.`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (e: any) {
      setError(e.message || 'Disconnect failed');
    } finally {
      setProviderLoading(provider, false);
    }
  };

  const handleResync = async (provider: 'google' | 'notion') => {
    setError(null);
    setProviderLoading(provider, true);
    try {
      await apiClient.resyncIntegration(provider);
      setSuccess(`Resync of ${provider === 'google' ? 'Google Drive' : 'Notion'} started — check your library in a few minutes.`);
      setTimeout(() => setSuccess(null), 5000);
    } catch (e: any) {
      setError(e.message || 'Resync failed');
    } finally {
      setProviderLoading(provider, false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="kx-fade-in">
        <h2 className="text-xl font-bold text-bright" style={{ marginBottom: '0.5rem' }}>
          Integrations
        </h2>
        <p className="text-secondary" style={{ fontSize: '0.9375rem' }}>
          Connect cloud services to mirror your documents. Syncs are one-way: KizunaX → Cloud.
        </p>
      </div>

      {/* Alerts */}
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

      {/* Integration cards */}
      {loading ? (
        <div className="space-y-3 kx-fade-in">
          {[0, 1].map((i) => (
            <div key={i} className="settings-integration">
              <div className="kx-skeleton" style={{ width: 48, height: 48, borderRadius: 'var(--kx-radius-md)' }} />
              <div style={{ flex: 1 }}>
                <div className="kx-skeleton" style={{ height: 14, width: '40%', marginBottom: 8 }} />
                <div className="kx-skeleton" style={{ height: 12, width: '60%' }} />
              </div>
              <div className="kx-skeleton" style={{ height: 34, width: 120, borderRadius: 'var(--kx-radius-md)' }} />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3 kx-fade-in kx-fade-in-delay-1">
          <IntegrationCard
            provider="google"
            status={getStatus('google')}
            onConnect={() => handleConnect('google')}
            onDisconnect={() => handleDisconnect('google')}
            onResync={() => handleResync('google')}
            loading={!!actionLoading['google']}
          />
          <IntegrationCard
            provider="notion"
            status={getStatus('notion')}
            onConnect={() => handleConnect('notion')}
            onDisconnect={() => handleDisconnect('notion')}
            onResync={() => handleResync('notion')}
            loading={!!actionLoading['notion']}
          />
        </div>
      )}

      {/* How it works */}
      <div className="kx-card kx-fade-in kx-fade-in-delay-2">
        <div className="kx-card-header">
          <span className="kx-card-title">📖 How Cloud Mirror Works</span>
        </div>
        <div className="kx-card-body">
          <div className="kx-grid kx-grid-3" style={{ gap: '1.5rem' }}>
            {[
              {
                icon: '⬆️',
                title: 'Upload',
                desc: 'You upload a document to KizunaX — it\'s processed and categorized by the AI pipeline.',
              },
              {
                icon: '🤖',
                title: 'Auto-Push',
                desc: 'On processing completion, the document is automatically mirrored to connected services.',
              },
              {
                icon: '📂',
                title: 'Organized',
                desc: 'In Google Drive, files land in per-category folders. In Notion, they appear as rich pages.',
              },
            ].map((item) => (
              <div key={item.title} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{item.icon}</div>
                <div style={{ fontWeight: 600, color: 'var(--kx-text-bright)', marginBottom: '0.375rem' }}>{item.title}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--kx-text-secondary)', lineHeight: 1.5 }}>{item.desc}</div>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: '1.5rem',
              padding: '1rem',
              background: 'rgba(99,102,241,0.06)',
              border: '1px solid rgba(99,102,241,0.15)',
              borderRadius: 'var(--kx-radius-md)',
              fontSize: '0.8125rem',
              color: 'var(--kx-text-secondary)',
              lineHeight: 1.6,
            }}
          >
            <strong style={{ color: 'var(--kx-indigo)' }}>One-way sync only.</strong>{' '}
            Changes made in Google Drive or Notion are not synced back to KizunaX. Deleting a document in KizunaX does not remove it from connected services.
          </div>
        </div>
      </div>
    </div>
  );
}
