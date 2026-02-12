import type { TechDeal } from '../types';
import { DealStatus } from '../types';

/**
 * RSS-based Deals Client for fetching real deals from OzBargain
 * Uses CORS proxy to bypass browser restrictions
 * Parses RSS feeds manually without external dependencies
 */
export class RSSDealsClient {
  private corsProxy = 'https://api.allorigins.win/raw?url=';
  
  // OzBargain RSS feed URLs
  private readonly feeds = {
    computing: 'https://www.ozbargain.com.au/cat/computing/feed',
    electronics: 'https://www.ozbargain.com.au/cat/electrical-electronics/feed',
    mobile: 'https://www.ozbargain.com.au/cat/mobile/feed',
  };

  /**
   * Fetches deals from OzBargain RSS feeds
   */
  async fetchDeals(): Promise<TechDeal[]> {
    try {
      // Fetch from multiple categories in parallel
      const [computingDeals, electronicsDeals, mobileDeals] = await Promise.all([
        this.fetchFromFeed(this.feeds.computing, 'Computing'),
        this.fetchFromFeed(this.feeds.electronics, 'Electronics'),
        this.fetchFromFeed(this.feeds.mobile, 'Mobile')
      ]);

      // Combine and deduplicate deals
      const allDeals = [...computingDeals, ...electronicsDeals, ...mobileDeals];
      const uniqueDeals = this.deduplicateDeals(allDeals);

      // Sort by date (newest first)
      return uniqueDeals.sort((a, b) => {
        const dateA = new Date(a.expirationDate || 0).getTime();
        const dateB = new Date(b.expirationDate || 0).getTime();
        return dateB - dateA;
      }).slice(0, 20); // Return top 20 deals
    } catch (error) {
      console.error('Error fetching RSS deals:', error);
      throw error;
    }
  }

  /**
   * Fetches deals from a specific RSS feed using manual XML parsing
   */
  private async fetchFromFeed(feedUrl: string, category: string): Promise<TechDeal[]> {
    try {
      const proxiedUrl = `${this.corsProxy}${encodeURIComponent(feedUrl)}`;
      
      const response = await fetch(proxiedUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const xmlText = await response.text();
      const items = this.parseRSSXML(xmlText);

      return items.map((item, index) => this.transformRSSItem(item, category, index));
    } catch (error) {
      console.error(`Error fetching feed ${feedUrl}:`, error);
      return [];
    }
  }

  /**
   * Manually parse RSS XML without external dependencies
   */
  private parseRSSXML(xmlText: string): Array<{
    title: string;
    link: string;
    guid: string;
    pubDate: string;
    description: string;
  }> {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    
    const items = xmlDoc.querySelectorAll('item');
    const parsedItems: Array<{
      title: string;
      link: string;
      guid: string;
      pubDate: string;
      description: string;
    }> = [];

    items.forEach(item => {
      const title = item.querySelector('title')?.textContent || '';
      const link = item.querySelector('link')?.textContent || '';
      const guid = item.querySelector('guid')?.textContent || '';
      const pubDate = item.querySelector('pubDate')?.textContent || '';
      const description = item.querySelector('description')?.textContent || '';

      parsedItems.push({ title, link, guid, pubDate, description });
    });

    return parsedItems;
  }

  /**
   * Transforms RSS item to TechDeal format
   */
  private transformRSSItem(item: {
    title: string;
    link: string;
    guid: string;
    pubDate: string;
    description: string;
  }, category: string, index: number): TechDeal {
    // Extract price information from title or description
    const priceInfo = this.extractPriceInfo(item.title, item.description);
    
    // Parse publication date
    const pubDate = item.pubDate ? new Date(item.pubDate) : new Date();
    
    // Set expiration to 7 days from publication (OzBargain deals typically last a week)
    const expirationDate = new Date(pubDate);
    expirationDate.setDate(expirationDate.getDate() + 7);

    return {
      id: item.guid || `rss-deal-${category}-${index}`,
      productName: this.cleanTitle(item.title || 'Unknown Deal'),
      discountPercentage: priceInfo.discountPercentage,
      originalPrice: priceInfo.originalPrice,
      salePrice: priceInfo.salePrice,
      source: 'OzBargain',
      url: item.link || 'https://www.ozbargain.com.au',
      expirationDate: expirationDate,
      status: DealStatus.CURRENT,
      imageUrl: undefined // OzBargain RSS doesn't include images in basic feed
    };
  }

  /**
   * Extracts price information from title and description
   */
  private extractPriceInfo(title: string, description: string): {
    originalPrice: number;
    salePrice: number;
    discountPercentage: number;
  } {
    const text = `${title} ${description}`;
    
    // Try to find price patterns like "$99", "$99.99", "was $199 now $99"
    const priceRegex = /\$(\d+(?:\.\d{2})?)/g;
    const prices = [];
    let match;
    
    while ((match = priceRegex.exec(text)) !== null) {
      prices.push(parseFloat(match[1]));
    }

    // Try to find discount percentage like "50% off", "50% discount"
    const discountRegex = /(\d+)%\s*(?:off|discount|save)/i;
    const discountMatch = text.match(discountRegex);
    
    if (prices.length >= 2) {
      // Assume first price is original, second is sale price
      const originalPrice = Math.max(...prices);
      const salePrice = Math.min(...prices);
      const discountPercentage = Math.round(((originalPrice - salePrice) / originalPrice) * 100);
      
      return { originalPrice, salePrice, discountPercentage };
    } else if (prices.length === 1 && discountMatch) {
      // We have one price and a discount percentage
      const salePrice = prices[0];
      const discountPercentage = parseInt(discountMatch[1]);
      const originalPrice = salePrice / (1 - discountPercentage / 100);
      
      return { 
        originalPrice: Math.round(originalPrice * 100) / 100, 
        salePrice, 
        discountPercentage 
      };
    } else if (prices.length === 1) {
      // Only one price found, assume it's the sale price with unknown discount
      return {
        originalPrice: prices[0] * 1.3, // Estimate 30% discount
        salePrice: prices[0],
        discountPercentage: 30
      };
    }

    // No price information found
    return {
      originalPrice: 0,
      salePrice: 0,
      discountPercentage: 0
    };
  }

  /**
   * Cleans deal title by removing extra whitespace and HTML entities
   */
  private cleanTitle(title: string): string {
    return title
      .replace(/\s+/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
  }

  /**
   * Removes duplicate deals based on title similarity
   */
  private deduplicateDeals(deals: TechDeal[]): TechDeal[] {
    const seen = new Set<string>();
    return deals.filter(deal => {
      // Create a normalized key from the title
      const key = deal.productName.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }
}
