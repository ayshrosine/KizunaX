/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, ShieldCheck, Lock, Unlock, Mail, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { IDENTITY_VAULT_LOGO } from '../data';
import { apiClient } from '../api';

interface LoginScreenProps {
  onUnlock: () => void;
}

export default function LoginScreen({ onUnlock }: LoginScreenProps) {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const handleEmailAuth = async () => {
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }

    setIsScanning(true);
    setError('');

    try {
      if (isLoginMode) {
        const response = await apiClient.login(email, password);
        apiClient.setToken(response.access_token);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        setScanSuccess(true);
        setTimeout(() => {
          onUnlock();
        }, 500);
      } else {
        // Registration
        const username = email.split('@')[0];
        await apiClient.register(email, username, password);
        
        // Auto-login after registration
        const response = await apiClient.login(email, password);
        apiClient.setToken(response.access_token);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        setScanSuccess(true);
        setTimeout(() => {
          onUnlock();
        }, 500);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
      setAttempts(prev => prev + 1);
      setIsScanning(false);
    }
  };

  useEffect(() => {
    if (apiClient['token']) {
      // Already logged in
      onUnlock();
    }
  }, [onUnlock]);

  return (
    <div id="login-screen-root" className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans select-none">
      {/* Decorative background grid and ambient glows */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(1,36,64,0.3),transparent_70%)] pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:32px_32px] opacity-40 pointer-events-none" />

      {/* Cybernetic HUD elements in corners */}
      <div className="absolute top-6 left-6 font-mono text-[10px] text-slate-500 hidden sm:block">
        <div>SYS_STATUS: ARMED</div>
        <div>IP_SECURE: 192.168.1.1</div>
      </div>
      <div className="absolute top-6 right-6 font-mono text-[10px] text-slate-500 hidden sm:block text-right">
        <div>CRYPT: AES-256</div>
        <div>VAULT_ID: IV-62F190A1</div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10"
      >
        {/* Status indicator bar */}
        <div className="flex items-center justify-between mb-8 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${error ? 'bg-rose-500 animate-pulse' : isScanning ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
            <span className="font-mono text-xs text-slate-400 uppercase tracking-widest">
              {error ? 'Access Denied' : isScanning ? 'Decrypting Key...' : scanSuccess ? 'Decrypted' : 'System Secure'}
            </span>
          </div>
          <div className="font-mono text-xs text-slate-500">
            {attempts > 0 && `Attempts: ${attempts}`}
          </div>
        </div>

        {/* Vault Brand Logo & Header */}
        <div className="text-center flex flex-col items-center mb-8">
          <div className="relative w-16 h-16 mb-4 flex items-center justify-center">
            {/* Ambient ring glow */}
            <motion.div 
              animate={{ 
                scale: isScanning ? [1, 1.15, 1] : [1, 1.05, 1],
                opacity: isScanning ? [0.4, 0.8, 0.4] : [0.2, 0.4, 0.2]
              }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute inset-0 bg-brand-steel rounded-full blur-md"
            />
            {/* Visual Icon */}
            <div className="w-16 h-16 rounded-2xl bg-brand-navy border border-brand-steel/30 flex items-center justify-center shadow-lg relative z-10">
              <img 
                src={IDENTITY_VAULT_LOGO} 
                alt="IdentityVault Logo" 
                className="w-10 h-10 object-contain brightness-125"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
          <h1 className="text-2xl font-semibold text-slate-100 font-display tracking-tight flex items-center gap-1.5 justify-center">
            Identity<span className="text-brand-steel font-normal">Vault</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-xs">
            Unlock digital safe to access verified credentials, career milestones, and portfolio assets.
          </p>
        </div>

        {/* Error Message */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              key="error"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="mb-4 p-3 bg-rose-950/30 border border-rose-800 rounded-lg text-rose-400 text-xs font-mono flex items-center gap-2"
            >
              <ShieldAlert className="w-4 h-4" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Email/Password Authentication Form */}
        <div className="space-y-4 mb-6">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full pl-10 pr-4 py-3 bg-slate-800/40 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-steel transition-colors"
              disabled={isScanning || scanSuccess}
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full pl-10 pr-12 py-3 bg-slate-800/40 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-steel transition-colors"
              disabled={isScanning || scanSuccess}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              disabled={isScanning || scanSuccess}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleEmailAuth}
          disabled={isScanning || scanSuccess || !email || !password}
          className="w-full py-3 bg-brand-navy hover:bg-brand-steel/20 text-slate-100 font-semibold rounded-xl border border-brand-steel/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-4"
        >
          {isScanning ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Authenticating...</span>
            </>
          ) : scanSuccess ? (
            <>
              <ShieldCheck className="w-5 h-5" />
              <span>Access Granted</span>
            </>
          ) : (
            <>
              <Unlock className="w-5 h-5" />
              <span>{isLoginMode ? 'Unlock Vault' : 'Create Account'}</span>
            </>
          )}
        </button>

        {/* Toggle Mode */}
        <button
          onClick={() => {
            setIsLoginMode(!isLoginMode);
            setError('');
            setEmail('');
            setPassword('');
          }}
          disabled={isScanning || scanSuccess}
          className="w-full py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          {isLoginMode ? "Don't have an account? Register" : "Already have an account? Login"}
        </button>
      </motion.div>

      {/* Subtle footer */}
      <div className="mt-8 font-mono text-[9px] text-slate-600 z-10 text-center">
        IDENTITYVAULT INC. SECURE INTERFACE ENGINE v4.0.2 • ACCREDITED FEDRAMP SYSTEM
      </div>
    </div>
  );
}
