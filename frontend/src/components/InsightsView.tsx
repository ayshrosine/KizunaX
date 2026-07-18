/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  Sparkles, 
  Award, 
  CheckCircle, 
  ShieldAlert, 
  ChevronRight, 
  Briefcase, 
  Cpu, 
  Terminal,
  LineChart,
  Info,
  ExternalLink
} from 'lucide-react';
import { CareerPath } from '../types';
import { initialCareerPaths } from '../data';

export default function InsightsView() {
  const [paths, setPaths] = useState<CareerPath[]>(initialCareerPaths);
  const [activePathId, setActivePathId] = useState<string>('path-1');

  const activePath = paths.find(p => p.id === activePathId) || paths[0];

  // Specific career advice maps
  const careerBenchmarks: Record<string, { requirements: string[]; actions: string[]; salary: string; outlook: string }> = {
    'path-1': {
      requirements: [
        "Verified mastery in Python Core Logic (Coursera SSO)",
        "Experience on Google Infrastructure latency optimization",
        "Expertise in High Availability Cloud Architecture"
      ],
      actions: [
        "Index your Kubernetes or Terraform configurations into IdentityVault Ingestion Portal.",
        "Request an automated credential seal for your AWS Cloud Practitioner certificate."
      ],
      salary: "$165k - $210k Average",
      outlook: "Extremely Strong (+24% YoY growth)"
    },
    'path-2': {
      requirements: [
        "Verified Python ETL pipeline scripts",
        "Data Science leadership credentials (Club Lead Workshops)"
      ],
      actions: [
        "Upload a certified Scala or Java artifact to complete database benchmarks.",
        "Index a large-scale database schema diagram to unlock Distributed Storage validation."
      ],
      salary: "$140k - $175k Average",
      outlook: "Strong (+18% YoY growth)"
    },
    'path-3': {
      requirements: [
        "Verified UX Interaction Design certificate (Sep 2023)",
        "Club mentoring leadership experience"
      ],
      actions: [
        "Upload verified financial models, product roadmap briefs, or UX case study artifacts.",
        "Complete a certified Agile scrum-master course and ingest credentials."
      ],
      salary: "$130k - $160k Average",
      outlook: "Stable (+12% YoY growth)"
    }
  };

  const activeBenchmark = careerBenchmarks[activePath.id] || {
    requirements: ["Basic asset uploads verified"],
    actions: ["Keep indexing credentials to train system parameters."],
    salary: "$100k+ Average",
    outlook: "Stable"
  };

  return (
    <div id="insights-view-root" className="space-y-6 select-none font-sans pb-12 text-left">
      
      {/* Banner */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 card-shadow flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="font-semibold text-sm text-slate-800 font-display flex items-center gap-2">
            <LineChart className="w-5 h-5 text-brand-steel" />
            AI Career Pathway Matcher
          </h3>
          <p className="text-xs text-slate-500 max-w-xl leading-normal font-medium">
            IdentityVault AI continuously cross-checks your verified timeline milestones against global professional benchmarks to project high-probability career matching models.
          </p>
        </div>
        
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg text-[10px] font-mono font-bold uppercase border border-emerald-200 shrink-0">
          <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
          <span>PARAMETER MATCHERS: CALIBRATED</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        
        {/* Left Side: Career Pathway List (Col-span 2) */}
        <div className="xl:col-span-2 space-y-4">
          <h4 className="font-bold text-[10px] font-mono text-slate-400 uppercase tracking-wider">PROJECTED PATHS</h4>
          
          <div className="space-y-3">
            {paths.map((p) => {
              const isActive = p.id === activePathId;
              return (
                <button
                  key={p.id}
                  id={`career-path-btn-${p.id}`}
                  onClick={() => setActivePathId(p.id)}
                  className={`w-full text-left p-5 rounded-2xl border transition-all card-shadow flex items-center justify-between group cursor-pointer relative overflow-hidden ${
                    isActive 
                      ? 'bg-slate-900 border-slate-800 text-slate-100 shadow-md' 
                      : 'bg-white hover:bg-slate-50 border-slate-200/80 text-slate-600'
                  }`}
                >
                  <div className="space-y-1 pr-4">
                    <h4 className={`font-bold text-sm tracking-tight font-display transition-colors ${isActive ? 'text-white' : 'text-slate-800'}`}>
                      {p.title}
                    </h4>
                    <p className={`text-xs leading-normal line-clamp-2 font-medium ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>
                      {p.description}
                    </p>
                  </div>

                  {/* SVG percentage ring dial */}
                  <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90">
                      {/* background circle */}
                      <circle 
                        cx="28" 
                        cy="28" 
                        r="22" 
                        fill="none" 
                        stroke={isActive ? '#1e293b' : '#f1f5f9'} 
                        strokeWidth="3.5" 
                      />
                      {/* highlighted arc */}
                      <motion.circle 
                        cx="28" 
                        cy="28" 
                        r="22" 
                        fill="none" 
                        stroke={isActive ? '#34618e' : '#012440'} 
                        strokeWidth="4" 
                        strokeDasharray={2 * Math.PI * 22}
                        strokeDashoffset={2 * Math.PI * 22 * (1 - p.match / 100)}
                        transition={{ duration: 0.8 }}
                      />
                    </svg>
                    <span className="absolute text-[11px] font-mono font-bold text-center">
                      {p.match}%
                    </span>
                  </div>

                </button>
              );
            })}
          </div>

          {/* Miniature verified skill badge list */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 card-shadow space-y-3">
            <h4 className="font-bold text-[10px] font-mono text-slate-400 uppercase tracking-wider">SECURE SKILL SEALS</h4>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center gap-2 text-[11px] font-semibold text-slate-700">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Python Master</span>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center gap-2 text-[11px] font-semibold text-slate-700">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Cloud Architect</span>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center gap-2 text-[11px] font-semibold text-slate-700">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Interaction Designer</span>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center gap-2 text-[11px] font-semibold text-slate-700">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Latency Optimizer</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Side: Specific path gap analysis (Col-span 3) */}
        <div className="xl:col-span-3">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 card-shadow h-full flex flex-col justify-between">
            <div className="space-y-6">
              
              {/* Header metrics */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-100 pb-5">
                <div>
                  <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-brand-steel bg-brand-steel/10 px-2 py-0.5 rounded-lg">
                    GAP ANALYSIS REPORT
                  </span>
                  <h3 className="text-lg font-bold text-slate-800 font-display mt-2 tracking-tight">
                    {activePath.title}
                  </h3>
                </div>

                <div className="flex items-center gap-4 text-left font-mono text-[10px] text-slate-500 font-semibold">
                  <div>
                    <span className="text-slate-400 block uppercase text-[9px]">Market Demand</span>
                    <span className="text-slate-800">{activeBenchmark.outlook}</span>
                  </div>
                  <span className="text-slate-200">|</span>
                  <div>
                    <span className="text-slate-400 block uppercase text-[9px]">Compensation</span>
                    <span className="text-slate-800">{activeBenchmark.salary}</span>
                  </div>
                </div>
              </div>

              {/* Responsive custom progress bars mapping credentials gap */}
              <div className="space-y-4 text-left">
                <h4 className="font-bold text-[10px] font-mono text-slate-400 uppercase tracking-wider">INTELLIGENCE METRIC SNAPSHOTS</h4>
                
                <div className="space-y-3">
                  {/* Technical Skills match */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>Technical Competence Matching</span>
                      <span className="font-mono">{activePath.technicalSkills}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${activePath.technicalSkills}%` }}
                        className="h-full bg-brand-steel"
                        transition={{ duration: 0.6 }}
                      />
                    </div>
                  </div>

                  {/* Leadership matches */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>Leadership Experience Matching</span>
                      <span className="font-mono">{activePath.leadershipExperience}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${activePath.leadershipExperience}%` }}
                        className="h-full bg-indigo-600"
                        transition={{ duration: 0.6 }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid of Verified credentials + GAP gaps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
                
                {/* Requirements satisfied */}
                <div className="space-y-2">
                  <h4 className="font-bold text-[10px] font-mono text-emerald-600 uppercase tracking-wider">Satisfied Vault Seals</h4>
                  <ul className="space-y-2">
                    {activeBenchmark.requirements.map((req, idx) => (
                      <li key={idx} className="flex gap-2 text-xs text-slate-600 font-medium">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Gap actions required */}
                <div className="space-y-2">
                  <h4 className="font-bold text-[10px] font-mono text-amber-600 uppercase tracking-wider font-sans">Recommended Gap Actions</h4>
                  <ul className="space-y-2">
                    {activeBenchmark.actions.map((act, idx) => (
                      <li key={idx} className="flex gap-2 text-xs text-slate-600 font-medium">
                        <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <span>{act}</span>
                      </li>
                    ))}
                  </ul>
                </div>

              </div>

            </div>

            <div className="pt-4 border-t border-slate-100 mt-6 flex items-center gap-2 text-[10px] text-slate-400 leading-normal font-medium">
              <Info className="w-4 h-4 text-brand-steel shrink-0" />
              <span>Matching calculations rely on FedRAMP compliance tags. Ingesting richer artifact schemas updates projections instantly.</span>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
