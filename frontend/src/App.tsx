/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// Core Type Definitions & API
import { Document, TimelineMilestone, RecentUpload } from './types';
import { apiClient, convertBackendToFrontendDoc, BackendDocument, BackendTimelineEvent } from './api';

// Modular Components
import LoginScreen from './components/LoginScreen';
import Sidebar, { ViewType } from './components/Sidebar';
import Header from './components/Header';
import DashboardView from './components/DashboardView';
import LibraryView from './components/LibraryView';
import IngestionView from './components/IngestionView';
import GraphView from './components/GraphView';
import TimelineView from './components/TimelineView';
import SearchChatView from './components/SearchChatView';
import InsightsView from './components/InsightsView';
import PortfolioView from './components/PortfolioView';

export default function App() {
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  
  // Dynamic collections stored in local React state for interactive reactivity
  const [documents, setDocuments] = useState<Document[]>([]);
  const [milestones, setMilestones] = useState<TimelineMilestone[]>([]);
  const [recentUploads, setRecentUploads] = useState<RecentUpload[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch data from backend on mount
  useEffect(() => {
    if (isUnlocked) {
      fetchInitialData();
    }
  }, [isUnlocked]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      
      // Fetch documents
      const backendDocs = await apiClient.getDocuments(100);
      const frontendDocs = backendDocs.map(convertBackendToFrontendDoc);
      setDocuments(frontendDocs);

      // Fetch timeline events
      const backendEvents = await apiClient.getTimelineEvents();
      const frontendMilestones = backendEvents.map(convertBackendToMilestone);
      setMilestones(frontendMilestones);

      // Create recent uploads from documents
      const recent = frontendDocs.slice(0, 5).map(doc => ({
        id: `ru-${doc.id}`,
        title: doc.title,
        date: doc.date,
        category: doc.category,
        type: 'project' as const
      }));
      setRecentUploads(recent);

    } catch (error) {
      console.error('Failed to fetch initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const convertBackendToMilestone = (event: BackendTimelineEvent): TimelineMilestone => {
    let badgeUrl = "https://lh3.googleusercontent.com/aida-public/AB6AXuAy9xbmGwto9Mn2K7Dt3ORZReCR0-e0v6BwELK1Luk709lreH5b9n62JAbZvnZmniFbPc8WmVT8YEjDa2TSZjVnSpkZFx0v1Pozy-OuETTCqkF_OtkGXmLFzahYobsWqiHk_a9OOiSEms7M1FHg5FjeTJ1_6b3FeZiQYcEHjZjsb8rIW_wGJUmE1x8TJmH92qrhs-FLKQkvhxowvnTY4Vad7V5hnzfgJRccKsls6-C7vWhSxSDguuHXCWcMWQtRIX41d7E0pAt9Gg";
    let bColor = 'border-amber-500';
    let cTheme: 'amber' | 'teal' | 'purple' | 'blue' = 'amber';

    if (event.event_type === 'experience') {
      badgeUrl = "https://lh3.googleusercontent.com/aida-public/AB6AXuC-qLLlgbHP1xLgfErflWkXxxP84Pfy6cXauuVWTDekerxRmUSL000Q9v7sCm1ouGeiHHeVQZSjjeyOS4PivCbY7LWtBA2Ao9tNiekq7oDVcglxNJm4gWScAHGukKoSVGPv_1po9KLifyXM_AWuF1rNRVmx_egjoeKsNDVPW4vyX9_m1XJIcv8cLOqd1flVy9PYEZ-MXGYRWDEkwNtMYA-hBIvmfV0zJEwC6aeZ4NRzTOVD_6fkKDyS9YTPfsVTMCD0PwU0gHq3UMA";
      bColor = 'border-teal-500';
      cTheme = 'teal';
    } else if (event.event_type === 'academic') {
      badgeUrl = "https://lh3.googleusercontent.com/aida-public/AB6AXuCR2cW0H_8qVQFAT4nXTlaNN-h_svoFMhrdZ6xl4RBQMLqcQIU-_VvmRgBn72Jgkh8vyP72W-4HaRWDUoK_wDAXJrVBfkFV-BW5Ud-Fw7KqGL5s8mN0s2j6i5fGJXBR0U892q0dEj0tsK61A8WsgJROq26jhnhp_ZfegNJPMz7vhmaBbT0phOL8pFn3R_eXSJxGx9ez0kyqdJBVsoJ0NHkI5xWrsinU78cPTNkUDQuP6Bv0K0hEKlslrRzJwq5EhZFOMhSdGZbhCQ";
      bColor = 'border-purple-500';
      cTheme = 'purple';
    } else if (event.event_type === 'project') {
      badgeUrl = "https://lh3.googleusercontent.com/aida-public/AB6AXuDmbgL4ET3atAJfsh45XukausFAlWsMMBgYQEkHqbs8S2PYiSjsUGh8g2D5xZfxfPFnpa-CrqrpEPmhS8DjiwX-UTTkvycOXr-xFr1iUFBE2-I9dCjJNbJ6xzfq6vw4jz0MdON2PypT0NrRlXmzaIiJkwvarM9yVrESGkOsvFGZ74KgUWTou5wZa3MQOr--mWo_9RUhfxs4ilPC-HBVMZfq2qfjBWNH3ep17RffoJfLPUlcSHYQt1UK6dlxFXw5AEgzXuxcw5kxdA";
      bColor = 'border-blue-500';
      cTheme = 'blue';
    }

    return {
      id: event.id.toString(),
      title: event.title,
      date: new Date(event.event_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      category: event.event_type === 'project' ? 'Portfolio' : event.event_type === 'academic' ? 'Experience' : 'Certification',
      description: event.description || '',
      source: 'Internal Safe Audited promotion',
      badgeUrl: badgeUrl,
      borderColor: bColor,
      colorTheme: cTheme
    };
  };

  // Lock session safe, erasing temporary states to enforce physical vault motif
  const handleLockSafe = () => {
    apiClient.clearToken();
    setIsUnlocked(false);
    setCurrentView('dashboard');
    setSearchQuery('');
    setDocuments([]);
    setMilestones([]);
    setRecentUploads([]);
  };

  // Add parsed file from Ingestion portal
  const handleAddDocument = async (newDoc: Document) => {
    try {
      // In a real implementation, this would upload the file to the backend
      // For now, just add to local state
      setDocuments((prev) => [newDoc, ...prev]);

      // Track newly digested elements in feed list
      const newUploadRow: RecentUpload = {
        id: `ru-${Date.now()}`,
        title: newDoc.title,
        date: 'Modified Just Now',
        category: newDoc.category,
        type: 'project'
      };
      setRecentUploads((prev) => [newUploadRow, ...prev]);
    } catch (error) {
      console.error('Failed to add document:', error);
    }
  };

  // Shred and declassify file from active safe state
  const handleDeleteDocument = async (id: string) => {
    try {
      await apiClient.deleteDocument(parseInt(id));
      setDocuments((prev) => prev.filter(doc => doc.id !== id));
    } catch (error) {
      console.error('Failed to delete document:', error);
    }
  };

  // Promote a safe document into timeline certificate milestone
  const handlePromoteToTimeline = (doc: Document) => {
    // Prevent duplicate entries
    const exists = milestones.some(ms => ms.title === doc.title);
    if (exists) return;

    // Default medal graphics matching category themes
    let badgeUrl = "https://lh3.googleusercontent.com/aida-public/AB6AXuAy9xbmGwto9Mn2K7Dt3ORZReCR0-e0v6BwELK1Luk709lreH5b9n62JAbZvnZmniFbPc8WmVT8YEjDa2TSZjVnSpkZFx0v1Pozy-OuETTCqkF_OtkGXmLFzahYobsWqiHk_a9OOiSEms7M1FHg5FjeTJ1_6b3FeZiQYcEHjZjsb8rIW_wGJUmE1x8TJmH92qrhs-FLKQkvhxowvnTY4Vad7V5hnzfgJRccKsls6-C7vWhSxSDguuHXCWcMWQtRIX41d7E0pAt9Gg";
    let bColor = 'border-amber-500';
    let cTheme: 'amber' | 'teal' | 'purple' | 'blue' = 'amber';

    if (doc.category === 'Professional') {
      badgeUrl = "https://lh3.googleusercontent.com/aida-public/AB6AXuC-qLLlgbHP1xLgfErflWkXxxP84Pfy6cXauuVWTDekerxRmUSL000Q9v7sCm1ouGeiHHeVQZSjjeyOS4PivCbY7LWtBA2Ao9tNiekq7oDVcglxNJm4gWScAHGukKoSVGPv_1po9KLifyXM_AWuF1rNRVmx_egjoeKsNDVPW4vyX9_m1XJIcv8cLOqd1flVy9PYEZ-MXGYRWDEkwNtMYA-hBIvmfV0zJEwC6aeZ4NRzTOVD_6fkKDyS9YTPfsVTMCD0PwU0gHq3UMA";
      bColor = 'border-teal-500';
      cTheme = 'teal';
    } else if (doc.category === 'Academic') {
      badgeUrl = "https://lh3.googleusercontent.com/aida-public/AB6AXuCR2cW0H_8qVQFAT4nXTlaNN-h_svoFMhrdZ6xl4RBQMLqcQIU-_VvmRgBn72Jgkh8vyP72W-4HaRWDUoK_wDAXJrVBfkFV-BW5Ud-Fw7KqGL5s8mN0s2j6i5fGJXBR0U892q0dEj0tsK61A8WsgJROq26jhnhp_ZfegNJPMz7vhmaBbT0phOL8pFn3R_eXSJxGx9ez0kyqdJBVsoJ0NHkI5xWrsinU78cPTNkUDQuP6Bv0K0hEKlslrRzJwq5EhZFOMhSdGZbhCQ";
      bColor = 'border-purple-500';
      cTheme = 'purple';
    } else if (doc.category === 'Design') {
      badgeUrl = "https://lh3.googleusercontent.com/aida-public/AB6AXuDmbgL4ET3atAJfsh45XukausFAlWsMMBgYQEkHqbs8S2PYiSjsUGh8g2D5xZfxfPFnpa-CrqrpEPmhS8DjiwX-UTTkvycOXr-xFr1iUFBE2-I9dCjJNbJ6xzfq6vw4jz0MdON2PypT0NrRlXmzaIiJkwvarM9yVrESGkOsvFGZ74KgUWTou5wZa3MQOr--mWo_9RUhfxs4ilPC-HBVMZfq2qfjBWNH3ep17RffoJfLPUlcSHYQt1UK6dlxFXw5AEgzXuxcw5kxdA";
      bColor = 'border-blue-500';
      cTheme = 'blue';
    }

    const newMs: TimelineMilestone = {
      id: `ms-${Date.now()}`,
      title: doc.title,
      date: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      category: doc.category === 'Design' ? 'Portfolio' : doc.category === 'Academic' ? 'Experience' : 'Certification',
      description: doc.altText,
      source: 'Internal Safe Audited promotion',
      badgeUrl: badgeUrl,
      borderColor: bColor,
      colorTheme: cTheme
    };

    setMilestones((prev) => [newMs, ...prev]);
  };

  const handleSelectDocFromOutside = (doc: Document) => {
    // Helper to open library page and highlight search query on selected file
    setCurrentView('library');
    setSearchQuery(doc.title);
  };

  // Add milestone from form
  const handleAddMilestoneFromForm = async (newMs: TimelineMilestone) => {
    try {
      const backendEvent = {
        event_type: newMs.category.toLowerCase(),
        title: newMs.title,
        description: newMs.description,
        event_date: new Date().toISOString(),
        importance: 1.0
      };
      
      const createdEvent = await apiClient.createTimelineEvent(backendEvent);
      const frontendMs = convertBackendToMilestone(createdEvent);
      setMilestones((prev) => [frontendMs, ...prev]);
    } catch (error) {
      console.error('Failed to add milestone:', error);
    }
  };

  // Unlock transition
  const handleUnlockSuccessful = () => {
    setIsUnlocked(true);
  };

  // Active View Panel Router
  const renderActiveView = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-steel mx-auto mb-4"></div>
            <p className="text-slate-500 font-mono text-sm">Loading vault contents...</p>
          </div>
        </div>
      );
    }

    switch (currentView) {
      case 'dashboard':
        return (
          <DashboardView 
            documents={documents} 
            recentUploads={recentUploads} 
            milestones={milestones}
            onViewChange={setCurrentView}
            onSelectDocument={handleSelectDocFromOutside}
          />
        );
      case 'library':
        return (
          <LibraryView 
            documents={documents}
            onDeleteDocument={handleDeleteDocument}
            onPromoteToTimeline={handlePromoteToTimeline}
            searchQuery={searchQuery}
          />
        );
      case 'ingestion':
        return (
          <IngestionView 
            onAddDocument={handleAddDocument}
            onViewChange={setCurrentView}
          />
        );
      case 'graph':
        return (
          <GraphView />
        );
      case 'timeline':
        return (
          <TimelineView 
            milestones={milestones}
            onAddMilestone={handleAddMilestoneFromForm}
          />
        );
      case 'search':
        return (
          <SearchChatView 
            documents={documents}
            onSelectDocument={handleSelectDocFromOutside}
          />
        );
      case 'insights':
        return (
          <InsightsView />
        );
      case 'portfolio':
        return (
          <PortfolioView 
            milestones={milestones}
          />
        );
      default:
        return (
          <DashboardView 
            documents={documents} 
            recentUploads={recentUploads} 
            milestones={milestones}
            onViewChange={setCurrentView}
            onSelectDocument={handleSelectDocFromOutside}
          />
        );
    }
  };

  return (
    <div id="application-container-root">
      <AnimatePresence mode="wait">
        {!isUnlocked ? (
          <motion.div 
            key="lock-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <LoginScreen onUnlock={handleUnlockSuccessful} />
          </motion.div>
        ) : (
          <motion.div 
            key="vault-shell"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex min-h-screen bg-slate-100"
          >
            {/* Left Nav Menu (collapses automatically on small viewports) */}
            <Sidebar 
              currentView={currentView} 
              onViewChange={setCurrentView} 
              onLock={handleLockSafe}
              documentCount={documents.length}
            />

            {/* Core Viewport Content Stage */}
            <div className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-0">
              
              {/* Upper Navigation Hub */}
              <Header 
                currentView={currentView} 
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                documentCount={documents.length}
              />

              {/* Central View Transition Canvas */}
              <main id="main-view-stage" className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentView}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.2 }}
                  >
                    {renderActiveView()}
                  </motion.div>
                </AnimatePresence>
              </main>

            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
