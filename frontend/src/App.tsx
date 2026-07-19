import React, { useState, useEffect } from 'react';
import { apiClient } from './api';
import './styles.css';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardView from './components/DashboardView';
import LibraryView from './components/LibraryView';
import IngestionView from './components/IngestionView';
import SearchView from './components/SearchView';
import TimelineView from './components/TimelineView';
import GraphView from './components/GraphView';
import InsightsView from './components/InsightsView';
import PortfolioView from './components/PortfolioView';
import LoginScreen from './components/LoginScreen';
import SettingsView from './components/SettingsView';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) {
      apiClient.setToken(token);
      setIsAuthenticated(true);
    }

    // Handle OAuth callback (Google / Notion redirect)
    const params = new URLSearchParams(window.location.search);
    if (params.get('integration') === 'success') {
      setCurrentView('settings');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    apiClient.clearToken();
    setIsAuthenticated(false);
    setCurrentView('dashboard');
  };

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':  return <DashboardView />;
      case 'library':    return <LibraryView />;
      case 'ingestion':  return <IngestionView />;
      case 'search':     return <SearchView />;
      case 'timeline':   return <TimelineView />;
      case 'graph':      return <GraphView />;
      case 'insights':   return <InsightsView />;
      case 'portfolio':  return <PortfolioView />;
      case 'settings':   return <SettingsView />;
      default:           return <DashboardView />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      <div className="main-content">
        <Header
          currentView={currentView}
          onViewChange={setCurrentView}
          onLogout={handleLogout}
        />
        <div className="content-area">
          {renderView()}
        </div>
      </div>
    </div>
  );
}