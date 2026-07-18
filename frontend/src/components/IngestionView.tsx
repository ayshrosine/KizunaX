/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  UploadCloud, 
  FileText, 
  ChevronRight, 
  RefreshCw, 
  CheckCircle, 
  Cpu, 
  Terminal, 
  FolderPlus,
  ArrowRight,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { Document } from '../types';

interface IngestionViewProps {
  onAddDocument: (doc: Document) => void;
  onViewChange: (view: any) => void;
}

export default function IngestionView({ onAddDocument, onViewChange }: IngestionViewProps) {
  const [docTitle, setDocTitle] = useState<string>('');
  const [docCategory, setDocCategory] = useState<string>('Academic');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploadStep, setUploadStep] = useState<'idle' | 'uploading' | 'parsing' | 'success'>('idle');
  const [parsingProgress, setParsingProgress] = useState<number>(0);
  const [logs, setLogs] = useState<string[]>([]);
  const logIntervalRef = useRef<any>(null);

  // Set of gorgeous preloaded high-fidelity design mockups to keep assets clean and unbroken
  const PRESET_BG_IMAGES = [
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDN4VCyw_I7l7bMihJcCTtfvCdMkJ1xMg19U06wJiZzOXXIbDkG8dx3jcwf-Jo_78XIQkv_YvULGBi3ohdF3CSzysYj4YYSuLzhLokgiAJ2GnpR3z9fO6Hm4kTD097gfnObbzsGH5nbVE6m-b6ledaj3dYDlEPpbBQDSznS1MaZhIoKZvBNX_yTq_siiNTaq62MMaW3XR-y2u5KxM3KSSPBsJSK9crmnRs7Y9u_fFTYda8sXSecqfBFr2ku9-bY3Vp-ptRDsq1gkw",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAaqh09p8RHZ-NiJQmlyWrco40BBty-jrF-pgZPsyT_WBfX9qHSgtf3mcESpNCp4FH1R9RCQGKyOY4bD4eCuKr1hFNIwHDNWVIuhFq46a7UcKQJCPOjwKD-0UzyomhrLlTEAFlfd6YSRuiwxQcSAyLBKUuipjFaknc5Kul50oRKv2dtv_A6wkzAtzEHbu3QOAu-g0s6CS1qO9nD64Arj0Bq_Zd48Jni9etA5bfHdN7GT49Q-ZVmKmweGmLzhX-s5o4Ed0DG5ylK8A",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBwAuGgkPYu5YCyVq4KmhhwvlCNI6ayI8u17RM_xOt2j2kZDeiZoUam20i2dosR08eR2qr2gBzolJeQvhcVwC9t8AkAhnzbT9vQqxy-Bbe4P3zSz7nXUG86GBE3lArZngizzyBJGjy34pSYKF1rwGYOQINkFeGkhrvsa-v7lHTP8j_CKVmUpP_a17VxwNFjmS6BIDYndIN-JiUjNwX-iAs0cspoIs6uzUJf7n4BTFBlaQBDXAdwPU_23NNKSRPWweMV3T8I5GH5ag",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuD4nKqc9NOm2QbidfRky1ymhlZh6YUDfcP8734fv6yR0SdKI79ZmtKNzk3Rg9al4vmm9MY6r9bOYneF9fzs9x_pPQCyH9HI-bzMvwjSVlLF4P4EnvHTX0mOTsPI7Vv0XTJMSgOCozxQ5VpDN3KhFtrp-tV-Cev00_y4rz40b0TGlO2quGuRb78cpJWePYQfOI68gw05AGhikRD74dI7zkIpsXXlSGm-i_LHHaETixBr4rBBH3QZHnY_gPvmBubiE1U-7wN9kWskpw"
  ];

  const categories = ['Academic', 'Professional', 'Design', 'Finance', 'Legal', 'Health', 'Personal'];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const startScanningMock = () => {
    if (!docTitle.trim()) {
      alert('Please configure a valid Document Title before scanning.');
      return;
    }
    setUploadStep('uploading');
    setLogs(['[SYSTEM] Initializing secure client connection...', '[SYSTEM] Cryptographic tunnel opened successfully.']);

    // Progression loop
    setTimeout(() => {
      setUploadStep('parsing');
      addLogsSequentially();
    }, 1000);
  };

  const addLogsSequentially = () => {
    const parseSteps = [
      '[DECRYPT] Authenticating client-side security key... COMPLETED',
      '[AI ENGINE] Extracting key entity structures and schemas...',
      '[AI ENGINE] Running OCR text segmentation models...',
      '[COMPLIANCE] Verification check against FedRAMP metadata database: PASSED',
      '[INTELLIGENCE] Injecting skill indicators into central graph nodes...',
      '[SYSTEM] Creating locked cipher block for Secure Safe storage...'
    ];

    let currentLogIndex = 0;
    const progressTimer = setInterval(() => {
      setParsingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressTimer);
          finalizeScan();
          return 100;
        }
        return prev + 10;
      });

      if (currentLogIndex < parseSteps.length) {
        setLogs(prev => [...prev, parseSteps[currentLogIndex]]);
        currentLogIndex++;
      }
    }, 400);
  };

  const finalizeScan = () => {
    const randomBg = PRESET_BG_IMAGES[Math.floor(Math.random() * PRESET_BG_IMAGES.length)];
    
    // Create new document in state
    const newDoc: Document = {
      id: `doc-${Date.now()}`,
      title: docTitle,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      category: docCategory,
      size: `${(Math.random() * 4 + 1).toFixed(1)} MB`,
      iconType: 'paper',
      bgImageUrl: randomBg,
      altText: `AI parsed data snapshot representing ${docTitle} inside the cryptographically locked database.`
    };

    onAddDocument(newDoc);
    setUploadStep('success');
  };

  const resetScanner = () => {
    setDocTitle('');
    setUploadStep('idle');
    setParsingProgress(0);
    setLogs([]);
  };

  return (
    <div id="ingestion-view-root" className="max-w-4xl mx-auto space-y-6 select-none font-sans pb-12 text-left">
      
      {/* HUD Scanner Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-slate-100 flex items-center justify-between shadow-lg relative overflow-hidden">
        <div className="space-y-1">
          <h2 className="text-lg font-bold font-display flex items-center gap-2">
            <Cpu className="w-5 h-5 text-brand-steel animate-pulse-safe" />
            Artifact Cryptographic Scanner
          </h2>
          <p className="text-xs text-slate-400 font-medium max-w-lg leading-normal">
            Upload certificates, resumes, taxes, agreements, or transcripts. IdentityVault AI parses metadata and safely locks them inside your sandbox.
          </p>
        </div>
        <div className="h-10 w-10 rounded-xl bg-slate-800 border border-slate-700/60 hidden sm:flex items-center justify-center text-brand-steel">
          <Terminal className="w-5 h-5" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        
        {/* Left Side: Setup Wizard Panel */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 card-shadow space-y-4">
            <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider font-mono">1. Artifact Parameters</h3>
            
            <div className="space-y-4">
              {/* Title parameter */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Document Title</label>
                <input
                  id="artifact-title-input"
                  type="text"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  disabled={uploadStep !== 'idle'}
                  placeholder="e.g. Stanford Academic Transcript"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-brand-steel outline-none rounded-xl px-3 py-2.5 text-xs transition-all font-medium disabled:opacity-60"
                />
              </div>

              {/* Category parameter */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 font-sans">Visual Category Tag</label>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      id={`preset-cat-${cat.toLowerCase()}`}
                      type="button"
                      disabled={uploadStep !== 'idle'}
                      onClick={() => setDocCategory(cat)}
                      className={`px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        docCategory === cat 
                          ? 'bg-slate-900 text-white shadow-sm' 
                          : 'bg-slate-50 hover:bg-slate-100 border border-slate-200/60 text-slate-600 disabled:opacity-60'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Right Side: Scanner Stage */}
        <div className="md:col-span-3">
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 card-shadow h-full flex flex-col justify-between min-h-[360px]">
            
            <AnimatePresence mode="wait">
              
              {/* Idle State / Upload Landing Zone */}
              {uploadStep === 'idle' && (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (!docTitle) setDocTitle("Dropped Security Blob");
                  }}
                  className={`flex-1 border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-all ${
                    isDragging 
                      ? 'border-brand-steel bg-brand-steel/5 shadow-inner' 
                      : 'border-slate-200/80 bg-slate-50/50 hover:bg-slate-50'
                  }`}
                >
                  <div className="p-3 bg-white rounded-full border border-slate-200 shadow-sm text-slate-400 mb-4 animate-bounce-safe">
                    <UploadCloud className="w-8 h-8 text-brand-steel" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-800 font-display">Drag Secure File Here</h4>
                  <p className="text-xs text-slate-500 max-w-xs mt-1 leading-normal font-medium">
                    Supports certificates, PDFs, and images. Your files are decrypted locally and never leaked.
                  </p>

                  <div className="mt-5 flex gap-2">
                    <button
                      id="upload-scan-trigger-btn"
                      onClick={startScanningMock}
                      className="px-4 py-2 bg-brand-steel hover:bg-brand-blue text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md cursor-pointer active:scale-95"
                    >
                      <span>Lock & Scan Document</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Uploading & Parsing Stage */}
              {(uploadStep === 'uploading' || uploadStep === 'parsing') && (
                <motion.div
                  key="scanning"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    {/* Progress feedback */}
                    <div className="flex justify-between items-center bg-slate-50 px-4 py-3 rounded-xl border border-slate-200/50">
                      <div className="flex items-center gap-2.5">
                        <RefreshCw className="w-4 h-4 text-brand-steel animate-spin" />
                        <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-600">
                          {uploadStep === 'uploading' ? 'CONNECTING TUNNEL...' : 'DECRYPTING METADATA...'}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-brand-steel">{parsingProgress}%</span>
                    </div>

                    {/* Progress Slider */}
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${parsingProgress}%` }}
                        className="h-full bg-brand-steel shadow-[0_0_8px_#34618e]"
                      />
                    </div>

                    {/* Cryptographic Console Logs Feed */}
                    <div className="bg-slate-950 rounded-xl p-4 font-mono text-[10px] text-emerald-400 border border-slate-800 space-y-1.5 max-h-48 overflow-y-auto text-left scrollbar-thin">
                      <div className="text-slate-500 mb-1 border-b border-slate-800 pb-1 flex justify-between items-center">
                        <span>IVAI SECURE TERMINAL</span>
                        <span className="animate-pulse">● FEED ACTIVE</span>
                      </div>
                      {logs.map((log, index) => (
                        <div key={index} className="leading-relaxed">
                          <span className="text-slate-600 mr-1">&gt;</span> {log}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="text-center font-mono text-[9px] text-slate-400 mt-4">
                    FEDRAMP AUDIT HASH ENGINE ACTIVE • CLIENT-SIDE PROTECTION SHIELD
                  </div>
                </motion.div>
              )}

              {/* Ingestion Complete Stage */}
              {uploadStep === 'success' && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4"
                >
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-200 shadow-sm">
                    <CheckCircle className="w-9 h-9" />
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-slate-800 font-display">Ingestion & Encryption Complete</h4>
                    <p className="text-xs text-slate-500 max-w-sm mt-1 leading-normal font-medium">
                      "{docTitle}" has been decrypted, organized as <strong>{docCategory}</strong>, and added to your safe.
                    </p>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      id="scan-reset-btn"
                      onClick={resetScanner}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 rounded-xl text-xs font-semibold cursor-pointer transition-all active:scale-95"
                    >
                      Scan Another
                    </button>
                    <button
                      id="scan-library-redirect"
                      onClick={() => onViewChange('library')}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition-all shadow-md cursor-pointer active:scale-95"
                    >
                      <span>View in Safe</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>

          </div>
        </div>

      </div>

    </div>
  );
}
