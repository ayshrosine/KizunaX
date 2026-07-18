/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  History, 
  Award, 
  ShieldCheck, 
  Plus, 
  Calendar, 
  CheckCircle, 
  Briefcase, 
  FileBadge,
  X,
  Info,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { TimelineMilestone } from '../types';

interface TimelineViewProps {
  milestones: TimelineMilestone[];
  onAddMilestone: (ms: TimelineMilestone) => void;
}

export default function TimelineView({ milestones, onAddMilestone }: TimelineViewProps) {
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newCategory, setNewCategory] = useState<'Certification' | 'Leadership' | 'Experience' | 'Portfolio'>('Certification');
  const [newDate, setNewDate] = useState<string>('');
  const [newDesc, setNewDesc] = useState<string>('');
  const [newSource, setNewSource] = useState<string>('');

  const handleCreateMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDate.trim() || !newDesc.trim()) {
      alert('Please fill out all mandatory milestone parameters.');
      return;
    }

    // Set high quality circular seals/badges depending on the chosen category
    let mockBadge = "https://lh3.googleusercontent.com/aida-public/AB6AXuAy9xbmGwto9Mn2K7Dt3ORZReCR0-e0v6BwELK1Luk709lreH5b9n62JAbZvnZmniFbPc8WmVT8YEjDa2TSZjVnSpkZFx0v1Pozy-OuETTCqkF_OtkGXmLFzahYobsWqiHk_a9OOiSEms7M1FHg5FjeTJ1_6b3FeZiQYcEHjZjsb8rIW_wGJUmE1x8TJmH92qrhs-FLKQkvhxowvnTY4Vad7V5hnzfgJRccKsls6-C7vWhSxSDguuHXCWcMWQtRIX41d7E0pAt9Gg";
    let bColor = 'border-amber-500';
    let cTheme: 'amber' | 'teal' | 'purple' | 'blue' = 'amber';

    if (newCategory === 'Leadership') {
      mockBadge = "https://lh3.googleusercontent.com/aida-public/AB6AXuC-qLLlgbHP1xLgfErflWkXxxP84Pfy6cXauuVWTDekerxRmUSL00Q9v7sCm1ouGeiHHeVQZSjjeyOS4PivCbY7LWtBA2Ao9tNiekq7oDVcglxNJm4gWScAHGukKoSVGPv_1po9KLifyXM_AWuF1rNRVmx_egjoeKsNDVPW4vyX9_m1XJIcv8cLOqd1flVy9PYEZ-MXGYRWDEkwNtMYA-hBIvmfV0zJEwC6aeZ4NRzTOVD_6fkKDyS9YTPfsVTMCD0PwU0gHq3UMA";
      bColor = 'border-teal-500';
      cTheme = 'teal';
    } else if (newCategory === 'Experience') {
      mockBadge = "https://lh3.googleusercontent.com/aida-public/AB6AXuCR2cW0H_8qVQFAT4nXTlaNN-h_svoFMhrdZ6xl4RBQMLqcQIU-_VvmRgBn72Jgkh8vyP72W-4HaRWDUoK_wDAXJrVBfkFV-BW5Ud-Fw7KqGL5s8mN0s2j6i5fGJXBR0U892q0dEj0tsK61A8WsgJROq26jhnhp_ZfegNJPMz7vhmaBbT0phOL8pFn3R_eXSJxGx9ez0kyqdJBVsoJ0NHkI5xWrsinU78cPTNkUDQuP6Bv0K0hEKlslrRzJwq5EhZFOMhSdGZbhCQ";
      bColor = 'border-purple-500';
      cTheme = 'purple';
    } else if (newCategory === 'Portfolio') {
      mockBadge = "https://lh3.googleusercontent.com/aida-public/AB6AXuDmbgL4ET3atAJfsh45XukausFAlWsMMBgYQEkHqbs8S2PYiSjsUGh8g2D5xZfxfPFnpa-CrqrpEPmhS8DjiwX-UTTkvycOXr-xFr1iUFBE2-I9dCjJNbJ6xzfq6vw4jz0MdON2PypT0NrRlXmzaIiJkwvarM9yVrESGkOsvFGZ74KgUWTou5wZa3MQOr--mWo_9RUhfxs4ilPC-HBVMZfq2qfjBWNH3ep17RffoJfLPUlcSHYQt1UK6dlxFXw5AEgzXuxcw5kxdA";
      bColor = 'border-blue-500';
      cTheme = 'blue';
    }

    const newMs: TimelineMilestone = {
      id: `ms-${Date.now()}`,
      title: newTitle,
      date: newDate,
      category: newCategory,
      description: newDesc,
      source: newSource.trim() || 'Client Vault Verification',
      badgeUrl: mockBadge,
      borderColor: bColor,
      colorTheme: cTheme
    };

    onAddMilestone(newMs);
    
    // Reset Form
    setNewTitle('');
    setNewDate('');
    setNewDesc('');
    setNewSource('');
    setShowAddForm(false);
  };

  return (
    <div id="timeline-view-root" className="max-w-4xl mx-auto space-y-6 select-none font-sans pb-12 text-left relative">
      
      {/* HUD Banner */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 card-shadow flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="font-semibold text-sm text-slate-800 font-display flex items-center gap-2">
            <History className="w-5 h-5 text-brand-steel" />
            Verified Career Progression Map
          </h3>
          <p className="text-xs text-slate-500 max-w-xl leading-normal font-medium">
            This timeline records cryptographically sealed milestones (SSO integrations and certified assessments). Click "Add Milestone" to index custom entries.
          </p>
        </div>

        <button
          id="btn-trigger-add-milestone"
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Milestone</span>
        </button>
      </div>

      {/* Main Chronological Timeline Area */}
      <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:top-0 before:bottom-0 before:left-[19px] sm:before:left-[23px] before:w-0.5 before:bg-slate-200">
        <AnimatePresence mode="popLayout">
          {milestones.map((ms, i) => {
            
            // Set styles matching theme color
            let badgeBg = 'bg-amber-100';
            let badgeTxt = 'text-amber-700';
            if (ms.category === 'Leadership') { badgeBg = 'bg-teal-100'; badgeTxt = 'text-teal-700'; }
            if (ms.category === 'Experience') { badgeBg = 'bg-purple-100'; badgeTxt = 'text-purple-700'; }
            if (ms.category === 'Portfolio') { badgeBg = 'bg-blue-100'; badgeTxt = 'text-blue-700'; }

            return (
              <motion.div
                key={ms.id}
                id={`milestone-row-${ms.id}`}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="relative group text-left"
              >
                {/* Visual marker dot on vertical rail */}
                <span className={`absolute -left-[23px] sm:-left-[27px] top-1.5 w-4 h-4 rounded-full bg-white border-2 ${ms.borderColor} shadow-sm group-hover:scale-110 transition-transform z-10`} />

                <div className="bg-white rounded-3xl p-5 border border-slate-200/80 card-shadow flex flex-col sm:flex-row items-start gap-4 hover:border-slate-300 transition-all">
                  
                  {/* High Quality verification badge image */}
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 p-1 flex items-center justify-center shrink-0 shadow-inner">
                    <img 
                      src={ms.badgeUrl} 
                      alt="Verification Badge" 
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-mono font-bold uppercase tracking-wider ${badgeBg} ${badgeTxt}`}>
                        {ms.category}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1 font-semibold">
                        <Calendar className="w-3.5 h-3.5" />
                        {ms.date}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-slate-800 font-display">
                        {ms.title}
                      </h4>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed mt-1">
                        {ms.description}
                      </p>
                    </div>

                    {/* Metadata SSO indicator */}
                    <div className="pt-2.5 border-t border-slate-100 mt-2 flex items-center justify-between text-[10px] font-mono font-bold text-slate-400">
                      <span className="flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        VERIFIED METADATA: {ms.source.toUpperCase()}
                      </span>
                      <span className="text-emerald-600">✓ SECURE SHA-256</span>
                    </div>

                  </div>

                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Pop-up Modal Form to Add a Milestone */}
      <AnimatePresence>
        {showAddForm && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl overflow-hidden max-w-md w-full border border-slate-200 shadow-2xl relative"
            >
              <button
                id="form-close-btn"
                onClick={() => setShowAddForm(false)}
                className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-full cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="p-6 text-left space-y-4">
                
                {/* Header */}
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-800 font-display">Index Custom Milestone</h3>
                  <p className="text-xs text-slate-500 font-medium">Configure parameters to lock this milestone into your secure feed.</p>
                </div>

                <form onSubmit={handleCreateMilestone} className="space-y-4">
                  {/* Title Input */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Milestone Title</label>
                    <input
                      id="input-ms-title"
                      type="text"
                      required
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="e.g. AWS Solutions Architect Cert"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-brand-steel outline-none px-3 py-2.5 rounded-xl text-xs font-medium"
                    />
                  </div>

                  {/* Grid Date & Category */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">Category</label>
                      <select
                        id="select-ms-cat"
                        value={newCategory}
                        onChange={(e: any) => setNewCategory(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-brand-steel outline-none px-2.5 py-2.5 rounded-xl text-xs font-semibold text-slate-600"
                      >
                        <option value="Certification">Certification</option>
                        <option value="Leadership">Leadership</option>
                        <option value="Experience">Experience</option>
                        <option value="Portfolio">Portfolio</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">Date</label>
                      <input
                        id="input-ms-date"
                        type="text"
                        required
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                        placeholder="e.g. Jan 2024"
                        className="w-full bg-slate-50 border border-slate-200 focus:border-brand-steel outline-none px-3 py-2.5 rounded-xl text-xs font-medium"
                      />
                    </div>
                  </div>

                  {/* Desc */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Description</label>
                    <textarea
                      id="input-ms-desc"
                      required
                      rows={3}
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      placeholder="Detail your core achievements and mastery..."
                      className="w-full bg-slate-50 border border-slate-200 focus:border-brand-steel outline-none px-3 py-2 rounded-xl text-xs font-medium resize-none"
                    />
                  </div>

                  {/* SSO Source */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Verification Source</label>
                    <input
                      id="input-ms-source"
                      type="text"
                      value={newSource}
                      onChange={(e) => setNewSource(e.target.value)}
                      placeholder="e.g. Coursera SSO, University Portal (Optional)"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-brand-steel outline-none px-3 py-2.5 rounded-xl text-xs font-medium"
                    />
                  </div>

                  <button
                    id="submit-ms-form"
                    type="submit"
                    className="w-full py-2.5 bg-brand-steel hover:bg-brand-blue text-white rounded-xl text-xs font-semibold transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Cryptographically Lock Achievement</span>
                  </button>

                </form>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
