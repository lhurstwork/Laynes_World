import type { NewsArticle, NewsCategory } from '../types';
import { config } from '../config/environment';
import { RSSNewsClient } from './RSSNewsClient';

/**
 * News API Client for fetching news articles
 * Uses RSS feeds from major outlets for real data, with mock data fallback
 */
export class NewsAPIClient {
  private useMockData: boolean;
  private rssClient: RSSNewsClient;

  constructor(_apiKey?: string, useMockData?: boolean) {
    // Store for future use when real API is implemented
    // this._apiKey = apiKey || config.newsApiKey;
    // this._baseUrl = config.newsApiUrl;
    this.useMockData = useMockData !== undefined ? useMockData : config.useMockData;
    this.rssClient = new RSSNewsClient();
  }

  /**
   * Fetches news articles, optionally filtered by category
   */
  async fetchArticles(category?: NewsCategory): Promise<NewsArticle[]> {
    if (this.useMockData) {
      const allArticles = this.getMockArticles();
      
      if (category) {
        return allArticles.filter(article => article.category === category);
      }
      
      return allArticles;
    }

    // Fetch real news from RSS feeds
    try {
      return await this.rssClient.fetchArticles(category);
    } catch (error) {
      console.error('Failed to fetch RSS news, falling back to mock data:', error);
      // Fallback to mock data if RSS fetch fails
      const allArticles = this.getMockArticles();
      if (category) {
        return allArticles.filter(article => article.category === category);
      }
      return allArticles;
    }
  }

  /**
   * Mock data for news articles
   */
  private getMockArticles(): NewsArticle[] {
    const now = new Date();
    const hoursAgo = (hours: number) => new Date(now.getTime() - hours * 60 * 60 * 1000);

    return [
      // Technology
      {
        id: 'tech_1',
        title: 'AI Breakthrough: New Model Achieves Human-Level Reasoning',
        source: 'TechCrunch',
        category: 'technology',
        publishedAt: hoursAgo(2),
        summary: 'Researchers unveil a groundbreaking AI system that demonstrates unprecedented reasoning capabilities, marking a significant milestone in artificial intelligence development.',
        url: 'https://techcrunch.com/ai-breakthrough',
        imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80',
      },
      {
        id: 'tech_2',
        title: 'Apple Announces Revolutionary MacBook with Week-Long Battery Life',
        source: 'The Verge',
        category: 'technology',
        publishedAt: hoursAgo(5),
        summary: 'Apple\'s latest MacBook Pro features a revolutionary battery technology that promises up to 7 days of continuous use, setting a new standard for laptop endurance.',
        url: 'https://theverge.com/apple-macbook',
        imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80',
      },
      {
        id: 'tech_3',
        title: 'Quantum Computing Reaches Commercial Viability',
        source: 'Wired',
        category: 'technology',
        publishedAt: hoursAgo(8),
        summary: 'Major tech companies announce the first commercially viable quantum computers, promising to revolutionize drug discovery, cryptography, and complex simulations.',
        url: 'https://wired.com/quantum-computing',
        imageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&q=80',
      },
      {
        id: 'tech_4',
        title: 'SpaceX Successfully Lands Starship on Mars',
        source: 'Space.com',
        category: 'technology',
        publishedAt: hoursAgo(12),
        summary: 'In a historic achievement, SpaceX\'s Starship successfully completes its first crewed mission to Mars, landing safely at the designated site.',
        url: 'https://space.com/spacex-mars',
        imageUrl: 'https://images.unsplash.com/photo-1516849841032-87cbac4d88f7?w=800&q=80',
      },

      // Business
      {
        id: 'biz_1',
        title: 'Global Markets Rally as Inflation Concerns Ease',
        source: 'Bloomberg',
        category: 'business',
        publishedAt: hoursAgo(1),
        summary: 'Stock markets worldwide surge as new economic data suggests inflation is cooling faster than expected, boosting investor confidence.',
        url: 'https://bloomberg.com/markets-rally',
        imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80',
      },
      {
        id: 'biz_2',
        title: 'Amazon Unveils Drone Delivery Network Across Major Cities',
        source: 'CNBC',
        category: 'business',
        publishedAt: hoursAgo(4),
        summary: 'Amazon launches its long-awaited drone delivery service in 50 major cities, promising 30-minute delivery for millions of products.',
        url: 'https://cnbc.com/amazon-drones',
        imageUrl: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=800&q=80',
      },
      {
        id: 'biz_3',
        title: 'Tesla Becomes First Trillion-Dollar Automaker',
        source: 'Reuters',
        category: 'business',
        publishedAt: hoursAgo(10),
        summary: 'Tesla\'s market valuation crosses $1 trillion following record quarterly deliveries and expansion into new markets.',
        url: 'https://reuters.com/tesla-trillion',
        imageUrl: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&q=80',
      },
      {
        id: 'biz_4',
        title: 'Major Banks Announce Shift to 4-Day Work Week',
        source: 'Financial Times',
        category: 'business',
        publishedAt: hoursAgo(15),
        summary: 'Leading financial institutions pilot four-day work weeks, citing improved employee productivity and satisfaction.',
        url: 'https://ft.com/four-day-week',
        imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80',
      },

      // Entertainment
      {
        id: 'ent_1',
        title: 'Record-Breaking Opening Weekend for Latest Marvel Film',
        source: 'Variety',
        category: 'entertainment',
        publishedAt: hoursAgo(3),
        summary: 'The newest Marvel Cinematic Universe installment shatters box office records with a $400 million global opening weekend.',
        url: 'https://variety.com/marvel-record',
        imageUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&q=80',
      },
      {
        id: 'ent_2',
        title: 'Grammy Awards Announce Major Format Changes',
        source: 'Rolling Stone',
        category: 'entertainment',
        publishedAt: hoursAgo(6),
        summary: 'The Recording Academy reveals significant changes to Grammy categories and voting procedures for the upcoming awards season.',
        url: 'https://rollingstone.com/grammys',
        imageUrl: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&q=80',
      },
      {
        id: 'ent_3',
        title: 'Netflix Greenlights Ambitious Fantasy Series',
        source: 'The Hollywood Reporter',
        category: 'entertainment',
        publishedAt: hoursAgo(9),
        summary: 'Netflix announces a $500 million investment in a new fantasy epic series, set to rival Game of Thrones in scale and ambition.',
        url: 'https://hollywoodreporter.com/netflix-fantasy',
        imageUrl: 'https://images.unsplash.com/photo-1574267432644-f610f5b17f3c?w=800&q=80',
      },
      {
        id: 'ent_4',
        title: 'Taylor Swift Announces World Tour with Groundbreaking Tech',
        source: 'Billboard',
        category: 'entertainment',
        publishedAt: hoursAgo(14),
        summary: 'Pop superstar Taylor Swift reveals plans for a revolutionary concert tour featuring holographic performances and immersive AR experiences.',
        url: 'https://billboard.com/taylor-swift-tour',
        imageUrl: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80',
      },
    ];
  }
}
