/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ShieldCheck, 
  Award, 
  FileText, 
  LineChart, 
  Upload, 
  Search, 
  Network, 
  Briefcase,
  User,
  ArrowUpRight,
  Database,
  Lock,
  ChevronRight,
  Activity,
  Sparkles,
  Info
} from 'lucide-react';
import { Document, RecentUpload, TimelineMilestone } from '../types';
import { ViewType } from './Sidebar';
import { USER_AVATAR } from '../data';

interface DashboardViewProps {
  documents: Document[];
  recentUploads: RecentUpload[];
  milestones: TimelineMilestone[];
  onViewChange: (view: ViewType) => void;
  onSelectDocument: (doc: Document) => void;
}

export default function DashboardView({ 
  documents, 
  recentUploads, 
  milestones, 
  onViewChange,
  onSelectDocument
}: DashboardViewProps) {
  const [hoveredAction, setHoveredAction] = useState<string | null>(null);

  // Statistics calculation
  const totalFiles = documents.length;
  const verifiedMilestonesCount = milestones.length;
  const storageUsed = (totalFiles * 3.8).toFixed(1); // Mock 3.8 MB per file average

  const stats = [
    { title: 'Verified Assets', value: totalFiles.toString(), sub: 'Cryptographically secured', icon: ShieldCheck, color: 'text-brand-steel', bg: 'bg-brand-steel/10' },
    { title: 'Milestones', value: verifiedMilestonesCount.toString(), sub: 'SSO & Smart Contract Verified', icon: Award, color: 'text-amber-600', bg: 'bg-amber-100' },
    { title: 'Storage Allocation', value: `${storageUsed} MB`, sub: 'Of 500 MB premium safe tier', icon: Database, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { title: 'Vault Integrity', value: '100% Solid', sub: 'Zero compromised blocks', icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-100' }
  ];

  const quickActions = [
    { id: 'ingestion', title: 'Ingest New Artifact', desc: 'Securely drag, upload, & parse documents using Gemini AI model.', icon: Upload, view: 'ingestion' as ViewType, color: 'from-brand-navy to-brand-blue' },
    { id: 'graph', title: 'Intelligence Map', desc: 'Map documents, certifications, & parsed skills into interactive nodes.', icon: Network, view: 'graph' as ViewType, color: 'from-brand-steel to-indigo-900' },
    { id: 'search', title: 'Query Secure Copilot', desc: 'Search leases, taxes, academic data, or ask complex synthesis questions.', icon: Search, view: 'search' as ViewType, color: 'from-emerald-900 to-teal-800' },
    { id: 'portfolio', title: 'Build Public Showcase', desc: 'Instantly compile locked assets into a beautifully designed professional site.', icon: Briefcase, view: 'portfolio' as ViewType, color: 'from-purple-950 to-indigo-900' }
  ];

  return (
    <div id="dashboard-view-root" className="space-y-6 select-none font-sans pb-12">
      
      {/* Top Banner / Welcome card */}
      <div className="bg-gradient-to-r from-brand-navy to-brand-blue rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl card-shadow">
        {/* Abstract vector accents */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(circle_at_top_right,rgba(52,97,142,0.45),transparent_75%)] pointer-events-none" />
        <div className="absolute top-0 right-10 w-48 h-48 rounded-full border border-white/5 pointer-events-none" />
        <div className="absolute -bottom-10 right-20 w-72 h-72 rounded-full border border-white/5 pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-[10px] font-mono tracking-wider uppercase font-semibold">
              <Sparkles className="w-3 h-3 text-brand-accent-light animate-pulse" /> IdentityVault Active Session
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-display tracking-tight">
              Welcome back, Elena Rostova
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl font-medium">
              Your digital safe is synchronized. All document encryptions are fully functional, verified by FedRAMP framework standards.
            </p>
          </div>
          
          <div className="flex items-center gap-3.5 bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
            <img 
              src={USER_AVATAR} 
              alt="Elena Portrait" 
              className="w-12 h-12 rounded-full border-2 border-brand-accent-light/50 object-cover shadow-inner"
              referrerPolicy="no-referrer"
            />
            <div className="text-left">
              <span className="text-[10px] font-mono text-brand-accent-light uppercase font-bold tracking-widest block">Clearance Level</span>
              <p className="text-xs font-bold text-white uppercase tracking-tight">L3 Academic & Career Sec</p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white p-4 rounded-2xl border border-slate-200/80 hover:border-slate-300/80 transition-all card-shadow flex items-start gap-3 text-left"
          >
            <div className={`p-2.5 rounded-xl ${stat.bg} ${stat.color} shrink-0`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 font-mono tracking-wider uppercase">{stat.title}</span>
              <p className="text-xl font-bold text-slate-800 font-display mt-0.5">{stat.value}</p>
              <p className="text-[9px] text-slate-500 font-medium truncate mt-0.5">{stat.sub}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Bento Grid: Core Workspace and Recent activities */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Quick Launchers Panel (Col-span 2) */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold font-mono tracking-wider text-slate-400 uppercase">VAULT QUICK ACTIONS</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {quickActions.map((action, i) => {
              const isHovered = hoveredAction === action.id;
              return (
                <button
                  key={action.id}
                  id={`quick-action-card-${action.id}`}
                  onClick={() => onViewChange(action.view)}
                  onMouseEnter={() => setHoveredAction(action.id)}
                  onMouseLeave={() => setHoveredAction(null)}
                  className="bg-white rounded-2xl p-5 border border-slate-200/80 hover:border-brand-steel/50 transition-all card-shadow text-left group flex flex-col justify-between h-40 relative overflow-hidden cursor-pointer active:scale-99"
                >
                  {/* Background gradient on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-300`} />
                  
                  <div className="flex justify-between items-start">
                    <div className={`p-3 rounded-xl bg-slate-100 group-hover:bg-brand-navy/5 text-slate-500 group-hover:text-brand-steel transition-colors`}>
                      <action.icon className="w-5 h-5" />
                    </div>
                    <div className="p-1 rounded-full bg-slate-50 border border-slate-200/50 text-slate-400 group-hover:text-brand-steel group-hover:border-brand-steel/30 transition-all">
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-sm text-slate-800 group-hover:text-brand-steel transition-colors font-display tracking-tight flex items-center gap-1">
                      {action.title}
                    </h4>
                    <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                      {action.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Miniature Document Safe Carousel */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 card-shadow text-left">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-semibold text-sm text-slate-800 font-display">Featured Assets</h3>
                <p className="text-[10px] font-mono text-slate-500 uppercase mt-0.5">High contrast verified safe elements</p>
              </div>
              <button 
                onClick={() => onViewChange('library')}
                className="text-xs font-semibold text-brand-steel hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Full Safe</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {documents.slice(0, 4).map((doc) => (
                <div
                  key={doc.id}
                  id={`doc-featured-${doc.id}`}
                  onClick={() => onSelectDocument(doc)}
                  className="group relative h-28 rounded-xl overflow-hidden border border-slate-200 cursor-pointer shadow-sm active:scale-98"
                  title="Click to view file credentials"
                >
                  <img 
                    src={doc.bgImageUrl} 
                    alt={doc.altText} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  {/* High contrast visual overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                  <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-slate-900/80 rounded font-mono text-[8px] text-brand-accent-light font-bold uppercase border border-slate-800">
                    {doc.category}
                  </div>
                  <div className="absolute bottom-2 left-2 right-2 min-w-0">
                    <p className="text-[11px] font-bold text-white truncate">{doc.title}</p>
                    <p className="text-[8px] font-mono text-slate-300 mt-0.5">{doc.size}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Panel: Recent activity & Vault State */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold font-mono tracking-wider text-slate-400 uppercase">VAULT INTEGRITY FEED</h3>
          
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 card-shadow text-left space-y-4">
            
            {/* Safe Lock Status card */}
            <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 text-slate-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-brand-steel/10 rounded-full blur-xl pointer-events-none" />
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-700/60 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-100 font-display">System Integrity Verified</h4>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">SHA-256 Checksums: PASSED</p>
                </div>
              </div>
            </div>

            {/* Ingestion Feed */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs text-slate-700 font-display uppercase tracking-wider">Recently Synced Items</h4>
              
              <div className="divide-y divide-slate-100">
                {recentUploads.slice(0, 5).map((item) => (
                  <div 
                    key={item.id} 
                    id={`recent-upload-row-${item.id}`}
                    className="py-2.5 flex items-center justify-between group hover:bg-slate-50/50 px-2 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`p-1.5 rounded-lg shrink-0 ${
                        item.type === 'cert' ? 'bg-amber-100 text-amber-700' :
                        item.type === 'project' ? 'bg-blue-100 text-blue-700' :
                        item.type === 'academics' ? 'bg-indigo-100 text-indigo-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate group-hover:text-brand-steel transition-colors">{item.title}</p>
                        <p className="text-[9px] text-slate-400 font-mono mt-0.5">{item.date}</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 bg-slate-100 rounded uppercase text-slate-500 shrink-0">
                      {item.category}
                    </span>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => onViewChange('library')}
                className="w-full text-center py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-xl text-xs font-semibold text-slate-600 hover:text-brand-steel transition-all cursor-pointer"
              >
                Inspect All Safe Credentials
              </button>
            </div>

            {/* Compliance Note */}
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/60 flex gap-2 text-[10px] text-amber-800 leading-normal font-medium">
              <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>IdentityVault aligns with international digital safe framework standards. Local files are client-side decrypted.</span>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
