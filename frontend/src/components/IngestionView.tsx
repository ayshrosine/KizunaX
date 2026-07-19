import React, { useState, useCallback } from 'react';
import { apiClient } from '../api';
import '../styles.css';

type UploadStatus = 'idle' | 'uploading' | 'processing' | 'done' | 'error';

interface UploadedItem {
  id: string;
  filename: string;
  status: UploadStatus;
  category?: string;
  message?: string;
}

export default function IngestionView() {
  const [dragging, setDragging] = useState(false);
  const [queue, setQueue] = useState<UploadedItem[]>([]);

  const processFile = async (file: File) => {
    const tempId = `${Date.now()}-${Math.random()}`;

    setQueue((prev) => [
      { id: tempId, filename: file.name, status: 'uploading' },
      ...prev,
    ]);

    try {
      const res = await apiClient.uploadDocument(file);

      setQueue((prev) =>
        prev.map((item) =>
          item.id === tempId
            ? { ...item, id: res.id, status: 'processing', message: 'AI pipeline running…' }
            : item
        )
      );

      // Poll for completion
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        try {
          const statusRes = await apiClient.getDocumentStatus(res.id);
          if (statusRes.status === 'processed') {
            clearInterval(poll);
            setQueue((prev) =>
              prev.map((item) =>
                item.id === res.id
                  ? { ...item, status: 'done', category: statusRes.category || 'Uncategorized', message: '' }
                  : item
              )
            );
          } else if (statusRes.status === 'failed') {
            clearInterval(poll);
            setQueue((prev) =>
              prev.map((item) =>
                item.id === res.id ? { ...item, status: 'error', message: 'Processing failed' } : item
              )
            );
          }
        } catch {/* keep polling */}
        if (attempts >= 40) {
          clearInterval(poll);
          setQueue((prev) =>
            prev.map((item) =>
              item.id === res.id
                ? { ...item, status: 'done', message: 'Status unknown — check Library' }
                : item
            )
          );
        }
      }, 3000);
    } catch (e: any) {
      setQueue((prev) =>
        prev.map((item) =>
          item.id === tempId
            ? { ...item, status: 'error', message: e.message || 'Upload failed' }
            : item
        )
      );
    }
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(processFile);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  const statusConfig = {
    idle: { icon: null, color: 'var(--kx-text-muted)', label: '' },
    uploading: { icon: '⬆️', color: 'var(--kx-indigo)', label: 'Uploading…' },
    processing: { icon: '🤖', color: 'var(--kx-amber)', label: 'Processing…' },
    done: { icon: '✅', color: 'var(--kx-emerald)', label: 'Done' },
    error: { icon: '❌', color: 'var(--kx-rose)', label: 'Error' },
  };

  return (
    <div className="space-y-6">
      {/* Hero header */}
      <div className="kx-fade-in">
        <h2 className="text-xl font-bold text-bright" style={{ marginBottom: '0.5rem' }}>
          Upload Documents
        </h2>
        <p className="text-secondary" style={{ fontSize: '0.9375rem' }}>
          Drop files below — the AI pipeline will extract text, categorize, and embed them automatically.
        </p>
      </div>

      {/* Supported types */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {['PDF', 'DOCX', 'TXT', 'PNG', 'JPG', 'JPEG'].map((ext) => (
          <span key={ext} className="kx-tag" style={{ fontWeight: 600 }}>
            .{ext.toLowerCase()}
          </span>
        ))}
      </div>

      {/* Drop Zone */}
      <div
        id="upload-dropzone"
        className={`kx-dropzone kx-fade-in${dragging ? ' active' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <div className="kx-dropzone-content">
          <div className="kx-dropzone-icon">
            {dragging ? (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="7 13 12 18 17 13"/><line x1="12" y1="18" x2="12" y2="6"/>
              </svg>
            ) : (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            )}
          </div>
          <div
            style={{
              fontFamily: 'var(--kx-font-display)',
              fontSize: '1.125rem',
              fontWeight: 600,
              color: 'var(--kx-text-bright)',
              marginBottom: '0.5rem',
            }}
          >
            {dragging ? 'Drop files here' : 'Drag & drop files'}
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--kx-text-muted)', marginBottom: '1.25rem' }}>
            or click to browse your computer
          </p>
          <button
            className="kx-btn kx-btn-primary"
            onClick={(e) => { e.stopPropagation(); document.getElementById('file-input')?.click(); }}
          >
            Browse Files
          </button>
        </div>
        <input
          id="file-input"
          type="file"
          style={{ display: 'none' }}
          multiple
          accept=".pdf,.docx,.txt,.png,.jpg,.jpeg"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {/* AI Pipeline steps */}
      <div className="kx-card kx-fade-in kx-fade-in-delay-1">
        <div className="kx-card-header">
          <span className="kx-card-title">🤖 AI Ingestion Pipeline</span>
        </div>
        <div className="kx-card-body">
          <div style={{ display: 'flex', gap: '0', flexWrap: 'wrap' }}>
            {[
              { step: '1', label: 'File Upload', desc: 'Secure upload to R2 storage', icon: '⬆️' },
              { step: '2', label: 'Text Extraction', desc: 'OCR + native text parsing', icon: '📑' },
              { step: '3', label: 'AI Categorization', desc: 'GPT-4 classifies document type', icon: '🧠' },
              { step: '4', label: 'Embedding', desc: 'Vector stored in ChromaDB', icon: '🔮' },
              { step: '5', label: 'Relationships', desc: 'Links to skills & other docs', icon: '🕸️' },
            ].map((s, i) => (
              <div
                key={s.step}
                style={{
                  flex: 1,
                  minWidth: 120,
                  padding: '0.875rem 0.75rem',
                  borderRight: i < 4 ? '1px solid var(--kx-border)' : 'none',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '1.375rem', marginBottom: '0.375rem' }}>{s.icon}</div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--kx-text-bright)', marginBottom: '2px' }}>
                  {s.label}
                </div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--kx-text-muted)', lineHeight: 1.4 }}>
                  {s.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upload Queue */}
      {queue.length > 0 && (
        <div className="kx-card kx-fade-in">
          <div className="kx-card-header">
            <span className="kx-card-title">Upload Queue</span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--kx-text-muted)' }}>
              {queue.filter((q) => q.status === 'done').length}/{queue.length} complete
            </span>
          </div>
          <div className="kx-card-body" style={{ padding: 0 }}>
            {queue.map((item, i) => {
              const cfg = statusConfig[item.status];
              return (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.875rem',
                    padding: '0.875rem 1.25rem',
                    borderBottom: i < queue.length - 1 ? '1px solid var(--kx-border)' : 'none',
                  }}
                >
                  <span style={{ fontSize: '1.25rem' }}>
                    {cfg.icon || '📄'}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="truncate" style={{ fontWeight: 500, color: 'var(--kx-text-bright)', fontSize: '0.9375rem' }}>
                      {item.filename}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: cfg.color }}>
                      {item.status === 'done'
                        ? `✓ ${item.category || 'Categorized'}`
                        : item.message || cfg.label}
                    </div>
                  </div>
                  {/* Animated progress bar for uploading/processing */}
                  {(item.status === 'uploading' || item.status === 'processing') && (
                    <div style={{ width: 80, height: 4, background: 'var(--kx-glass-active)', borderRadius: 'var(--kx-radius-full)', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          borderRadius: 'var(--kx-radius-full)',
                          background: 'var(--kx-gradient)',
                          animation: 'kx-shimmer 1.5s infinite',
                          backgroundSize: '200% 100%',
                          width: '60%',
                        }}
                      />
                    </div>
                  )}
                  {/* Status dot */}
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: cfg.color,
                      flexShrink: 0,
                      boxShadow: `0 0 8px ${cfg.color}`,
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
