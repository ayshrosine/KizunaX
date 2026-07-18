/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Bell, 
  ShieldCheck, 
  Database, 
  RefreshCw, 
  Menu,
  Clock,
  Settings,
  HelpCircle
} from 'lucide-react';
import { USER_AVATAR } from '../data';
import { ViewType } from './Sidebar';

interface HeaderProps {
  currentView: ViewType;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  documentCount: number;
}

export default function Header({ currentView, searchQuery, onSearchChange, documentCount }: HeaderProps) {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [isRotating, setIsRotating] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toUTCString().replace('GMT', 'UTC'));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const triggerSync = () => {
    setIsRotating(true);
    setTimeout(() => {
      setIsRotating(false);
    }, 1200);
  };

  const getPageTitle = (view: ViewType) => {
    switch (view) {
      case 'dashboard': return 'Command Center';
      case 'library': return 'Secure Document Safe';
      case 'ingestion': return 'Artifact Ingestion Portal';
      case 'graph': return 'Skill Graph Intelligence';
      case 'timeline': return 'Verified Career Milestones';
      case 'search': return 'Semantic Copilot Search';
      case 'insights': return 'AI Skill Matcher & Pathways';
      case 'portfolio': return 'Portfolio Publisher Engine';
      default: return 'IdentityVault';
    }
  };

  return (
    <header id="main-header" className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sticky top-0 z-30 select-none">
      
      {/* Title & View Label */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-brand-navy/5 rounded-xl border border-brand-navy/10 sm:block hidden">
          <ShieldCheck className="w-5 h-5 text-brand-navy" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight font-display">{getPageTitle(currentView)}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] text-slate-500 font-mono tracking-wider uppercase">AES-256 ENCRYPTED ENDPOINT</span>
          </div>
        </div>
      </div>

      {/* Global Interactive States & Controls */}
      <div className="flex items-center flex-wrap gap-4">
        
        {/* Dynamic Search */}
        <div className="relative max-w-xs w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            id="global-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search credentials & files..."
            className="w-full bg-slate-100/80 hover:bg-slate-100 focus:bg-white text-xs pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:border-brand-steel outline-none transition-all placeholder-slate-400 font-medium"
          />
        </div>

        {/* HUD Data Counters */}
        <div className="hidden md:flex items-center gap-3 bg-slate-100/60 rounded-xl px-3 py-1.5 border border-slate-200/60 font-mono text-[10px] text-slate-600">
          <div className="flex items-center gap-1">
            <Database className="w-3.5 h-3.5 text-slate-500" />
            <span>SAFE INDEX: {documentCount} FILES</span>
          </div>
          <span className="text-slate-300">|</span>
          <button 
            onClick={triggerSync}
            className="flex items-center gap-1.5 hover:text-brand-steel transition-colors active:scale-95 cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${isRotating ? 'animate-spin text-brand-steel' : 'text-slate-500'}`} />
            <span>SYNC SECURE LOGS</span>
          </button>
        </div>

        {/* Clock Feed */}
        <div className="hidden xl:flex items-center gap-1.5 bg-slate-100/60 rounded-xl px-3 py-1.5 border border-slate-200/60 font-mono text-[10px] text-slate-500">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{currentTime || 'SYNCHRONIZING UTC...'}</span>
        </div>

        {/* Action Tray */}
        <div className="flex items-center gap-2">
          {/* Notifications Trigger */}
          <div className="relative">
            <button
              id="notifications-bell"
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors relative cursor-pointer"
            >
              <Bell className="w-4.5 h-4.5" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white" />
            </button>

            {/* Notification Dropdown Panel */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden z-50 animate-fade-in font-sans">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                  <span className="font-semibold text-xs text-slate-800 font-display">System Integrity Notifications</span>
                  <span className="text-[9px] font-mono font-bold text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded">3 NEW</span>
                </div>
                <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                  <div className="p-3.5 hover:bg-slate-50 transition-colors text-left">
                    <p className="text-xs font-semibold text-slate-800">New Document Indexed Successfully</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Your Academic Transcripts have been parsed by IdentityVault AI.</p>
                    <span className="text-[9px] text-slate-400 font-mono mt-1 block">5 minutes ago</span>
                  </div>
                  <div className="p-3.5 hover:bg-slate-50 transition-colors text-left">
                    <p className="text-xs font-semibold text-slate-800">Biometric Key Verified</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Fingerprint authentication signature added to session logs.</p>
                    <span className="text-[9px] text-slate-400 font-mono mt-1 block">1 hour ago</span>
                  </div>
                  <div className="p-3.5 hover:bg-slate-50 transition-colors text-left">
                    <p className="text-xs font-semibold text-slate-800">FedRAMP Compliance Audit</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 font-medium">IdentityVault state complies with standard SOC2 cryptographic safe storage standards.</p>
                    <span className="text-[9px] text-slate-400 font-mono mt-1 block">Yesterday</span>
                  </div>
                </div>
                <div className="p-2 border-t border-slate-100 text-center bg-slate-50">
                  <button 
                    onClick={() => setShowNotifications(false)}
                    className="text-[10px] font-semibold text-brand-steel hover:underline p-1 cursor-pointer"
                  >
                    Dismiss all alerts
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Miniature profile widget for quick visual flair on mobile/tablet */}
          <img 
            src={USER_AVATAR} 
            alt="User avatar icon" 
            className="w-8 h-8 rounded-full object-cover border border-slate-200/80 lg:hidden block"
            referrerPolicy="no-referrer"
          />
        </div>

      </div>

    </header>
  );
}
