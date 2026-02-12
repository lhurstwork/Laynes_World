import type { NewsArticle, NewsCategory } from '../types';

/**
 * RSS-based News Client for fetching real news from multiple sources
 * Uses CORS proxy to bypass browser restrictions
 */
export class RSSNewsClient {
  private corsProxy = 'https://api.allorigins.win/raw?url=';
  
  // Major news outlet RSS feeds organized by category
  private readonly feeds = {
    technology: [
      { name: 'TechCrunch', url: 'https://techcrunch.com/feed/' },
      { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml' },
      { name: 'Wired', url: 'https://www.wired.com/feed/rss' },
      { name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index' },
      { name: 'Engadget', url: 'https://www.engadget.com/rss.xml' },
    ],
    business: [
      { name: 'Bloomberg', url: 'https://feeds.bloomberg.com/markets/news.rss' },
      { name: 'Reuters Business', url: 'https://www.reutersagency.com/feed/?taxonomy=best-topics&post_type=best' },
      { name: 'CNBC', url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html' },
      { name: 'Financial Times', url: 'https://www.ft.com/?format=rss' },
      { name: 'WSJ', url: 'https://feeds.a.dj.com/rss/RSSMarketsMain.xml' },
    ],
    entertainment: [
      { name: 'Variety', url: 'https://variety.com/feed/' },
      { name: 'The Hollywood Reporter', url: 'https://www.hollywoodreporter.com/feed/' },
      { name: 'Rolling Stone', url: 'https://www.rollingstone.com/feed/' },
      { name: 'Billboard', url: 'https://www.billboard.com/feed/' },
      { name: 'Entertainment Weekly', url: 'https://ew.com/feed/' },
    ],
  };

  /**
   * Fetches news articles from RSS feeds
   */
  async fetchArticles(category?: NewsCategory): Promise<NewsArticle[]> {
    try {
      if (category) {
        // Fetch from specific category
        return await this.fetchFromCategory(category);
      }

      // Fetch from all categories
      const [techArticles, businessArticles, entertainmentArticles] = await Promise.all([
        this.fetchFromCategory('technology'),
        this.fetchFromCategory('business'),
        this.fetchFromCategory('entertainment')
      ]);

      const allArticles = [...techArticles, ...businessArticles, ...entertainmentArticles];
      
      // Sort by date (newest first) and return top 30
      return allArticles
        .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
        .slice(0, 30);
    } catch (error) {
      console.error('Error fetching RSS news:', error);
      throw error;
    }
  }

  /**
   * Fetches articles from a specific category
   */
  private async fetchFromCategory(category: NewsCategory): Promise<NewsArticle[]> {
    const categoryFeeds = this.feeds[category];
    if (!categoryFeeds) {
      return [];
    }

    // Fetch from all feeds in this category in parallel
    const feedPromises = categoryFeeds.map(feed => 
      this.fetchFromFeed(feed.url, feed.name, category)
    );

    const results = await Promise.allSettled(feedPromises);
    
    // Combine successful results
    const articles: NewsArticle[] = [];
    results.forEach(result => {
      if (result.status === 'fulfilled') {
        articles.push(...result.value);
      }
    });

    // Return top 10 articles from this category
    return articles
      .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
      .slice(0, 10);
  }

  /**
   * Fetches articles from a specific RSS feed
   */
  private async fetchFromFeed(
    feedUrl: string, 
    sourceName: string, 
    category: NewsCategory
  ): Promise<NewsArticle[]> {
    try {
      const proxiedUrl = `${this.corsProxy}${encodeURIComponent(feedUrl)}`;
      
      const response = await fetch(proxiedUrl, {
        headers: {
          'Accept': 'application/rss+xml, application/xml, text/xml'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const xmlText = await response.text();
      const items = this.parseRSSXML(xmlText);

      return items.map((item, index) => 
        this.transformRSSItem(item, sourceName, category, index)
      );
    } catch (error) {
      console.error(`Error fetching feed ${feedUrl}:`, error);
      return [];
    }
  }

  /**
   * Manually parse RSS XML using browser's DOMParser
   */
  private parseRSSXML(xmlText: string): Array<{
    title: string;
    link: string;
    guid: string;
    pubDate: string;
    description: string;
    content: string;
    mediaContent?: string;
    mediaThumbnail?: string;
  }> {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    
    // Check for parsing errors
    const parserError = xmlDoc.querySelector('parsererror');
    if (parserError) {
      console.error('XML parsing error:', parserError.textContent);
      return [];
    }
    
    const items = xmlDoc.querySelectorAll('item, entry'); // Support both RSS and Atom
    const parsedItems: Array<{
      title: string;
      link: string;
      guid: string;
      pubDate: string;
      description: string;
      content: string;
      mediaContent?: string;
      mediaThumbnail?: string;
    }> = [];

    items.forEach(item => {
      // Handle both RSS and Atom formats
      const title = item.querySelector('title')?.textContent || '';
      const link = item.querySelector('link')?.textContent || 
                   item.querySelector('link')?.getAttribute('href') || '';
      const guid = item.querySelector('guid')?.textContent || 
                   item.querySelector('id')?.textContent || '';
      const pubDate = item.querySelector('pubDate')?.textContent || 
                      item.querySelector('published')?.textContent ||
                      item.querySelector('updated')?.textContent || '';
      const description = item.querySelector('description')?.textContent || 
                         item.querySelector('summary')?.textContent || '';
      const content = item.querySelector('content, content\\:encoded')?.textContent || '';
      
      // Try to extract images from various RSS extensions and HTML content
      const mediaContent = item.querySelector('media\\:content')?.getAttribute('url') ||
                          item.querySelector('enclosure[type^="image"]')?.getAttribute('url');
      const mediaThumbnail = item.querySelector('media\\:thumbnail')?.getAttribute('url');
      
      // Also try to extract image from description/content HTML
      const htmlImage = this.extractImageFromHTML(description || content);

      parsedItems.push({ 
        title, 
        link, 
        guid, 
        pubDate, 
        description, 
        content,
        mediaContent: mediaContent || undefined,
        mediaThumbnail: mediaThumbnail || htmlImage || undefined
      });
    });

    return parsedItems;
  }

  /**
   * Transforms RSS item to NewsArticle format
   */
  private transformRSSItem(
    item: {
      title: string;
      link: string;
      guid: string;
      pubDate: string;
      description: string;
      content: string;
      mediaContent?: string;
      mediaThumbnail?: string;
    },
    sourceName: string,
    category: NewsCategory,
    index: number
  ): NewsArticle {
    // Parse publication date
    const publishedAt = item.pubDate ? new Date(item.pubDate) : new Date();
    
    // Extract summary from description or content
    const summary = this.extractSummary(item.description || item.content);
    
    // Get image URL
    const imageUrl = item.mediaThumbnail || item.mediaContent || this.getDefaultImage(category);

    return {
      id: item.guid || `${sourceName}-${category}-${index}`,
      title: this.cleanText(item.title || 'Untitled'),
      source: sourceName,
      category: category,
      publishedAt: publishedAt,
      summary: summary,
      url: item.link || '#',
      imageUrl: imageUrl
    };
  }

  /**
   * Extracts image URL from HTML content
   */
  private extractImageFromHTML(html: string): string | undefined {
    if (!html) return undefined;

    // Create a temporary DOM element to parse HTML
    const temp = document.createElement('div');
    temp.innerHTML = html;

    // Try to find img tags
    const img = temp.querySelector('img');
    if (img) {
      const src = img.getAttribute('src') || img.getAttribute('data-src');
      if (src && this.isValidImageUrl(src)) {
        return src;
      }
    }

    // Try to find image URLs in the text using regex
    const imageUrlRegex = /(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp))/i;
    const match = html.match(imageUrlRegex);
    if (match && match[1]) {
      return match[1];
    }

    return undefined;
  }

  /**
   * Validates if a URL is a valid image URL
   */
  private isValidImageUrl(url: string): boolean {
    if (!url) return false;
    
    // Check if it's a valid URL
    try {
      new URL(url);
    } catch {
      return false;
    }

    // Check if it has an image extension or is from a known image host
    const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i;
    const imageHosts = /(images\.|img\.|cdn\.|media\.)/i;
    
    return imageExtensions.test(url) || imageHosts.test(url);
  }

  /**
   * Extracts a clean summary from HTML content
   */
  private extractSummary(htmlContent: string): string {
    if (!htmlContent) return 'No summary available.';

    // Remove HTML tags
    const text = htmlContent.replace(/<[^>]*>/g, ' ');
    
    // Decode HTML entities
    const decoded = this.decodeHTMLEntities(text);
    
    // Clean up whitespace
    const cleaned = decoded.replace(/\s+/g, ' ').trim();
    
    // Truncate to 200 characters
    if (cleaned.length > 200) {
      return cleaned.substring(0, 197) + '...';
    }
    
    return cleaned || 'No summary available.';
  }

  /**
   * Cleans text by removing extra whitespace and decoding HTML entities
   */
  private cleanText(text: string): string {
    const decoded = this.decodeHTMLEntities(text);
    return decoded.replace(/\s+/g, ' ').trim();
  }

  /**
   * Decodes HTML entities
   */
  private decodeHTMLEntities(text: string): string {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  }

  /**
   * Returns a default image based on category
   */
  private getDefaultImage(category: NewsCategory): string {
    const defaults = {
      technology: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80',
      business: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80',
      entertainment: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80'
    };
    return defaults[category];
  }
}
