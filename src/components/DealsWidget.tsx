import React, { useState, useEffect } from 'react';
import type { TechDeal } from '../types';
import { DealStatus } from '../types';
import { DealsAPIClient } from '../services/DealsAPIClient';
import { openInNewTab } from '../utils/linkHandler';
import './DealsWidget.css';

interface DealsWidgetProps {
  apiKey?: string;
  useMockData?: boolean;
  onLoadingChange?: (isLoading: boolean) => void;
  onError?: (error: Error) => void;
}

type TabType = 'current' | 'upcoming' | 'all';

export const DealsWidget: React.FC<DealsWidgetProps> = ({ 
  apiKey, 
  useMockData = true,
  onLoadingChange,
  onError
}) => {
  const [deals, setDeals] = useState<TechDeal[]>([]);
  const [selectedTab, setSelectedTab] = useState<TabType>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const apiClient = new DealsAPIClient(apiKey, useMockData);

  useEffect(() => {
    loadDeals();
    
    // Schedule daily refresh at midnight
    const scheduleDailyRefresh = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const msUntilMidnight = tomorrow.getTime() - now.getTime();
      
      const timeoutId = setTimeout(() => {
        loadDeals();
        // Schedule next refresh
        scheduleDailyRefresh();
      }, msUntilMidnight);
      
      return timeoutId;
    };
    
    const timeoutId = scheduleDailyRefresh();
    
    return () => clearTimeout(timeoutId);
  }, []);

  const loadDeals = async () => {
    setIsLoading(true);
    if (onLoadingChange) onLoadingChange(true);
    setError(null);

    try {
      const allDeals = await apiClient.fetchDeals();
      setDeals(allDeals);
      setLastRefresh(new Date());
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load deals');
      setError(error);
      if (onError) onError(error);
    } finally {
      setIsLoading(false);
      if (onLoadingChange) onLoadingChange(false);
    }
  };

  const handleRefresh = () => {
    loadDeals();
  };

  const handleDealClick = (url: string) => {
    openInNewTab(url);
  };

  const getFilteredDeals = (): TechDeal[] => {
    if (selectedTab === 'all') {
      return deals;
    }
    if (selectedTab === 'current') {
      return deals.filter(d => d.status === DealStatus.CURRENT);
    }
    if (selectedTab === 'upcoming') {
      return deals.filter(d => d.status === DealStatus.UPCOMING);
    }
    return deals;
  };

  const formatExpirationDate = (date: Date): string => {
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Expired';
    if (diffDays === 0) return 'Expires today';
    if (diffDays === 1) return 'Expires tomorrow';
    if (diffDays < 7) return `Expires in ${diffDays} days`;
    return `Expires ${date.toLocaleDateString()}`;
  };

  const formatPrice = (price: number): string => {
    return `$${price.toFixed(2)}`;
  };

  if (isLoading) {
    return (
      <div className="deals-widget">
        <div className="widget-header">
          <h2>Tech Deals</h2>
        </div>
        <div className="widget-loading">
          <div className="spinner"></div>
          <p>Loading deals...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="deals-widget">
        <div className="widget-header">
          <h2>Tech Deals</h2>
        </div>
        <div className="widget-error">
          <p>Error: {error.message}</p>
          <button onClick={handleRefresh} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const filteredDeals = getFilteredDeals();
  
  // Sort deals by discount percentage (highest first)
  const sortedDeals = [...filteredDeals].sort((a, b) => b.discountPercentage - a.discountPercentage);

  return (
    <div className="deals-widget">
      <div className="widget-header">
        <h2>Tech Deals</h2>
        <button onClick={handleRefresh} className="refresh-button" title="Refresh">
          ↻
        </button>
      </div>

      <div className="tabs">
        <button
          className={`tab ${selectedTab === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedTab('all')}
        >
          All
        </button>
        <button
          className={`tab ${selectedTab === 'current' ? 'active' : ''}`}
          onClick={() => setSelectedTab('current')}
        >
          Current Deals
        </button>
        <button
          className={`tab ${selectedTab === 'upcoming' ? 'active' : ''}`}
          onClick={() => setSelectedTab('upcoming')}
        >
          Upcoming Deals
        </button>
      </div>

      <div className="deals-list">
        {sortedDeals.length === 0 ? (
          <p className="no-deals">No deals to display</p>
        ) : (
          sortedDeals.map((deal) => {
            const savings = deal.originalPrice - deal.salePrice;
            return (
              <div
                key={deal.id}
                className="deal-row"
                onClick={() => handleDealClick(deal.url)}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleDealClick(deal.url);
                  }
                }}
              >
                <div className="deal-discount-column">
                  <div className="discount-percentage">{deal.discountPercentage}%</div>
                  {savings > 0 && (
                    <div className="discount-amount">Save ${savings.toFixed(0)}</div>
                  )}
                </div>
                
                <div className="deal-content-column">
                  <h3 className="deal-title">{deal.productName}</h3>
                  <div className="deal-meta">
                    <span className="deal-source">{deal.source}</span>
                    <span className="deal-separator">•</span>
                    <span className="deal-expiration">{formatExpirationDate(deal.expirationDate)}</span>
                  </div>
                </div>
                
                <div className="deal-price-column">
                  <div className="deal-sale-price">${formatPrice(deal.salePrice)}</div>
                  {deal.originalPrice > 0 && (
                    <div className="deal-original-price">${formatPrice(deal.originalPrice)}</div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="widget-footer">
        <p className="last-refresh">Last updated: {lastRefresh.toLocaleTimeString()}</p>
      </div>
    </div>
  );
};
