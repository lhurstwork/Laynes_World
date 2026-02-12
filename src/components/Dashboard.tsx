import React, { useState, useEffect, useCallback } from 'react';
import { WidgetType, type WidgetConfig } from '../types';
import { YouTubeWidget } from './YouTubeWidget';
import { DealsWidget } from './DealsWidget';
import WidgetWrapper from './WidgetWrapper';
import './Dashboard.css';

interface DashboardProps {
  useMockData?: boolean;
}

interface WidgetState {
  id: string;
  type: WidgetType;
  title: string;
  isLoading: boolean;
  error: Error | null;
  lastRefresh?: Date;
  refreshInterval?: number; // in milliseconds
}

const Dashboard: React.FC<DashboardProps> = ({ useMockData = true }) => {
  const [widgetStates, setWidgetStates] = useState<Map<string, WidgetState>>(new Map());
  const [globalError, setGlobalError] = useState<Error | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Widget registry configuration with refresh intervals
  const widgetConfigs: WidgetConfig[] = [
    {
      id: 'news-widget',
      type: WidgetType.NEWS,
      title: 'News Aggregator',
      position: 1,
      enabled: false // Not yet implemented
    },
    {
      id: 'tasks-widget',
      type: WidgetType.TASKS,
      title: 'Task Manager',
      position: 2,
      enabled: false // Not yet implemented
    },
    {
      id: 'calendar-widget',
      type: WidgetType.CALENDAR,
      title: 'Calendar',
      position: 3,
      enabled: false // Not yet implemented
    },
    {
      id: 'youtube-widget',
      type: WidgetType.YOUTUBE,
      title: 'YouTube Feed',
      position: 4,
      enabled: true
    },
    {
      id: 'deals-widget',
      type: WidgetType.DEALS,
      title: 'Tech Deals',
      position: 5,
      enabled: true
    }
  ];

  // Refresh intervals for each widget type (in milliseconds)
  const refreshIntervals: Record<WidgetType, number> = {
    [WidgetType.NEWS]: 15 * 60 * 1000, // 15 minutes
    [WidgetType.TASKS]: 0, // No auto-refresh (manual only)
    [WidgetType.CALENDAR]: 30 * 60 * 1000, // 30 minutes
    [WidgetType.YOUTUBE]: 60 * 60 * 1000, // 1 hour
    [WidgetType.DEALS]: 24 * 60 * 60 * 1000 // 24 hours (daily)
  };

  // Handle widget loading state updates
  const handleWidgetLoadingChange = useCallback((widgetId: string, isLoading: boolean) => {
    setWidgetStates(prev => {
      const newStates = new Map(prev);
      const state = newStates.get(widgetId);
      if (state) {
        newStates.set(widgetId, { ...state, isLoading });
      }
      return newStates;
    });
  }, []);

  // Handle widget errors
  const handleWidgetError = useCallback((widgetId: string, error: Error) => {
    setWidgetStates(prev => {
      const newStates = new Map(prev);
      const state = newStates.get(widgetId);
      if (state) {
        newStates.set(widgetId, { ...state, error, isLoading: false });
      }
      return newStates;
    });
  }, []);

  // Handle widget retry
  const handleWidgetRetry = useCallback((widgetId: string) => {
    setWidgetStates(prev => {
      const newStates = new Map(prev);
      const state = newStates.get(widgetId);
      if (state) {
        newStates.set(widgetId, { 
          ...state, 
          error: null, 
          isLoading: true,
          lastRefresh: new Date()
        });
      }
      return newStates;
    });
  }, []);

  // Initialize widget states
  useEffect(() => {
    const initializeWidgets = async () => {
      try {
        const initialStates = new Map<string, WidgetState>();
        
        widgetConfigs.forEach(config => {
          if (config.enabled) {
            initialStates.set(config.id, {
              id: config.id,
              type: config.type,
              title: config.title,
              isLoading: true,
              error: null,
              lastRefresh: new Date(),
              refreshInterval: refreshIntervals[config.type]
            });
          }
        });

        setWidgetStates(initialStates);
        setIsInitializing(false);
      } catch (error) {
        setGlobalError(error as Error);
        setIsInitializing(false);
      }
    };

    initializeWidgets();
  }, []);

  // Set up automatic refresh intervals for widgets
  useEffect(() => {
    const intervals: number[] = [];

    widgetStates.forEach((state, widgetId) => {
      if (state.refreshInterval && state.refreshInterval > 0) {
        const intervalId = window.setInterval(() => {
          handleWidgetRetry(widgetId);
        }, state.refreshInterval);
        intervals.push(intervalId);
      }
    });

    // Cleanup intervals on unmount
    return () => {
      intervals.forEach(interval => clearInterval(interval));
    };
  }, [widgetStates, handleWidgetRetry]);

  // Render widget based on type
  const renderWidget = (config: WidgetConfig) => {
    const state = widgetStates.get(config.id);
    
    if (!state || !config.enabled) {
      return null;
    }

    let widgetContent;
    switch (config.type) {
      case WidgetType.YOUTUBE:
        widgetContent = (
          <YouTubeWidget
            useMockData={useMockData}
            onLoadingChange={(isLoading) => handleWidgetLoadingChange(config.id, isLoading)}
            onError={(error) => handleWidgetError(config.id, error)}
          />
        );
        break;
      case WidgetType.DEALS:
        widgetContent = (
          <DealsWidget
            useMockData={useMockData}
            onLoadingChange={(isLoading) => handleWidgetLoadingChange(config.id, isLoading)}
            onError={(error) => handleWidgetError(config.id, error)}
          />
        );
        break;
      default:
        widgetContent = <div>Unknown widget type</div>;
    }

    return (
      <WidgetWrapper
        widgetId={config.id}
        title={config.title}
        isLoading={state.isLoading}
        error={state.error}
        onRefresh={() => handleWidgetRetry(config.id)}
        onRetry={() => handleWidgetRetry(config.id)}
      >
        {widgetContent}
      </WidgetWrapper>
    );
  };

  // Global error display
  if (globalError) {
    return (
      <div className="dashboard-error" role="alert" aria-live="assertive">
        <div className="error-container">
          <h2>Dashboard Error</h2>
          <p>{globalError.message}</p>
          <button 
            onClick={() => window.location.reload()}
            aria-label="Reload dashboard"
          >
            Reload Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Initial loading state
  if (isInitializing) {
    return (
      <div className="dashboard-loading" role="status" aria-live="polite">
        <div className="loading-spinner" aria-hidden="true"></div>
        <p>Initializing dashboard...</p>
        <span className="sr-only">Loading dashboard content</span>
      </div>
    );
  }

  return (
    <div className="dashboard" role="main" aria-label="Layne's World Dashboard">
      <a href="#main-content" className="skip-to-main sr-only">
        Skip to main content
      </a>
      
      <header className="dashboard-header" role="banner">
        <h1>Layne's World Dashboard</h1>
      </header>
      
      <main id="main-content" className="dashboard-content">
        <div className="widgets-grid" role="region" aria-label="Dashboard widgets">
          {widgetConfigs
            .filter(config => config.enabled)
            .sort((a, b) => a.position - b.position)
            .map(config => (
              <React.Fragment key={config.id}>
                {renderWidget(config)}
              </React.Fragment>
            ))}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
