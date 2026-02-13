import type { TechDeal } from '../types';
import { DealStatus } from '../types';

/**
 * Cloudflare Worker API Client for fetching scraped Australian tech deals
 */
export class CloudflareDealsClient {
  private apiUrl: string;

  constructor(apiUrl: string = 'https://laynes-world-api.laynes-world.workers.dev') {
    this.apiUrl = apiUrl;
  }

  /**
   * Fetches deals from Cloudflare Worker API
   */
  async fetchDeals(category?: string): Promise<TechDeal[]> {
    try {
      const url = category 
        ? `${this.apiUrl}/api/deals?category=${category}`
        : `${this.apiUrl}/api/deals`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.deals && Array.isArray(data.deals)) {
        return data.deals.map((deal: any) => this.transformDeal(deal));
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching deals from Cloudflare Worker:', error);
      throw error;
    }
  }

  /**
   * Transforms API deal to TechDeal format
   */
  private transformDeal(deal: any): TechDeal {
    return {
      id: deal.id,
      productName: deal.productName || deal.title,
      discountPercentage: deal.discountPercentage || 0,
      originalPrice: deal.originalPrice || 0,
      salePrice: deal.salePrice || 0,
      source: deal.source || 'OzBargain',
      url: deal.url || deal.link,
      expirationDate: deal.expirationDate ? new Date(deal.expirationDate) : new Date(),
      status: deal.status === 'current' ? DealStatus.CURRENT : DealStatus.EXPIRED,
      imageUrl: deal.imageUrl || deal.image
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
