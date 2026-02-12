# Tech Deals Integration Guide

## Overview
This guide explains how to integrate real-world tech deals from OzBargain and other sources into your dashboard.

## Option 1: RSS Feed Integration (Quickest)

### OzBargain RSS Feeds
OzBargain provides RSS feeds for different categories:
- All deals: `https://www.ozbargain.com.au/deals/feed`
- Technology: `https://www.ozbargain.com.au/cat/computing/feed`
- Electronics: `https://www.ozbargain.com.au/cat/electrical-electronics/feed`

### Implementation Steps

1. **Install RSS Parser**
```bash
npm install rss-parser
```

2. **Create RSS Service** (see code below)

3. **Handle CORS Issues**
   - RSS feeds will be blocked by CORS when called from browser
   - Solution: Use a CORS proxy or backend service

### CORS Proxy Options
- `https://api.allorigins.win/raw?url=` (free, no signup)
- `https://corsproxy.io/?` (free, no signup)
- Build your own with Vercel/Netlify functions

## Option 2: Serverless Backend (Recommended)

### Architecture
```
Frontend (GitHub Pages)
    ↓
API Gateway (Vercel/Netlify Functions)
    ↓
Scraper Service (scheduled job)
    ↓
Database (Firebase/Supabase)
```

### Step-by-Step Setup

#### 1. Create Vercel Project
```bash
npm install -g vercel
vercel login
```

#### 2. Create API Endpoint Structure
```
/api
  /deals
    index.ts          # GET /api/deals - fetch deals
    scrape.ts         # POST /api/deals/scrape - trigger scrape (cron)
```

#### 3. Install Dependencies
```bash
npm install cheerio axios node-cron
npm install -D @types/node
```

#### 4. Create Scraper (see code below)

#### 5. Set Up Cron Job
Use Vercel Cron or GitHub Actions to run scraper every hour

### Database Options

**Firebase (Easiest)**
- Free tier: 1GB storage, 50K reads/day
- Real-time updates
- No server management

**Supabase (PostgreSQL)**
- Free tier: 500MB database, 2GB bandwidth
- SQL queries
- Built-in auth

**MongoDB Atlas**
- Free tier: 512MB storage
- Document database
- Good for unstructured data

## Option 3: Web Scraping Service

### Using Puppeteer (Full Browser)
```bash
npm install puppeteer
```

**Pros:** Can scrape JavaScript-rendered content
**Cons:** Heavy, slower, needs more resources

### Using Cheerio (HTML Parser)
```bash
npm install cheerio axios
```

**Pros:** Fast, lightweight
**Cons:** Can't handle JavaScript-rendered content

## Recommended Implementation Plan

### Phase 1: Quick Start (RSS + CORS Proxy)
1. Use OzBargain RSS feeds
2. Use CORS proxy for browser access
3. Parse and display deals
4. **Time: 1-2 hours**

### Phase 2: Backend Service (Vercel Functions)
1. Create Vercel project
2. Build scraper API endpoint
3. Set up Firebase for storage
4. Add cron job for periodic scraping
5. **Time: 4-6 hours**

### Phase 3: Advanced Features
1. Add multiple deal sources (Slickdeals, RedFlagDeals, etc.)
2. Implement deal scoring/ranking
3. Add user preferences and filtering
4. Email notifications for hot deals
5. **Time: 8-12 hours**

## Code Examples

### 1. RSS Feed Service (Frontend)

```typescript
// src/services/RSSDealsClient.ts
import Parser from 'rss-parser';

interface DealItem {
  id: string;
  title: string;
  description: string;
  link: string;
  pubDate: string;
  category: string;
  image?: string;
}

export class RSSDealsClient {
  private parser: Parser;
  private corsProxy = 'https://api.allorigins.win/raw?url=';

  constructor() {
    this.parser = new Parser({
      customFields: {
        item: ['category', 'media:thumbnail']
      }
    });
  }

  async fetchOzBargainDeals(category: string = 'computing'): Promise<DealItem[]> {
    const feedUrl = `https://www.ozbargain.com.au/cat/${category}/feed`;
    const proxiedUrl = `${this.corsProxy}${encodeURIComponent(feedUrl)}`;

    try {
      const feed = await this.parser.parseURL(proxiedUrl);
      
      return feed.items.map((item, index) => ({
        id: item.guid || `deal-${index}`,
        title: item.title || 'No title',
        description: this.stripHtml(item.contentSnippet || item.content || ''),
        link: item.link || '',
        pubDate: item.pubDate || new Date().toISOString(),
        category: item.category || 'Technology',
        image: item['media:thumbnail']?.['$']?.url
      }));
    } catch (error) {
      console.error('Error fetching RSS feed:', error);
      return [];
    }
  }

  private stripHtml(html: string): string {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }
}
```

### 2. Vercel Serverless Function (Backend)

```typescript
// api/deals/index.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import * as cheerio from 'cheerio';

interface Deal {
  id: string;
  title: string;
  price: string;
  description: string;
  link: string;
  votes: number;
  timestamp: string;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const deals = await scrapeOzBargain();
    return res.status(200).json({ deals, count: deals.length });
  } catch (error) {
    console.error('Scraping error:', error);
    return res.status(500).json({ error: 'Failed to fetch deals' });
  }
}

async function scrapeOzBargain(): Promise<Deal[]> {
  const url = 'https://www.ozbargain.com.au/cat/computing';
  const { data } = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });

  const $ = cheerio.load(data);
  const deals: Deal[] = [];

  $('.node-ozbdeal').each((index, element) => {
    const $deal = $(element);
    
    deals.push({
      id: $deal.attr('id') || `deal-${index}`,
      title: $deal.find('.title a').text().trim(),
      price: $deal.find('.price').text().trim() || 'N/A',
      description: $deal.find('.content').text().trim().substring(0, 200),
      link: 'https://www.ozbargain.com.au' + $deal.find('.title a').attr('href'),
      votes: parseInt($deal.find('.voteup').text()) || 0,
      timestamp: new Date().toISOString()
    });
  });

  return deals.slice(0, 20); // Return top 20 deals
}
```

### 3. Vercel Configuration

```json
// vercel.json
{
  "functions": {
    "api/**/*.ts": {
      "memory": 1024,
      "maxDuration": 10
    }
  },
  "crons": [
    {
      "path": "/api/deals/scrape",
      "schedule": "0 * * * *"
    }
  ]
}
```

### 4. Update Frontend to Use Real API

```typescript
// src/services/DealsAPIClient.ts
import { config } from '../config/environment';

export class DealsAPIClient {
  private baseUrl: string;

  constructor() {
    // Use your Vercel API URL in production
    this.baseUrl = config.dealsApiUrl || 'https://your-app.vercel.app/api';
  }

  async fetchDeals(): Promise<Deal[]> {
    try {
      const response = await fetch(`${this.baseUrl}/deals`);
      if (!response.ok) throw new Error('Failed to fetch deals');
      
      const data = await response.json();
      return data.deals;
    } catch (error) {
      console.error('Error fetching deals:', error);
      // Fallback to mock data
      return this.getMockDeals();
    }
  }

  private getMockDeals(): Deal[] {
    // Your existing mock data
    return [];
  }
}
```

## Legal Considerations

### Web Scraping Ethics
1. **Check robots.txt**: `https://www.ozbargain.com.au/robots.txt`
2. **Rate limiting**: Don't overwhelm servers (1 request per 5-10 seconds)
3. **Terms of Service**: Review site's ToS before scraping
4. **Attribution**: Credit the source in your UI

### OzBargain Specific
- OzBargain allows RSS feed usage
- Web scraping may violate ToS - use RSS feeds instead
- Consider reaching out to OzBargain for API access

## Alternative Deal Sources

### International
- **Slickdeals** (US): `https://slickdeals.net/newsearch.php?mode=frontpage&searcharea=deals&searchin=first&rss=1`
- **RedFlagDeals** (Canada): `https://forums.redflagdeals.com/rss/deals/`
- **HotUKDeals** (UK): `https://www.hotukdeals.com/rss/hot`

### Tech-Specific
- **TechBargains**: `https://www.techbargains.com/rss`
- **Woot**: `https://www.woot.com/rss.xml`

## Next Steps

1. **Choose your approach** (RSS, Serverless, or Full Backend)
2. **Set up the infrastructure** (Vercel account, database, etc.)
3. **Implement the scraper/fetcher**
4. **Update your frontend** to consume real data
5. **Add caching** to reduce API calls
6. **Monitor and optimize** performance

## Cost Estimate

### Free Tier (Recommended for Starting)
- Vercel: 100GB bandwidth, 100 serverless function invocations/day
- Firebase: 1GB storage, 50K reads/day
- Total: **$0/month**

### Paid Tier (If You Outgrow Free)
- Vercel Pro: $20/month
- Firebase Blaze: Pay-as-you-go (~$5-10/month for moderate usage)
- Total: **~$25-30/month**

## Questions?

Feel free to ask about:
- Specific implementation details
- Choosing the right architecture
- Setting up any of these services
- Adding more deal sources
- Optimizing performance
