import type { TechDeal } from '../types';
import { DealStatus } from '../types';
import { config } from '../config/environment';
import { RSSDealsClient } from './RSSDealsClient';
import { CloudflareDealsClient } from './CloudflareDealsClient';

/**
 * Deals API Client for fetching technology deals
 * Uses Cloudflare Worker for scraped data, with RSS fallback
 */
export class DealsAPIClient {
  private useMockData: boolean;
  private rssClient: RSSDealsClient;
  private cloudflareClient: CloudflareDealsClient;

  constructor(_apiKey?: string, useMockData?: boolean) {
    this.useMockData = useMockData !== undefined ? useMockData : config.useMockData;
    this.rssClient = new RSSDealsClient();
    this.cloudflareClient = new CloudflareDealsClient();
  }

  /**
   * Fetches all deals and optionally filters by status
   */
  async fetchDeals(status?: DealStatus): Promise<TechDeal[]> {
    if (this.useMockData) {
      const allDeals = this.getMockDeals();
      
      if (status) {
        return allDeals.filter(deal => deal.status === status);
      }
      
      return allDeals;
    }

    // Try Cloudflare Worker first (scraped data)
    try {
      const deals = await this.cloudflareClient.fetchDeals();
      
      if (deals.length > 0) {
        if (status) {
          return deals.filter(deal => deal.status === status);
        }
        return deals;
      }
    } catch (error) {
      console.warn('Cloudflare Worker unavailable, falling back to RSS:', error);
    }

    // Fallback to RSS feeds
    try {
      const deals = await this.rssClient.fetchDeals();
      
      if (status) {
        return deals.filter(deal => deal.status === status);
      }
      
      return deals;
    } catch (error) {
      console.error('Failed to fetch deals from RSS, falling back to mock data:', error);
      // Final fallback to mock data
      return this.getMockDeals();
    }
  }

  /**
   * Fetches current deals
   */
  async fetchCurrentDeals(): Promise<TechDeal[]> {
    return this.fetchDeals(DealStatus.CURRENT);
  }

  /**
   * Fetches upcoming deals
   */
  async fetchUpcomingDeals(): Promise<TechDeal[]> {
    return this.fetchDeals(DealStatus.UPCOMING);
  }

  /**
   * Mock data for deals
   */
  private getMockDeals(): TechDeal[] {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const twoWeeks = new Date(now);
    twoWeeks.setDate(twoWeeks.getDate() + 14);

    return [
      // Current deals
      {
        id: 'deal_1',
        productName: 'Samsung Galaxy S24 Ultra',
        discountPercentage: 25,
        originalPrice: 1199.99,
        salePrice: 899.99,
        source: 'Amazon',
        url: 'https://amazon.com/deal/samsung-s24',
        expirationDate: tomorrow,
        status: DealStatus.CURRENT,
        imageUrl: 'https://images.example.com/samsung-s24.jpg'
      },
      {
        id: 'deal_2',
        productName: 'Apple MacBook Pro 14" M3',
        discountPercentage: 15,
        originalPrice: 1999.00,
        salePrice: 1699.15,
        source: 'Best Buy',
        url: 'https://bestbuy.com/deal/macbook-pro',
        expirationDate: nextWeek,
        status: DealStatus.CURRENT,
        imageUrl: 'https://images.example.com/macbook-pro.jpg'
      },
      {
        id: 'deal_3',
        productName: 'Sony WH-1000XM5 Headphones',
        discountPercentage: 30,
        originalPrice: 399.99,
        salePrice: 279.99,
        source: 'Target',
        url: 'https://target.com/deal/sony-headphones',
        expirationDate: tomorrow,
        status: DealStatus.CURRENT,
        imageUrl: 'https://images.example.com/sony-headphones.jpg'
      },
      {
        id: 'deal_4',
        productName: 'LG 55" OLED C3 TV',
        discountPercentage: 20,
        originalPrice: 1499.99,
        salePrice: 1199.99,
        source: 'Walmart',
        url: 'https://walmart.com/deal/lg-oled',
        expirationDate: nextWeek,
        status: DealStatus.CURRENT,
        imageUrl: 'https://images.example.com/lg-oled.jpg'
      },
      {
        id: 'deal_5',
        productName: 'iPad Air 11" M2',
        discountPercentage: 10,
        originalPrice: 599.00,
        salePrice: 539.10,
        source: 'Apple Store',
        url: 'https://apple.com/deal/ipad-air',
        expirationDate: nextWeek,
        status: DealStatus.CURRENT
      },
      {
        id: 'deal_6',
        productName: 'Dell XPS 15 Laptop',
        discountPercentage: 18,
        originalPrice: 1799.99,
        salePrice: 1475.99,
        source: 'Dell',
        url: 'https://dell.com/deal/xps-15',
        expirationDate: tomorrow,
        status: DealStatus.CURRENT,
        imageUrl: 'https://images.example.com/dell-xps.jpg'
      },

      // Upcoming deals
      {
        id: 'deal_7',
        productName: 'Nintendo Switch OLED',
        discountPercentage: 12,
        originalPrice: 349.99,
        salePrice: 307.99,
        source: 'GameStop',
        url: 'https://gamestop.com/deal/switch-oled',
        expirationDate: twoWeeks,
        status: DealStatus.UPCOMING,
        imageUrl: 'https://images.example.com/switch-oled.jpg'
      },
      {
        id: 'deal_8',
        productName: 'Bose QuietComfort Earbuds II',
        discountPercentage: 25,
        originalPrice: 299.00,
        salePrice: 224.25,
        source: 'Bose',
        url: 'https://bose.com/deal/qc-earbuds',
        expirationDate: twoWeeks,
        status: DealStatus.UPCOMING,
        imageUrl: 'https://images.example.com/bose-earbuds.jpg'
      },
      {
        id: 'deal_9',
        productName: 'Google Pixel 8 Pro',
        discountPercentage: 22,
        originalPrice: 999.00,
        salePrice: 779.22,
        source: 'Google Store',
        url: 'https://store.google.com/deal/pixel-8-pro',
        expirationDate: twoWeeks,
        status: DealStatus.UPCOMING,
        imageUrl: 'https://images.example.com/pixel-8-pro.jpg'
      },
      {
        id: 'deal_10',
        productName: 'Microsoft Surface Pro 9',
        discountPercentage: 16,
        originalPrice: 1299.99,
        salePrice: 1091.99,
        source: 'Microsoft Store',
        url: 'https://microsoft.com/deal/surface-pro',
        expirationDate: twoWeeks,
        status: DealStatus.UPCOMING
      }
    ];
  }
}
