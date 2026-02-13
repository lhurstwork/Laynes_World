import type { NewsArticle, NewsCategory } from '../types';

/**
 * Cloudflare Worker API Client for fetching scraped news articles
 */
export class CloudflareNewsClient {
  private apiUrl: string;

  constructor(apiUrl: string = 'https://laynes-world-api.laynes-world.workers.dev') {
    this.apiUrl = apiUrl;
  }

  /**
   * Fetches news articles from Cloudflare Worker API
   */
  async fetchArticles(category?: NewsCategory): Promise<NewsArticle[]> {
    try {
      const url = category 
        ? `${this.apiUrl}/api/news?category=${category}`
        : `${this.apiUrl}/api/news`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.articles && Array.isArray(data.articles)) {
        return data.articles.map((article: any) => this.transformArticle(article));
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching news from Cloudflare Worker:', error);
      throw error;
    }
  }

  /**
   * Transforms API article to NewsArticle format
   */
  private transformArticle(article: any): NewsArticle {
    return {
      id: article.id,
      title: article.title,
      source: article.source,
      category: article.category as NewsCategory,
      publishedAt: article.publishedAt ? new Date(article.publishedAt) : new Date(),
      summary: article.summary || 'No summary available.',
      url: article.url,
      imageUrl: article.imageUrl
    };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
}
