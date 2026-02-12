import React, { useState, useEffect } from 'react';
import { NewsAPIClient } from '../services/NewsAPIClient';
import type { NewsArticle, NewsCategory } from '../types';
import { openInNewTab } from '../utils/linkHandler';
import './NewsWidget.css';

interface NewsWidgetProps {
  useMockData?: boolean;
  onLoadingChange?: (isLoading: boolean) => void;
  onError?: (error: Error) => void;
}

export const NewsWidget: React.FC<NewsWidgetProps> = ({
  useMockData = true,
  onLoadingChange,
  onError,
}) => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<NewsCategory | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);

  const apiClient = new NewsAPIClient(undefined, useMockData);

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    try {
      setIsLoading(true);
      onLoadingChange?.(true);

      const fetchedArticles = await apiClient.fetchArticles();
      setArticles(fetchedArticles);
    } catch (error) {
      console.error('Failed to load news articles:', error);
      onError?.(error as Error);
    } finally {
      setIsLoading(false);
      onLoadingChange?.(false);
    }
  };

  const filteredArticles = selectedCategory === 'all'
    ? articles
    : articles.filter(article => article.category === selectedCategory);

  const categories: Array<{ id: NewsCategory | 'all'; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'technology', label: 'Technology' },
    { id: 'business', label: 'Business' },
    { id: 'entertainment', label: 'Entertainment' },
  ];

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="news-widget">
      <div className="news-categories">
        {categories.map((category) => (
          <button
            key={category.id}
            className={`category-button ${selectedCategory === category.id ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category.id)}
            aria-pressed={selectedCategory === category.id}
          >
            {category.label}
          </button>
        ))}
      </div>

      <div className="news-grid">
        {filteredArticles.map((article) => (
          <article
            key={article.id}
            className="news-card"
            onClick={() => openInNewTab(article.url)}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                openInNewTab(article.url);
              }
            }}
          >
            {article.imageUrl && (
              <div className="news-image">
                <img src={article.imageUrl} alt={article.title} loading="lazy" />
                <span className="news-category-badge">{article.category}</span>
              </div>
            )}
            
            <div className="news-content">
              <div className="news-meta">
                <span className="news-source">{article.source}</span>
                <span className="news-date">{formatDate(article.publishedAt)}</span>
              </div>
              
              <h3 className="news-title">{article.title}</h3>
              
              <p className="news-summary">{article.summary}</p>
              
              <div className="news-footer">
                <span className="read-more">Read more →</span>
              </div>
            </div>
          </article>
        ))}
      </div>

      {filteredArticles.length === 0 && !isLoading && (
        <div className="news-empty">
          <p>No articles found in this category.</p>
        </div>
      )}
    </div>
  );
};
