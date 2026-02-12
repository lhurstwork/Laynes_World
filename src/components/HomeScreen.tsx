import React from 'react';
import './HomeScreen.css';

interface HomeScreenProps {
  onNavigate: (tab: string) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate }) => {
  const quickLinks = [
    {
      id: 'youtube',
      title: 'YouTube Feed',
      description: 'Watch new releases and recommended videos',
      icon: '▶️',
      color: '#FF0000',
    },
    {
      id: 'deals',
      title: 'Tech Deals',
      description: 'Find the best technology deals and discounts',
      icon: '💰',
      color: '#34a853',
    },
    {
      id: 'calendar',
      title: 'Calendar',
      description: 'View your schedule and upcoming events',
      icon: '📅',
      color: '#4285f4',
    },
    {
      id: 'tasks',
      title: 'Tasks',
      description: 'Manage your to-do list and tasks',
      icon: '✓',
      color: '#fbbc04',
    },
    {
      id: 'news',
      title: 'News',
      description: 'Stay updated with the latest news',
      icon: '📰',
      color: '#ea4335',
    },
  ];

  return (
    <div className="home-screen">
      <div className="home-hero">
        <h1 className="home-title">Welcome to Layne's World</h1>
        <p className="home-subtitle">
          Your personal dashboard for staying organized and informed
        </p>
      </div>

      <div className="home-grid">
        {quickLinks.map((link) => (
          <button
            key={link.id}
            className="home-card"
            onClick={() => onNavigate(link.id)}
            style={{ '--card-color': link.color } as React.CSSProperties}
          >
            <div className="home-card-icon">{link.icon}</div>
            <h2 className="home-card-title">{link.title}</h2>
            <p className="home-card-description">{link.description}</p>
            <div className="home-card-arrow">→</div>
          </button>
        ))}
      </div>

      <div className="home-stats">
        <div className="stat-card">
          <div className="stat-value">2</div>
          <div className="stat-label">Active Widgets</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">5</div>
          <div className="stat-label">Total Features</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">∞</div>
          <div className="stat-label">Possibilities</div>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;
