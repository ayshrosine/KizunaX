/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { 
  LayoutDashboard, 
  FolderOpen, 
  FileUp, 
  Network, 
  History, 
  Search, 
  TrendingUp, 
  Briefcase,
  Lock,
  Unlock,
  ShieldAlert,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { IDENTITY_VAULT_LOGO, USER_AVATAR } from '../data';
import { apiClient } from '../api';

export type ViewType = 'dashboard' | 'library' | 'ingestion' | 'graph' | 'timeline' | 'search' | 'insights' | 'portfolio';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  onLock: () => void;
  documentCount: number;
}

export default function Sidebar({ currentView, onViewChange, onLock, documentCount }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard' as ViewType, label: 'Dashboard', icon: LayoutDashboard, badge: null, category: 'GENERAL' },
    { id: 'library' as ViewType, label: 'Secure Safe', icon: FolderOpen, badge: documentCount.toString(), category: 'ASSETS' },
    { id: 'ingestion' as ViewType, label: 'Ingestion Portal', icon: FileUp, badge: 'New', category: 'ASSETS' },
    { id: 'graph' as ViewType, label: 'Skill Graph', icon: Network, badge: null, category: 'INTELLIGENCE' },
    { id: 'timeline' as ViewType, label: 'Verified Timeline', icon: History, badge: '✓', category: 'INTELLIGENCE' },
    { id: 'search' as ViewType, label: 'Semantic Search', icon: Search, badge: 'AI', category: 'INTELLIGENCE' },
    { id: 'insights' as ViewType, label: 'Career Matcher', icon: TrendingUp, badge: 'AI', category: 'CAREER' },
    { id: 'portfolio' as ViewType, label: 'Portfolio Gen', icon: Briefcase, badge: 'Beta', category: 'CAREER' },
  ];

  // Group items by category
  const categories = Array.from(new Set(menuItems.map(item => item.category)));

  return (
    <>
      {/* Desktop Sidebar: hidden on small screens */}
      <aside id="desktop-sidebar" className="hidden lg:flex flex-col w-64 bg-slate-900 border-r border-slate-800 text-slate-300 h-screen sticky top-0 shrink-0 z-40 select-none">
        
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-navy border border-brand-steel/35 flex items-center justify-center p-1.5 shadow-md">
              <img 
                src={IDENTITY_VAULT_LOGO} 
                alt="Vault Logo" 
                className="w-full h-full object-contain brightness-110"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h2 className="font-semibold text-sm text-slate-100 tracking-tight font-display flex items-center gap-1">
                Identity<span className="text-brand-steel">Vault</span>
              </h2>
              <p className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">Secure Storage</p>
            </div>
          </div>
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" title="System decrypted and armed" />
        </div>

        {/* User Info Bar */}
        <div className="px-5 py-4 bg-slate-950/40 border-b border-slate-800/50 flex items-center gap-3">
          <div className="relative">
            <img 
              src={USER_AVATAR} 
              alt="Elena Rostova" 
              className="w-10 h-10 rounded-full border border-brand-steel/30 object-cover"
              referrerPolicy="no-referrer"
            />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-900" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-200 truncate">Elena Rostova</p>
            <p className="text-[10px] text-slate-400 font-mono truncate">ID: ER-894-DECRYPT</p>
          </div>
        </div>

        {/* Navigation Options */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-thin">
          {categories.map((category) => (
            <div key={category} className="space-y-1">
              <h3 className="px-3 text-[10px] font-bold font-mono tracking-wider text-slate-500 uppercase">
                {category}
              </h3>
              <ul className="space-y-1">
                {menuItems
                  .filter(item => item.category === category)
                  .map((item) => {
                    const isActive = currentView === item.id;
                    return (
                      <li key={item.id}>
                        <button
                          id={`sidebar-item-${item.id}`}
                          onClick={() => onViewChange(item.id)}
                          className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium flex items-center justify-between transition-all group cursor-pointer relative ${
                            isActive 
                              ? 'bg-brand-steel text-white font-semibold shadow-md shadow-brand-steel/10' 
                              : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {/* Left contents */}
                          <div className="flex items-center gap-3 relative z-10">
                            <item.icon className={`w-4 h-4 transition-colors ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-brand-steel'}`} />
                            <span className="tracking-wide">{item.label}</span>
                          </div>

                          {/* Badge indicator */}
                          {item.badge && (
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-tight uppercase relative z-10 ${
                              isActive 
                                ? 'bg-slate-900 text-brand-steel' 
                                : item.badge === 'New' || item.badge === 'Beta'
                                ? 'bg-indigo-950 text-indigo-400 border border-indigo-900'
                                : item.badge === 'AI'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-900'
                                : 'bg-slate-800 text-slate-400'
                            }`}>
                              {item.badge}
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
              </ul>
            </div>
          ))}
        </div>

        {/* Lock Safe Controller in footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/20">
          <button
            id="sidebar-lock-btn"
            onClick={onLock}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800/60 hover:bg-rose-950/30 border border-slate-700/60 hover:border-rose-900 text-xs font-mono font-bold text-slate-400 hover:text-rose-400 rounded-xl transition-all cursor-pointer group active:scale-95"
          >
            <Lock className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
            <span>LOCK SECURE VAULT</span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation: shown only on small screens */}
      <nav id="mobile-nav" className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 text-slate-400 h-16 flex items-center justify-around px-2 z-50 select-none pb-safe">
        {menuItems.slice(0, 5).map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              id={`mobile-nav-item-${item.id}`}
              onClick={() => onViewChange(item.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] transition-all cursor-pointer ${
                isActive ? 'text-brand-steel font-bold' : 'text-slate-500'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-brand-steel/15 text-brand-steel' : ''}`}>
                <item.icon className="w-5 h-5" />
              </div>
              <span className="text-[9px] mt-0.5 scale-90 tracking-tight">{item.label.split(' ')[0]}</span>
            </button>
          );
        })}
        
        {/* Toggle option for overflow menu */}
        <button
          id="mobile-nav-lock-btn"
          onClick={onLock}
          className="flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] text-rose-500 font-medium cursor-pointer"
        >
          <div className="p-1.5 rounded-xl bg-rose-950/25">
            <Lock className="w-5 h-5" />
          </div>
          <span className="text-[9px] mt-0.5 scale-90 tracking-tight">Lock</span>
        </button>
      </nav>
    </>
  );
}
