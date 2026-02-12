import Parser from 'rss-parser';
import type { TechDeal } from '../types';
import { DealStatus } from '../types';

/**
 * RSS-based Deals Client for fetching real deals from OzBargain
 * Uses CORS proxy to bypass browser restrictions
 */
export class RSSDealsClient {
  private parser: Parser;
  private corsProxy = 'https://api.allorigins.win/raw?url=';
  
  // OzBargain RSS feed URLs
  private readonly feeds = {
    computing: 'https://www.ozbargain.com.au/cat/computing/feed',
    electronics: 'https://www.ozbargain.com.au/cat/electrical-electronics/feed',
    mobile: 'https://www.ozbargain.com.au/cat/mobile/feed',
  };

  constructor() {
    this.parser = new Parser({
      customFields: {
        item: [
          ['category', 'category'],
          ['media:thumbnail', 'thumbnail'],
          ['media:content', 'mediaContent']
        ]
      }
    });
  }

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
   * Fetches deals from a specific RSS feed
   */
  private async fetchFromFeed(feedUrl: string, category: string): Promise<TechDeal[]> {
    try {
      const proxiedUrl = `${this.corsProxy}${encodeURIComponent(feedUrl)}`;
      const feed = await this.parser.parseURL(proxiedUrl);

      return feed.items.map((item, index) => this.transformRSSItem(item, category, index));
    } catch (error) {
      console.error(`Error fetching feed ${feedUrl}:`, error);
      return [];
    }
  }

  /**
   * Transforms RSS item to TechDeal format
   */
  private transformRSSItem(item: any, category: string, index: number): TechDeal {
    // Extract price information from title or description
    const priceInfo = this.extractPriceInfo(item.title || '', item.contentSnippet || '');
    
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
      imageUrl: this.extractImageUrl(item)
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
   * Extracts image URL from RSS item
   */
  private extractImageUrl(item: any): string | undefined {
    // Try media:thumbnail
    if (item.thumbnail?.url) {
      return item.thumbnail.url;
    }
    
    // Try media:content
    if (item.mediaContent?.url) {
      return item.mediaContent.url;
    }

    // Try to extract from enclosure
    if (item.enclosure?.url) {
      return item.enclosure.url;
    }

    return undefined;
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
