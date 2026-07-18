/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Folder, 
  Trash2, 
  Plus, 
  Filter, 
  Eye, 
  Award, 
  X, 
  ArrowUpRight, 
  ExternalLink,
  ShieldAlert,
  Calendar,
  Lock,
  Compass,
  CheckCircle2,
  FileCheck2,
  FilePlus2
} from 'lucide-react';
import { Document, TimelineMilestone } from '../types';

interface LibraryViewProps {
  documents: Document[];
  onDeleteDocument: (id: string) => void;
  onPromoteToTimeline: (doc: Document) => void;
  searchQuery: string;
}

export default function LibraryView({ 
  documents, 
  onDeleteDocument, 
  onPromoteToTimeline,
  searchQuery 
}: LibraryViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activePreviewDoc, setActivePreviewDoc] = useState<Document | null>(null);
  const [isPromotedNotification, setIsPromotedNotification] = useState<string | null>(null);

  // Derive categories dynamically
  const categories = ['All', ...Array.from(new Set(documents.map(doc => doc.category)))];

  // Filter documents by category and search query
  const filteredDocs = documents.filter((doc) => {
    const matchesCategory = selectedCategory === 'All' || doc.category === selectedCategory;
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          doc.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handlePromote = (doc: Document) => {
    onPromoteToTimeline(doc);
    setIsPromotedNotification(doc.id);
    setTimeout(() => {
      setIsPromotedNotification(null);
    }, 2500);
  };

  return (
    <div id="library-view-root" className="space-y-6 select-none font-sans pb-12 text-left">
      
      {/* Category Filtering Rail */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 card-shadow">
        
        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <div className="p-2 bg-slate-100 rounded-xl text-slate-500 shrink-0">
            <Filter className="w-4 h-4" />
          </div>
          {categories.map((cat) => (
            <button
              key={cat}
              id={`filter-btn-${cat.toLowerCase()}`}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat 
                  ? 'bg-brand-steel text-white shadow-md shadow-brand-steel/15' 
                  : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Counter */}
        <div className="text-xs font-mono text-slate-400 shrink-0 font-medium">
          SHOWING {filteredDocs.length} OF {documents.length} SECURE ASSETS
        </div>

      </div>

      {/* Main Grid View */}
      {filteredDocs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredDocs.map((doc, i) => (
              <motion.div
                key={doc.id}
                id={`document-card-${doc.id}`}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.25, delay: i * 0.03 }}
                className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden group card-shadow flex flex-col justify-between h-[340px]"
              >
                
                {/* Visual Header featuring hotlinked background */}
                <div className="relative h-44 bg-slate-100 overflow-hidden shrink-0">
                  <img 
                    src={doc.bgImageUrl} 
                    alt={doc.altText} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/20" />
                  
                  {/* Category badge */}
                  <div className="absolute top-3 left-3 px-2 py-0.5 bg-slate-900/90 backdrop-blur-sm rounded-lg text-[9px] font-mono font-bold uppercase tracking-wider text-brand-accent-light border border-slate-800">
                    {doc.category}
                  </div>

                  {/* Document Size label */}
                  <div className="absolute bottom-3 right-3 px-2 py-0.5 bg-black/55 backdrop-blur-sm rounded font-mono text-[9px] text-white font-semibold">
                    {doc.size}
                  </div>
                </div>

                {/* Body Details */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm text-slate-800 line-clamp-1 group-hover:text-brand-steel transition-colors font-display" title={doc.title}>
                      {doc.title}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-mono">
                      INDEXED: {doc.date}
                    </p>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-normal font-medium italic">
                      "{doc.altText.split('.')[0]}."
                    </p>
                  </div>

                  {/* Actions Tray */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-2">
                    {/* View Button */}
                    <button
                      id={`btn-view-${doc.id}`}
                      onClick={() => setActivePreviewDoc(doc)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>INSPECT</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      {/* Promote / Verify timeline button */}
                      <button
                        id={`btn-verify-${doc.id}`}
                        onClick={() => handlePromote(doc)}
                        className={`p-1.5 rounded-lg text-slate-500 transition-all cursor-pointer ${
                          isPromotedNotification === doc.id
                            ? 'bg-emerald-100 text-emerald-600'
                            : 'hover:bg-amber-100 hover:text-amber-600'
                        }`}
                        title="Promote and index directly as Verified Career Milestone"
                      >
                        {isPromotedNotification === doc.id ? (
                          <FileCheck2 className="w-4.5 h-4.5" />
                        ) : (
                          <Award className="w-4.5 h-4.5" />
                        )}
                      </button>

                      {/* Delete button */}
                      <button
                        id={`btn-delete-${doc.id}`}
                        onClick={() => onDeleteDocument(doc.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                        title="Discard and shred from safe"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    </div>

                  </div>
                </div>

              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 card-shadow flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4 border border-slate-200/50">
            <Compass className="w-8 h-8" />
          </div>
          <h3 className="font-semibold text-lg text-slate-800 font-display">No Secure Assets Found</h3>
          <p className="text-sm text-slate-500 max-w-sm mt-1">
            We couldn't find any documents matching category "{selectedCategory}" or query "{searchQuery}".
          </p>
        </div>
      )}

      {/* Dynamic Detail Modal Panel */}
      <AnimatePresence>
        {activePreviewDoc && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl overflow-hidden max-w-2xl w-full border border-slate-200 shadow-2xl relative"
            >
              
              {/* Close Button */}
              <button
                id="modal-close-btn"
                onClick={() => setActivePreviewDoc(null)}
                className="absolute top-4 right-4 p-2 bg-slate-900/10 hover:bg-slate-900/20 text-slate-700 hover:text-slate-900 rounded-full z-10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* High resolution hotlinked banner */}
              <div className="h-64 bg-slate-900 relative">
                <img 
                  src={activePreviewDoc.bgImageUrl} 
                  alt={activePreviewDoc.altText} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
                <div className="absolute bottom-4 left-6">
                  <span className="px-2 py-0.5 bg-brand-steel text-white rounded font-mono text-[9px] font-bold uppercase border border-white/20">
                    {activePreviewDoc.category}
                  </span>
                  <h3 className="text-xl font-bold text-white mt-1.5 font-display">
                    {activePreviewDoc.title}
                  </h3>
                </div>
              </div>

              {/* Content Description */}
              <div className="p-6 space-y-5 text-left">
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/50 font-mono text-xs text-slate-600">
                  <div>
                    <span className="text-slate-400 block uppercase text-[10px]">Indexed Date</span>
                    <strong className="text-slate-800">{activePreviewDoc.date}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block uppercase text-[10px]">Cryptographic Size</span>
                    <strong className="text-slate-800">{activePreviewDoc.size}</strong>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider font-mono">Verified Artifact Description</h4>
                  <p className="text-sm text-slate-600 leading-relaxed font-medium">
                    {activePreviewDoc.altText}
                  </p>
                </div>

                {/* Integration triggers */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                    <Lock className="w-4 h-4 text-emerald-500" />
                    <span>CLIENT-SIDE LOCK VERIFIED</span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      id="modal-promote-btn"
                      onClick={() => {
                        handlePromote(activePreviewDoc);
                        setActivePreviewDoc(null);
                      }}
                      className="px-4 py-2 bg-brand-steel hover:bg-brand-blue text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-md"
                    >
                      <Award className="w-4 h-4" />
                      <span>Promote to Verified Milestone</span>
                    </button>
                  </div>
                </div>

              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
