import React, { useState, useEffect } from 'react';
import type { YouTubeVideo } from '../types';
import { VideoType } from '../types';
import { YouTubeAPIClient } from '../services/YouTubeAPIClient';
import { openInNewTab } from '../utils/linkHandler';
import './YouTubeWidget.css';

interface YouTubeWidgetProps {
  apiKey?: string;
  useMockData?: boolean;
  onLoadingChange?: (isLoading: boolean) => void;
  onError?: (error: Error) => void;
}

type TabType = 'new_releases' | 'recommended' | 'all';

export const YouTubeWidget: React.FC<YouTubeWidgetProps> = ({ 
  apiKey, 
  useMockData = true,
  onLoadingChange,
  onError
}) => {
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [selectedTab, setSelectedTab] = useState<TabType>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const apiClient = new YouTubeAPIClient(apiKey, useMockData);

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    setIsLoading(true);
    if (onLoadingChange) onLoadingChange(true);
    setError(null);

    try {
      const [newReleases, recommended] = await Promise.all([
        apiClient.fetchNewReleases(),
        apiClient.fetchRecommended()
      ]);

      setVideos([...newReleases, ...recommended]);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load videos');
      setError(error);
      if (onError) onError(error);
    } finally {
      setIsLoading(false);
      if (onLoadingChange) onLoadingChange(false);
    }
  };

  const handleRefresh = () => {
    loadVideos();
  };

  const handleVideoClick = (url: string) => {
    openInNewTab(url);
  };

  const getFilteredVideos = (): YouTubeVideo[] => {
    if (selectedTab === 'all') {
      return videos;
    }
    if (selectedTab === 'new_releases') {
      return videos.filter(v => v.type === VideoType.NEW_RELEASE);
    }
    if (selectedTab === 'recommended') {
      return videos.filter(v => v.type === VideoType.RECOMMENDED);
    }
    return videos;
  };

  const formatDate = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="youtube-widget">
        <div className="widget-header">
          <h2>YouTube Feed</h2>
        </div>
        <div className="widget-loading">
          <div className="spinner"></div>
          <p>Loading videos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="youtube-widget">
        <div className="widget-header">
          <h2>YouTube Feed</h2>
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

  const filteredVideos = getFilteredVideos();

  return (
    <div className="youtube-widget">
      <div className="widget-header">
        <h2>YouTube Feed</h2>
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
          className={`tab ${selectedTab === 'new_releases' ? 'active' : ''}`}
          onClick={() => setSelectedTab('new_releases')}
        >
          New Releases
        </button>
        <button
          className={`tab ${selectedTab === 'recommended' ? 'active' : ''}`}
          onClick={() => setSelectedTab('recommended')}
        >
          Recommended
        </button>
      </div>

      <div className="video-grid">
        {filteredVideos.length === 0 ? (
          <p className="no-videos">No videos to display</p>
        ) : (
          filteredVideos.map((video) => (
            <div
              key={video.id}
              className="video-card"
              onClick={() => handleVideoClick(video.url)}
              role="button"
              tabIndex={0}
              onKeyPress={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleVideoClick(video.url);
                }
              }}
            >
              <div className="video-thumbnail">
                <img src={video.thumbnail} alt={video.title} />
                <div className="video-type-badge">
                  {video.type === VideoType.NEW_RELEASE ? 'New' : 'Recommended'}
                </div>
              </div>
              <div className="video-info">
                <h3 className="video-title">{video.title}</h3>
                <p className="video-channel">{video.channelName}</p>
                <p className="video-date">{formatDate(video.uploadDate)}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
