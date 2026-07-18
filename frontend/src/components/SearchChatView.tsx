/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Send, 
  Sparkles, 
  Bot, 
  User, 
  FileText, 
  ArrowUpRight, 
  Terminal, 
  Compass,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  RefreshCw,
  Clock,
  ExternalLink,
  MessageSquareCode
} from 'lucide-react';
import { ChatMessage, Document } from '../types';
import { defaultChatHistory } from '../data';

interface SearchChatViewProps {
  documents: Document[];
  onSelectDocument: (doc: Document) => void;
}

export default function SearchChatView({ documents, onSelectDocument }: SearchChatViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(defaultChatHistory);
  const [inputValue, setInputValue] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const suggestionPrompts = [
    { text: "Highlight lease renewal terms", subtitle: "2023 Lease Agreement" },
    { text: "Summarize ML Research Paper", subtitle: "Academic publication" },
    { text: "Inspect tax documents size", subtitle: "Tax Return 2023 audit" },
    { text: "Are there any pending certs?", subtitle: "Coursera credential" }
  ];

  // Auto scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  const handleSend = (text: string) => {
    if (!text.trim() || isGenerating) return;

    // Append user message
    const userMsg: ChatMessage = {
      id: `chat-${Date.now()}`,
      sender: 'user',
      text: text
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsGenerating(true);

    // Dynamic, realistic search-aware responses!
    setTimeout(() => {
      const lowerText = text.toLowerCase();
      let botReply = "I have scanned your IdentityVault sandbox. I could not find a specific match for your request. Try asking about your 'lease agreement', 'ML research paper', 'tax return', or 'professional certifications'.";
      let matchedDocs: ChatMessage['documents'] = [];

      // Smart semantic trigger routing
      if (lowerText.includes('lease') || lowerText.includes('renewal')) {
        const docMatch = documents.find(d => d.title.toLowerCase().includes('lease'));
        botReply = "I've successfully scanned your **Apartment Lease Agreement**. Under **Section 14.2 (Renewal Options)**, the contract states that a 60-day notice is required before lease expiration on Dec 31st. All rent payments must remain synchronized via the landlord ACH portal.";
        if (docMatch) {
          matchedDocs.push({
            title: docMatch.title,
            size: docMatch.size,
            date: docMatch.date,
            iconType: 'pdf'
          });
        }
      } else if (lowerText.includes('ml') || lowerText.includes('research') || lowerText.includes('paper')) {
        const docMatch = documents.find(d => d.title.toLowerCase().includes('ml') || d.title.toLowerCase().includes('research'));
        botReply = "Your **ML Research Paper** (Category: Academic) has been successfully audited. The abstract focuses on optimizing latency for distributed deep neural network models. The file checksum signature has been cryptographically signed.";
        if (docMatch) {
          matchedDocs.push({
            title: docMatch.title,
            size: docMatch.size,
            date: docMatch.date,
            iconType: 'pdf'
          });
        }
      } else if (lowerText.includes('tax') || lowerText.includes('finance') || lowerText.includes('return')) {
        const docMatch = documents.find(d => d.title.toLowerCase().includes('tax'));
        botReply = "I parsed your **Tax Return 2023** secure file. It represents a fully locked financial disclosure document of 0.8 MB size, filed on Jan 15, 2024. Your adjusted gross figures align with previous standard records.";
        if (docMatch) {
          matchedDocs.push({
            title: docMatch.title,
            size: docMatch.size,
            date: docMatch.date,
            iconType: 'pdf'
          });
        }
      } else if (lowerText.includes('cert') || lowerText.includes('ux') || lowerText.includes('coursera')) {
        const docMatch = documents.find(d => d.title.toLowerCase().includes('cert') || d.title.toLowerCase().includes('ux'));
        botReply = "Your **Coursera UX Certification** (1.1 MB, Sep 28, 2023) is securely indexed. It verifies master-level credentials in interaction design, accessibility rules, and user research protocols. It is promoted to your Career Milestone Timeline.";
        if (docMatch) {
          matchedDocs.push({
            title: docMatch.title,
            size: docMatch.size,
            date: docMatch.date,
            iconType: 'pdf'
          });
        }
      } else if (lowerText.includes('hello') || lowerText.includes('hi ')) {
        botReply = "Hello Elena! I am your interactive IdentityVault Copilot. I scan, parse, and verify documents in your secure sandbox. How can I assist you with your assets or skill matching today?";
      }

      const assistantMsg: ChatMessage = {
        id: `chat-${Date.now() + 1}`,
        sender: 'assistant',
        text: botReply,
        documents: matchedDocs.length > 0 ? matchedDocs : undefined
      };

      setMessages(prev => [...prev, assistantMsg]);
      setIsGenerating(false);
    }, 1500);
  };

  return (
    <div id="search-chat-root" className="grid grid-cols-1 lg:grid-cols-4 gap-6 select-none font-sans pb-12 text-left h-[calc(100vh-140px)]">
      
      {/* Suggestions Rail (Col-span 1) */}
      <div className="lg:col-span-1 hidden lg:flex flex-col gap-4">
        
        {/* Suggestion header */}
        <div className="bg-slate-900 text-slate-100 p-5 rounded-3xl border border-slate-800 space-y-2 card-shadow">
          <div className="flex items-center gap-1.5 text-xs text-brand-steel font-mono font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span>AI Copilot Suggestions</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-normal font-medium">
            IdentityVault indexes your safe artifacts, allowing you to run complex semantic questions. Click any prompt below:
          </p>
        </div>

        {/* Suggestion Cards */}
        <div className="space-y-2.5">
          {suggestionPrompts.map((sug, i) => (
            <button
              key={i}
              id={`sug-prompt-${i}`}
              onClick={() => handleSend(sug.text)}
              className="w-full bg-white p-4 rounded-2xl border border-slate-200/80 hover:border-brand-steel/50 transition-all card-shadow text-left group flex flex-col justify-between hover:shadow-md cursor-pointer active:scale-99"
            >
              <div className="flex justify-between items-start">
                <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest block">
                  {sug.subtitle}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-brand-steel group-hover:translate-x-1 transition-all" />
              </div>
              <h4 className="font-bold text-xs text-slate-800 group-hover:text-brand-steel transition-colors font-display tracking-tight mt-2">
                "{sug.text}"
              </h4>
            </button>
          ))}
        </div>

      </div>

      {/* Main Interactive Chat Room (Col-span 3) */}
      <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-200/80 card-shadow overflow-hidden flex flex-col h-full relative">
        
        {/* Header HUD panel */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-brand-navy/10 rounded-xl text-brand-navy animate-pulse-safe">
              <Bot className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800 font-display">Semantic Secure Chat</h3>
              <p className="text-[9px] font-mono text-emerald-600 font-bold uppercase tracking-wider mt-0.5">VAULT COPILOT • ONLINE</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-200 rounded font-mono text-[9px] text-slate-500 font-bold">
            <Terminal className="w-3.5 h-3.5 text-slate-400" />
            <span>MODEL: GEMINI FLASH</span>
          </div>
        </div>

        {/* Conversation Bubbles Feed */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin">
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              const isBot = msg.sender === 'assistant';
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 max-w-[85%] ${isBot ? 'mr-auto text-left' : 'ml-auto flex-row-reverse text-right'}`}
                >
                  
                  {/* Avatar Icon */}
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center border shrink-0 ${
                    isBot 
                      ? 'bg-slate-900 border-slate-800 text-slate-100' 
                      : 'bg-brand-navy border-brand-steel/20 text-white'
                  }`}>
                    {isBot ? <Bot className="w-4.5 h-4.5" /> : <User className="w-4.5 h-4.5" />}
                  </div>

                  <div className="space-y-2">
                    {/* Message Card Bubble */}
                    <div className={`p-4 rounded-2xl border text-xs leading-relaxed ${
                      isBot 
                        ? 'bg-slate-50 border-slate-200/60 text-slate-800 font-medium' 
                        : 'bg-brand-steel border-brand-steel/40 text-white font-semibold'
                    }`}>
                      <p className="whitespace-pre-line">{msg.text}</p>
                    </div>

                    {/* Attached file matching widgets inside message */}
                    {msg.documents && (
                      <div className="grid grid-cols-1 gap-2">
                        {msg.documents.map((att, idx) => {
                          const docObj = documents.find(d => d.title.toLowerCase().includes(att.title.split('.')[0].toLowerCase()));
                          return (
                            <div 
                              key={idx}
                              id={`chat-attachment-${idx}`}
                              onClick={() => docObj && onSelectDocument(docObj)}
                              className="p-3 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between gap-3 cursor-pointer shadow-sm active:scale-99 transition-all text-left"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="p-2 bg-rose-100 text-rose-700 rounded-lg shrink-0">
                                  <FileText className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-slate-800 truncate">{att.title}</p>
                                  <p className="text-[9px] text-slate-400 font-mono mt-0.5">{att.size} • Verified {att.date}</p>
                                </div>
                              </div>
                              <ArrowUpRight className="w-4 h-4 text-slate-400 shrink-0" />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                </motion.div>
              );
            })}

            {/* Waiting loader indicator */}
            {isGenerating && (
              <motion.div
                key="loader"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3 max-w-[85%] mr-auto text-left"
              >
                <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 flex items-center justify-center shrink-0">
                  <Bot className="w-4.5 h-4.5" />
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 text-xs text-slate-500 font-medium flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 text-brand-steel animate-spin" />
                  <span>DECRYPTING SECURE CHIP KEY...</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={scrollRef} />
        </div>

        {/* Keyboard Input Bar Panel */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50 shrink-0">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(inputValue);
            }} 
            className="flex items-center gap-3 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm"
          >
            <input
              id="chat-input-field"
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask anything about your lease agreement, tax return, or papers..."
              className="flex-1 bg-transparent text-xs pl-3 outline-none font-medium text-slate-800"
            />
            <button
              id="chat-submit-btn"
              type="submit"
              disabled={!inputValue.trim() || isGenerating}
              className="p-2.5 bg-brand-steel hover:bg-brand-blue disabled:bg-slate-100 text-white disabled:text-slate-300 rounded-xl transition-all cursor-pointer shadow active:scale-95 flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="text-[9px] font-mono text-slate-400 text-center mt-2 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>AI insights are synthesized strictly within your browser sandbox. Your inputs are isolated.</span>
          </div>
        </div>

      </div>

    </div>
  );
}
