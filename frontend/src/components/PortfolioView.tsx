/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Briefcase, 
  Sparkles, 
  Eye, 
  Lock, 
  Share2, 
  CheckCircle, 
  ExternalLink, 
  Award, 
  RefreshCw, 
  Settings, 
  Grid,
  Info,
  Laptop
} from 'lucide-react';
import { TimelineMilestone } from '../types';
import { PORTFOLIO_AVATAR, PORTFOLIO_PROJECT_IMAGE } from '../data';

interface PortfolioViewProps {
  milestones: TimelineMilestone[];
}

export default function PortfolioView({ milestones }: PortfolioViewProps) {
  const [theme, setTheme] = useState<'slate' | 'cosmic' | 'emerald'>('slate');
  const [biography, setBiography] = useState<string>("Hello, I am Elena Rostova. I specialize in cloud infrastructure engineering, machine learning pipelines, and technical research.");
  const [showCerts, setShowCerts] = useState<boolean>(true);
  const [showLeadership, setShowLeadership] = useState<boolean>(true);
  const [showExperience, setShowExperience] = useState<boolean>(true);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [publicUrl, setPublicUrl] = useState<string | null>(null);

  const handlePublish = () => {
    setIsPublishing(true);
    setPublicUrl(null);

    setTimeout(() => {
      setIsPublishing(false);
      setPublicUrl(`https://identityvault.pub/elena-rostova-${theme}`);
    }, 1800);
  };

  const getThemeClasses = () => {
    if (theme === 'cosmic') return 'bg-slate-950 text-slate-100 border-slate-800';
    if (theme === 'emerald') return 'bg-emerald-950/95 text-slate-100 border-emerald-900';
    return 'bg-slate-900 text-slate-100 border-slate-800'; // Minimal Slate
  };

  return (
    <div id="portfolio-view-root" className="space-y-6 select-none font-sans pb-12 text-left">
      
      {/* Banner */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 card-shadow flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="font-semibold text-sm text-slate-800 font-display flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-brand-steel" />
            Public Showcase Compiler
          </h3>
          <p className="text-xs text-slate-500 max-w-xl leading-normal font-medium">
            Publish your cryptographically secured safe documents and verified timeline milestones into a high-end personal resume webpage with one click.
          </p>
        </div>

        <button
          id="btn-trigger-publish-portfolio"
          onClick={handlePublish}
          disabled={isPublishing}
          className="px-5 py-2.5 bg-brand-steel hover:bg-brand-blue disabled:bg-slate-200 text-white disabled:text-slate-400 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all cursor-pointer active:scale-95 shrink-0"
        >
          {isPublishing ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Share2 className="w-4 h-4" />
          )}
          <span>Publish Web Showcase</span>
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        
        {/* Left Control Panel (Col-span 2) */}
        <div className="xl:col-span-2 space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 card-shadow space-y-4">
            <h4 className="font-bold text-[10px] font-mono text-slate-400 uppercase tracking-wider">1. COMPILER SETTINGS</h4>
            
            {/* Template Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">Showcase Aesthetics Theme</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  id="theme-slate-btn"
                  onClick={() => setTheme('slate')}
                  className={`px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    theme === 'slate' 
                      ? 'bg-slate-900 text-white shadow-sm' 
                      : 'bg-slate-50 hover:bg-slate-100 border border-slate-200/60 text-slate-600'
                  }`}
                >
                  Minimal Slate
                </button>
                <button
                  id="theme-cosmic-btn"
                  onClick={() => setTheme('cosmic')}
                  className={`px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    theme === 'cosmic' 
                      ? 'bg-purple-950 text-white shadow-sm border border-purple-900' 
                      : 'bg-slate-50 hover:bg-slate-100 border border-slate-200/60 text-slate-600'
                  }`}
                >
                  Cosmic Midnight
                </button>
                <button
                  id="theme-emerald-btn"
                  onClick={() => setTheme('emerald')}
                  className={`px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    theme === 'emerald' 
                      ? 'bg-emerald-950 text-white shadow-sm border border-emerald-900' 
                      : 'bg-slate-50 hover:bg-slate-100 border border-slate-200/60 text-slate-600'
                  }`}
                >
                  Aesthetic Emerald
                </button>
              </div>
            </div>

            {/* Biography text */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">Personal Narrative (Bio)</label>
              <textarea
                id="portfolio-bio-textarea"
                rows={3}
                value={biography}
                onChange={(e) => setBiography(e.target.value)}
                placeholder="Write a brief introduction about yourself..."
                className="w-full bg-slate-50 border border-slate-200 focus:border-brand-steel outline-none rounded-xl px-3 py-2 text-xs font-medium resize-none leading-relaxed"
              />
            </div>

            {/* Visibility checkboxes */}
            <div className="space-y-2.5">
              <label className="text-xs font-semibold text-slate-700 block">Visible Artifact Channels</label>
              
              <div className="space-y-2 font-medium text-xs text-slate-700">
                <label className="flex items-center gap-2.5 bg-slate-50/50 hover:bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 cursor-pointer">
                  <input
                    id="checkbox-certs"
                    type="checkbox"
                    checked={showCerts}
                    onChange={(e) => setShowCerts(e.target.checked)}
                    className="rounded border-slate-300 text-brand-steel focus:ring-brand-steel w-4 h-4 cursor-pointer"
                  />
                  <span>Verified Credentials & Certifications</span>
                </label>

                <label className="flex items-center gap-2.5 bg-slate-50/50 hover:bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 cursor-pointer">
                  <input
                    id="checkbox-leadership"
                    type="checkbox"
                    checked={showLeadership}
                    onChange={(e) => setShowLeadership(e.target.checked)}
                    className="rounded border-slate-300 text-brand-steel focus:ring-brand-steel w-4 h-4 cursor-pointer"
                  />
                  <span>Leadership & Mentorship Records</span>
                </label>

                <label className="flex items-center gap-2.5 bg-slate-50/50 hover:bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 cursor-pointer">
                  <input
                    id="checkbox-experience"
                    type="checkbox"
                    checked={showExperience}
                    onChange={(e) => setShowExperience(e.target.checked)}
                    className="rounded border-slate-300 text-brand-steel focus:ring-brand-steel w-4 h-4 cursor-pointer"
                  />
                  <span>Professional Placements & Experiences</span>
                </label>
              </div>
            </div>

          </div>

          {/* Publisher logs or link drawer */}
          <AnimatePresence>
            {publicUrl && (
              <motion.div
                key="pub-link"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-4 bg-emerald-50 border border-emerald-200 rounded-3xl flex items-start gap-3 text-left"
              >
                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl shrink-0">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-600">PUBLISHED SUCCESSFUL</span>
                  <p className="text-xs font-semibold text-slate-800">Your Web Showcase is Live!</p>
                  <a
                    id="published-showcase-anchor"
                    href={publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-brand-steel hover:underline flex items-center gap-1 mt-1 break-all"
                  >
                    <span>{publicUrl}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* Right Side: Showcase Live Frame Preview (Col-span 3) */}
        <div className="xl:col-span-3">
          <div className="bg-slate-100 rounded-3xl p-4 border border-slate-200/80 h-full flex flex-col justify-between min-h-[460px]">
            
            {/* Frame browser heading bar */}
            <div className="flex justify-between items-center bg-white border border-slate-200 rounded-2xl px-4 py-2.5 shadow-sm shrink-0 mb-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="text-[10px] font-mono text-slate-400 ml-3 uppercase tracking-wider font-semibold">PREVIEW MODE</span>
              </div>
              <Laptop className="w-4 h-4 text-slate-400" />
            </div>

            {/* Simulated Published Site Frame */}
            <div className={`flex-1 rounded-2xl p-6 border overflow-y-auto max-h-[380px] scrollbar-thin transition-all duration-300 ${getThemeClasses()}`}>
              
              {/* Cover Banner with preset graphics */}
              <div className="h-28 rounded-xl overflow-hidden relative mb-6">
                <img 
                  src={PORTFOLIO_PROJECT_IMAGE} 
                  alt="Portfolio Cover Banner" 
                  className="w-full h-full object-cover brightness-75"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                <div className="absolute bottom-3 left-4 flex items-center gap-2.5">
                  <img 
                    src={PORTFOLIO_AVATAR} 
                    alt="Elena Portrait Mini" 
                    className="w-10 h-10 rounded-full object-cover border-2 border-white/60 shadow"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h4 className="font-bold text-xs text-white">Elena Rostova</h4>
                    <p className="text-[9px] font-mono text-slate-300">Verified System Architect</p>
                  </div>
                </div>
              </div>

              {/* Biography Section */}
              <div className="space-y-1.5 mb-6 text-left">
                <h5 className="font-bold text-[10px] font-mono text-slate-400 uppercase tracking-wider">Biography</h5>
                <p className="text-xs text-slate-300 leading-relaxed italic">
                  "{biography || 'Please write a biography parameter to showcase here...'}"
                </p>
              </div>

              {/* Dynamic list of visible milestones inside compiled frame */}
              <div className="space-y-4 text-left">
                <h5 className="font-bold text-[10px] font-mono text-slate-400 uppercase tracking-wider">Verified Milestones</h5>
                
                <div className="space-y-3.5">
                  {milestones.map((ms) => {
                    const hide = 
                      (ms.category === 'Certification' && !showCerts) ||
                      (ms.category === 'Leadership' && !showLeadership) ||
                      (ms.category === 'Experience' && !showExperience);
                    if (hide) return null;

                    return (
                      <div 
                        key={ms.id} 
                        id={`prev-milestone-row-${ms.id}`}
                        className="p-3.5 bg-white/5 border border-white/10 rounded-xl flex items-center gap-3.5"
                      >
                        <div className="w-9 h-9 rounded-lg bg-white/10 border border-white/10 p-0.5 flex items-center justify-center shrink-0">
                          <img 
                            src={ms.badgeUrl} 
                            alt="Milestone Seal" 
                            className="w-full h-full object-contain"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[8px] font-mono font-bold uppercase tracking-widest text-brand-steel">
                              {ms.category}
                            </span>
                            <span className="text-[8px] text-slate-400 font-mono">
                              {ms.date}
                            </span>
                          </div>
                          <h6 className="font-bold text-xs text-white tracking-tight mt-0.5">{ms.title}</h6>
                          <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{ms.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            <div className="pt-3 border-t border-slate-200 mt-4 flex items-center gap-2 text-[10px] text-slate-400 leading-normal font-medium">
              <Info className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Preview mode demonstrates exactly what external recruiters see when parsing your verified address link.</span>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
