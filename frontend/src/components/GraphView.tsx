import React, { useState, useEffect, useRef, useCallback } from 'react';
import { apiClient, BackendRelationship } from '../api';
import '../styles.css';

interface GraphNode {
  id: string;
  label: string;
  type: string;
  category?: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface GraphEdge {
  source: string;
  target: string;
  type: string;
  strength: number;
}

const NODE_COLORS: Record<string, string> = {
  document:    '#6366f1',
  skill:       '#10b981',
  certificate: '#f59e0b',
  internship:  '#a855f7',
  project:     '#06b6d4',
  achievement: '#f43f5e',
};

const NODE_RADIUS = 28;
const W = 800;
const H = 520;

function forceTick(nodes: GraphNode[], edges: GraphEdge[], alpha: number): GraphNode[] {
  // Repulsion
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[j].x - nodes[i].x;
      const dy = nodes[j].y - nodes[i].y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = (3000 / (dist * dist)) * alpha;
      nodes[i].vx -= (dx / dist) * force;
      nodes[i].vy -= (dy / dist) * force;
      nodes[j].vx += (dx / dist) * force;
      nodes[j].vy += (dy / dist) * force;
    }
  }
  // Attraction (edges)
  edges.forEach((e) => {
    const src = nodes.find((n) => n.id === e.source);
    const tgt = nodes.find((n) => n.id === e.target);
    if (!src || !tgt) return;
    const dx = tgt.x - src.x;
    const dy = tgt.y - src.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const desired = 160;
    const force = ((dist - desired) / dist) * 0.04 * alpha * e.strength;
    src.vx += dx * force;
    src.vy += dy * force;
    tgt.vx -= dx * force;
    tgt.vy -= dy * force;
  });
  // Center gravity
  nodes.forEach((n) => {
    n.vx += (W / 2 - n.x) * 0.008 * alpha;
    n.vy += (H / 2 - n.y) * 0.008 * alpha;
    // Damping
    n.vx *= 0.85;
    n.vy *= 0.85;
    n.x += n.vx;
    n.y += n.vy;
    // Boundary
    n.x = Math.max(NODE_RADIUS + 10, Math.min(W - NODE_RADIUS - 10, n.x));
    n.y = Math.max(NODE_RADIUS + 10, Math.min(H - NODE_RADIUS - 10, n.y));
  });
  return [...nodes];
}

export default function GraphView() {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const frameRef = useRef<number>(0);
  const alphaRef = useRef(1);
  const nodesRef = useRef<GraphNode[]>([]);

  useEffect(() => { fetchGraph(); return () => cancelAnimationFrame(frameRef.current); }, []);

  const fetchGraph = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getGraph();
      const rawNodes = data.nodes || [];
      const rawEdges = data.edges || [];

      // Map raw nodes to simulation nodes with x, y coordinates
      const simulatedNodes = rawNodes.map((n: any) => ({
        id: n.id,
        label: n.label,
        type: n.type,
        category: n.category,
        x: W / 2 + (Math.random() - 0.5) * 300,
        y: H / 2 + (Math.random() - 0.5) * 250,
        vx: 0,
        vy: 0,
      }));

      const simulatedEdges = rawEdges.map((e: any) => ({
        source: e.source,
        target: e.target,
        type: e.type,
        strength: e.strength || 0.5,
      }));

      nodesRef.current = simulatedNodes;
      setNodes(simulatedNodes);
      setEdges(simulatedEdges);

      // Run simulation
      alphaRef.current = 1;
      const tick = () => {
        if (alphaRef.current < 0.01) return;
        nodesRef.current = forceTick(nodesRef.current, simulatedEdges, alphaRef.current);
        setNodes([...nodesRef.current]);
        alphaRef.current *= 0.97;
        frameRef.current = requestAnimationFrame(tick);
      };
      frameRef.current = requestAnimationFrame(tick);
    } catch (e: any) {
      setError(e.message || 'Failed to load graph');
    } finally {
      setLoading(false);
    }
  };

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setDragging(nodeId);
    cancelAnimationFrame(frameRef.current);
    alphaRef.current = 0;
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = W / rect.width;
    const scaleY = H / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    nodesRef.current = nodesRef.current.map((n) =>
      n.id === dragging ? { ...n, x, y, vx: 0, vy: 0 } : n
    );
    setNodes([...nodesRef.current]);
  }, [dragging]);

  const handleMouseUp = () => {
    if (dragging) {
      setDragging(null);
      // Resume simulation briefly
      alphaRef.current = 0.3;
      const tick = () => {
        if (alphaRef.current < 0.005) return;
        nodesRef.current = forceTick(nodesRef.current, edges, alphaRef.current);
        setNodes([...nodesRef.current]);
        alphaRef.current *= 0.95;
        frameRef.current = requestAnimationFrame(tick);
      };
      frameRef.current = requestAnimationFrame(tick);
    }
  };

  const relTypeCounts: Record<string, number> = {};
  edges.forEach((e) => {
    relTypeCounts[e.type] = (relTypeCounts[e.type] || 0) + 1;
  });

  if (loading) {
    return (
      <div className="space-y-4 kx-fade-in">
        <div className="kx-skeleton" style={{ height: 520, borderRadius: 'var(--kx-radius-xl)' }} />
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
        <div className="kx-empty-title">Failed to load graph</div>
        <div className="kx-empty-desc">{error}</div>
        <button onClick={fetchGraph} className="kx-btn kx-btn-primary">Retry</button>
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className="kx-empty kx-fade-in">
        <div className="kx-empty-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
        </div>
        <div className="kx-empty-title">No relationships yet</div>
        <div className="kx-empty-desc">
          Upload and process documents to build your relationship graph.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 kx-fade-in">
      {/* Stats row */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        {[
          { label: 'Nodes', value: nodes.length, color: 'var(--kx-indigo)' },
          { label: 'Edges', value: edges.length, color: 'var(--kx-violet)' },
          { label: 'Rel. Types', value: Object.keys(relTypeCounts).length, color: 'var(--kx-cyan)' },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: 'var(--kx-glass)',
              border: '1px solid var(--kx-border)',
              borderRadius: 'var(--kx-radius-lg)',
              padding: '0.75rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}
          >
            <div style={{ fontFamily: 'var(--kx-font-display)', fontSize: '1.5rem', fontWeight: 700, color: s.color }}>
              {s.value}
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--kx-text-muted)' }}>{s.label}</div>
          </div>
        ))}
        <div
          style={{
            marginLeft: 'auto',
            fontSize: '0.8125rem',
            color: 'var(--kx-text-muted)',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          Drag nodes to explore
        </div>
      </div>

      {/* SVG Graph */}
      <div
        style={{
          background: 'var(--kx-glass)',
          border: '1px solid var(--kx-glass-border)',
          borderRadius: 'var(--kx-radius-xl)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          style={{ width: '100%', height: 520, cursor: dragging ? 'grabbing' : 'default' }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <defs>
            <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="rgba(255,255,255,0.15)" />
            </marker>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>

          {/* Grid */}
          <g opacity={0.04}>
            {Array.from({ length: Math.floor(W / 40) + 1 }).map((_, i) => (
              <line key={`v${i}`} x1={i * 40} y1={0} x2={i * 40} y2={H} stroke="white" strokeWidth={1}/>
            ))}
            {Array.from({ length: Math.floor(H / 40) + 1 }).map((_, i) => (
              <line key={`h${i}`} x1={0} y1={i * 40} x2={W} y2={i * 40} stroke="white" strokeWidth={1}/>
            ))}
          </g>

          {/* Edges */}
          {edges.map((e, i) => {
            const src = nodes.find((n) => n.id === e.source);
            const tgt = nodes.find((n) => n.id === e.target);
            if (!src || !tgt) return null;
            const isSelected = selectedNode && (selectedNode.id === src.id || selectedNode.id === tgt.id);
            return (
              <line
                key={i}
                x1={src.x}
                y1={src.y}
                x2={tgt.x}
                y2={tgt.y}
                stroke={isSelected ? 'rgba(99,102,241,0.6)' : 'rgba(255,255,255,0.08)'}
                strokeWidth={isSelected ? 1.5 : 1}
                markerEnd="url(#arrowhead)"
                style={{ transition: 'stroke 0.2s ease' }}
              />
            );
          })}

          {/* Nodes */}
          {nodes.map((node) => {
            const color = NODE_COLORS[node.type] || '#6366f1';
            const isSelected = selectedNode?.id === node.id;
            return (
              <g
                key={node.id}
                style={{ cursor: 'grab' }}
                onMouseDown={(e) => handleMouseDown(e, node.id)}
                onClick={() => setSelectedNode(isSelected ? null : node)}
              >
                {/* Glow ring for selected */}
                {isSelected && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={NODE_RADIUS + 8}
                    fill="none"
                    stroke={color}
                    strokeWidth={2}
                    opacity={0.4}
                    filter="url(#glow)"
                  />
                )}
                {/* Node circle */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={NODE_RADIUS}
                  fill={`${color}22`}
                  stroke={color}
                  strokeWidth={isSelected ? 2 : 1.5}
                />
                {/* Label */}
                <text
                  x={node.x}
                  y={node.y + 4}
                  textAnchor="middle"
                  fill="white"
                  fontSize={9}
                  fontFamily="Inter, sans-serif"
                  fontWeight={500}
                >
                  {node.label.length > 12 ? node.label.slice(0, 12) + '…' : node.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Selected node detail */}
        {selectedNode && (
          <div
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'var(--kx-surface-raised)',
              border: '1px solid var(--kx-border)',
              borderRadius: 'var(--kx-radius-lg)',
              padding: '1rem',
              minWidth: 200,
              backdropFilter: 'blur(12px)',
            }}
          >
            <div style={{ fontWeight: 600, color: 'var(--kx-text-bright)', marginBottom: '0.375rem' }}>
              {selectedNode.label}
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--kx-text-muted)', marginBottom: '0.5rem' }}>
              Type: <strong style={{ color: 'var(--kx-text)' }}>{selectedNode.type}</strong>
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--kx-text-muted)' }}>
              Connected to:{' '}
              <strong style={{ color: 'var(--kx-text)' }}>
                {edges.filter((e) => e.source === selectedNode.id || e.target === selectedNode.id).length} node{edges.filter((e) => e.source === selectedNode.id || e.target === selectedNode.id).length !== 1 ? 's' : ''}
              </strong>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              style={{ marginTop: '0.75rem', background: 'none', border: 'none', color: 'var(--kx-text-muted)', cursor: 'pointer', fontSize: '0.75rem' }}
            >
              ✕ Dismiss
            </button>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="kx-card kx-fade-in">
        <div className="kx-card-body">
          <div className="graph-legend">
            {Object.entries(NODE_COLORS).map(([type, color]) => (
              <div key={type} className="graph-legend-item">
                <div className="graph-legend-dot" style={{ background: color }} />
                <span style={{ textTransform: 'capitalize' }}>{type}</span>
              </div>
            ))}
          </div>
          {Object.keys(relTypeCounts).length > 0 && (
            <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--kx-border)', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {Object.entries(relTypeCounts).map(([type, count]) => (
                <span key={type} className="kx-tag">
                  {type.replace(/_/g, ' ')} ({count})
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
