import React, { useState, useEffect } from 'react';
import './Navigation.css';

export type NavigationTab = 'home' | 'youtube' | 'deals' | 'calendar' | 'tasks' | 'news';

interface NavigationProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    
    setTheme(initialTheme);
    document.documentElement.setAttribute('data-theme', initialTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const tabs = [
    { id: 'home' as NavigationTab, label: 'Home', icon: '🏠' },
    { id: 'youtube' as NavigationTab, label: 'YouTube', icon: '▶️' },
    { id: 'deals' as NavigationTab, label: 'Tech Deals', icon: '💰' },
    { id: 'calendar' as NavigationTab, label: 'Calendar', icon: '📅' },
    { id: 'tasks' as NavigationTab, label: 'Tasks', icon: '✓' },
    { id: 'news' as NavigationTab, label: 'News', icon: '📰' },
  ];

  return (
    <nav className="navigation" role="navigation" aria-label="Main navigation">
      <div className="navigation-container">
        <div className="navigation-brand">
          <h1 className="navigation-title">Layne's World</h1>
        </div>
        
        <div className="navigation-tabs" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`${tab.id}-panel`}
              className={`navigation-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => onTabChange(tab.id)}
            >
              <span className="tab-icon" aria-hidden="true">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </div>
    </nav>
  );
};

export default Navigation;
