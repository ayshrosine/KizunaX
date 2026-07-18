/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Network, 
  HelpCircle, 
  ShieldCheck, 
  Terminal, 
  FileText, 
  Award, 
  TrendingUp, 
  Sparkles,
  Link2,
  Lock,
  Compass,
  Info
} from 'lucide-react';
import { GraphNode, GraphLink } from '../types';
import { initialGraphNodes, initialGraphLinks } from '../data';

export default function GraphView() {
  const [nodes, setNodes] = useState<GraphNode[]>(initialGraphNodes);
  const [links, setLinks] = useState<GraphLink[]>(initialGraphLinks);
  const [activeNodeId, setActiveNodeId] = useState<string | null>('google-internship');

  // Manual placement coordinates for stunning, balanced rendering (avoiding random overlaps)
  const nodeCoordinates: Record<string, { x: number; y: number }> = {
    'python': { x: 120, y: 150 },
    'cloud-arch': { x: 260, y: 80 },
    'ux-cert': { x: 140, y: 320 },
    'final-portfolio': { x: 300, y: 260 },
    'google-internship': { x: 440, y: 140 }
  };

  const getActiveNode = () => {
    return nodes.find(n => n.id === activeNodeId) || nodes[0];
  };

  const activeNode = getActiveNode();

  // Highlight links connected to active node
  const isLinkActive = (link: GraphLink) => {
    if (!activeNodeId) return false;
    return link.source === activeNodeId || link.target === activeNodeId;
  };

  // Node descriptions for rich metadata inspection
  const nodeMetadata: Record<string, { title: string; subtitle: string; desc: string; source: string; status: string }> = {
    'python': {
      title: 'Python Core Logic',
      subtitle: 'Verified Proficient Skill',
      desc: 'Advanced command of scripting, object-oriented pipelines, pandas structures, and PyTorch mathematical arrays.',
      source: 'Coursera Verification & GitHub Sync',
      status: 'VERIFIED SHIELD'
    },
    'cloud-arch': {
      title: 'Distributed Cloud Architecture',
      subtitle: 'System Architect Skill',
      desc: 'Expertise in high-availability systems, Dockerized microservices, load-balancers, and low-latency storage queries.',
      source: 'AWS Practitioner Badge Sync',
      status: 'VERIFIED SHIELD'
    },
    'ux-cert': {
      title: 'UX Specialist Certificate',
      subtitle: 'Interaction Design Credential',
      desc: 'Command over wireframes, accessibility requirements, color rhythm, cognitive flow patterns, and feedback loops.',
      source: 'Google Professional Suite Sync',
      status: 'VERIFIED SHIELD'
    },
    'final-portfolio': {
      title: 'Academic & Career Portfolio v2',
      subtitle: 'Design Portfolio Artifact',
      desc: 'Comprehensive visual collection showcasing interactive applications, academic papers, and clean UI/UX components.',
      source: 'IdentityVault Publisher Core',
      status: 'VAULT SECURED'
    },
    'google-internship': {
      title: 'Infrastructure Team Internship',
      subtitle: 'Google Professional Experience',
      desc: 'Summer 2024 placement focused on resolving high-traffic latency spikes and tuning database index performance.',
      source: 'Enterprise SSO Verification',
      status: 'FEDRAMP AUDITED'
    }
  };

  const activeMeta = nodeMetadata[activeNode.id] || {
    title: activeNode.label,
    subtitle: 'System Artifact Node',
    desc: 'Decrypted database point parsed securely by IdentityVault AI engine.',
    source: 'Verified Cryptographic Signature',
    status: 'SECURE'
  };

  return (
    <div id="graph-view-root" className="space-y-6 select-none font-sans pb-12 text-left">
      
      {/* Informative Header card */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 card-shadow flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="font-semibold text-sm text-slate-800 font-display flex items-center gap-2">
            <Network className="w-5 h-5 text-brand-steel" />
            Skill Intelligence Network
          </h3>
          <p className="text-xs text-slate-500 max-w-xl leading-normal font-medium">
            This graph maps document safe nodes and cross-checks them against professional benchmarks. Hover or click nodes to audit metadata connections.
          </p>
        </div>
        
        {/* Legends */}
        <div className="flex flex-wrap items-center gap-3 font-mono text-[9px] font-semibold text-slate-500 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200/60">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 bg-brand-navy rounded-full" /> SKILLS
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 bg-amber-500 rounded-full" /> CERTS
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 bg-secondary rounded-full" /> PROJECTS
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 bg-purple-600 rounded-full" /> EXPERIENCE
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Interactive SVG Network Canvas (Col-span 3) */}
        <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-200/80 card-shadow overflow-hidden flex flex-col relative min-h-[400px]">
          
          {/* Inner ambient overlay */}
          <div className="absolute top-4 left-4 flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-lg text-[9px] font-mono text-slate-500 border border-slate-200/50">
            <Compass className="w-3.5 h-3.5 text-slate-400" />
            <span>INTERACTIVE MAP PERSPECTIVE</span>
          </div>

          <div className="absolute bottom-4 right-4 text-[9px] font-mono text-slate-400 flex items-center gap-1">
            <Lock className="w-3 h-3 text-emerald-500" />
            <span>LOCAL CIPHER LAYOUT</span>
          </div>

          {/* SVG Frame */}
          <div className="flex-1 w-full relative min-h-[360px] flex items-center justify-center p-6">
            <svg 
              viewBox="0 0 600 400" 
              className="w-full h-full max-w-lg aspect-[3/2] z-10"
            >
              <defs>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                
                {/* Node stroke gradients */}
                <linearGradient id="activeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#34618e" />
                  <stop offset="100%" stopColor="#012440" />
                </linearGradient>
              </defs>

              {/* Render links */}
              {links.map((link, idx) => {
                const sourceCoord = nodeCoordinates[link.source];
                const targetCoord = nodeCoordinates[link.target];
                if (!sourceCoord || !targetCoord) return null;

                const active = isLinkActive(link);

                return (
                  <line
                    key={idx}
                    x1={sourceCoord.x}
                    y1={sourceCoord.y}
                    x2={targetCoord.x}
                    y2={targetCoord.y}
                    stroke={active ? '#34618e' : '#e2e8f0'}
                    strokeWidth={active ? 2.5 : 1.5}
                    strokeDasharray={active ? 'none' : '4 4'}
                    className="transition-all duration-300"
                  />
                );
              })}

              {/* Render nodes */}
              {nodes.map((node) => {
                const coord = nodeCoordinates[node.id];
                if (!coord) return null;

                const isActive = node.id === activeNodeId;
                
                // Color map depending on category
                let pinColor = '#34618e'; // Default brand steel
                if (node.category === 'skills') pinColor = '#012440';
                if (node.category === 'certifications') pinColor = '#f59e0b';
                if (node.category === 'projects') pinColor = '#6366f1';
                if (node.category === 'internships') pinColor = '#a855f7';

                return (
                  <g 
                    key={node.id}
                    onClick={() => setActiveNodeId(node.id)}
                    className="cursor-pointer group select-none"
                  >
                    {/* Active aura ring */}
                    {isActive && (
                      <circle
                        cx={coord.x}
                        cy={coord.y}
                        r={32}
                        fill="none"
                        stroke="#34618e"
                        strokeWidth={1}
                        strokeDasharray="3 3"
                        className="animate-spin"
                        style={{ transformOrigin: `${coord.x}px ${coord.y}px`, animationDuration: '8s' }}
                      />
                    )}

                    {/* Outer circle base */}
                    <circle
                      cx={coord.x}
                      cy={coord.y}
                      r={isActive ? 24 : 20}
                      fill={isActive ? '#ffffff' : '#f8fafc'}
                      stroke={isActive ? 'url(#activeGradient)' : '#cbd5e1'}
                      strokeWidth={isActive ? 3 : 1.5}
                      className="transition-all duration-300 hover:stroke-slate-400 shadow-sm"
                    />

                    {/* Inner core circle pin */}
                    <circle
                      cx={coord.x}
                      cy={coord.y}
                      r={isActive ? 8 : 6}
                      fill={pinColor}
                      className="transition-all duration-300"
                    />

                    {/* Node Text Label */}
                    <text
                      x={coord.x}
                      y={coord.y + (isActive ? 42 : 36)}
                      textAnchor="middle"
                      fill={isActive ? '#012440' : '#475569'}
                      className={`text-[10px] font-semibold tracking-tight ${isActive ? 'font-bold' : ''} font-sans select-none`}
                    >
                      {node.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

        </div>

        {/* Right Side: Security Audit Node Panel (Col-span 2) */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 card-shadow h-full flex flex-col justify-between">
            <div className="space-y-4">
              
              {/* Category indicator & title */}
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-brand-steel bg-brand-steel/10 px-2 py-0.5 rounded-lg">
                  {activeNode.category.toUpperCase()} NODE AUDIT
                </span>
                <h3 className="text-lg font-bold text-slate-800 font-display mt-2 tracking-tight">
                  {activeMeta.title}
                </h3>
                <p className="text-xs font-semibold text-slate-400 font-sans">{activeMeta.subtitle}</p>
              </div>

              {/* Decrypted Description area */}
              <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-200/60 text-xs text-slate-600 space-y-3 leading-relaxed">
                <p className="font-medium">"{activeMeta.desc}"</p>
                
                <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[10px] font-mono text-slate-500 font-bold">
                  <span>VERIFICATION:</span>
                  <span className="text-emerald-600">{activeMeta.status}</span>
                </div>
              </div>

              {/* Data Provenance checklist */}
              <div className="space-y-2">
                <h4 className="font-bold text-[10px] font-mono text-slate-400 uppercase tracking-wider">Provenance Logs</h4>
                
                <div className="p-3 bg-slate-900 text-slate-300 rounded-xl font-mono text-[9px] border border-slate-800 text-left space-y-1.5">
                  <div>SYS_INTEGRITY: AES-256 CHECK PASSED</div>
                  <div>PROVENANCE: {activeMeta.source}</div>
                  <div>HASH: SHA256-4AA9F8C2...</div>
                </div>
              </div>

            </div>

            <div className="pt-4 border-t border-slate-100 mt-4 flex items-center gap-2 text-[10px] text-slate-400 leading-normal font-medium">
              <Info className="w-4 h-4 text-brand-steel shrink-0" />
              <span>Selecting adjacent nodes updates cross-links mapping. AI automatically compiles nodes into career pathways.</span>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
