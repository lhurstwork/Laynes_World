# Web Scraping Architecture Guide
## Moving from RSS to Comprehensive Web Scraping

This guide outlines a free-tier architecture for scraping tech deals and news from across the internet.

---

## Recommended Architecture (100% Free Tier)

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (GitHub Pages)                   │
│                  https://lhurstwork.github.io                │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ API Calls
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Cloudflare Workers (Free Tier)                  │
│  • 100,000 requests/day                                      │
│  • Edge computing (fast globally)                            │
│  • API endpoints: /api/deals, /api/news                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ Fetch & Cache
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Cloudflare KV Storage (Free Tier)               │
│  • 100,000 reads/day, 1,000 writes/day                       │
│  • Store scraped deals & news (1GB storage)                  │
│  • TTL: 1 hour for deals, 15 min for news                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ Scheduled Scraping
                         ▼
┌─────────────────────────────────────────────────────────────┐
│           GitHub Actions (Cron Jobs - Free)                  │
│  • Run every 15 minutes                                      │
│  • Scrape multiple sources                                   │
│  • Push to Cloudflare KV via API                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Alternative Architecture Options

### Option 1: Cloudflare Workers + KV (Recommended)
**Cost**: 100% Free
**Pros**: 
- Extremely fast (edge computing)
- Simple setup
- No server management
- Built-in caching
**Cons**: 
- 1MB script size limit
- 50ms CPU time per request

### Option 2: Vercel Functions + Supabase
**Cost**: 100% Free
**Pros**:
- Easy deployment
- PostgreSQL database (500MB)
- Real-time subscriptions
**Cons**:
- Cold starts
- 100GB bandwidth limit

### Option 3: Railway + MongoDB Atlas
**Cost**: Free tier available
**Pros**:
- Full Node.js environment
- No execution time limits
- MongoDB (512MB)
**Cons**:
- Requires credit card
- $5/month after trial

---

## Recommended Stack (Cloudflare Workers)

### Components

1. **Frontend**: GitHub Pages (current setup)
2. **API Layer**: Cloudflare Workers
3. **Storage**: Cloudflare KV
4. **Scraper**: GitHub Actions (scheduled)
5. **Optional**: Upstash Redis for rate limiting

### Why Cloudflare Workers?

- **100,000 requests/day** on free tier
- **Global edge network** (fast everywhere)
- **Built-in caching** with KV storage
- **No cold starts** (unlike Vercel/AWS Lambda)
- **Simple deployment** via Wrangler CLI

---

## Implementation Plan

### Phase 1: Set Up Cloudflare Workers (30 minutes)

1. **Create Cloudflare Account**
   ```bash
   # Sign up at cloudflare.com (free)
   ```

2. **Install Wrangler CLI**
   ```bash
   npm install -g wrangler
   wrangler login
   ```

3. **Create Worker Project**
   ```bash
   wrangler init laynes-world-api
   cd laynes-world-api
   ```

4. **Create API Endpoints**
   - `/api/deals` - Returns cached deals
   - `/api/news` - Returns cached news
   - `/api/scrape` - Triggers scraping (authenticated)

### Phase 2: Set Up Cloudflare KV Storage (10 minutes)

1. **Create KV Namespace**
   ```bash
   wrangler kv:namespace create "DEALS_CACHE"
   wrangler kv:namespace create "NEWS_CACHE"
   ```

2. **Update wrangler.toml**
   ```toml
   name = "laynes-world-api"
   main = "src/index.ts"
   compatibility_date = "2024-01-01"

   [[kv_namespaces]]
   binding = "DEALS_CACHE"
   id = "your-namespace-id"

   [[kv_namespaces]]
   binding = "NEWS_CACHE"
   id = "your-namespace-id"
   ```

### Phase 3: Create Scraper (GitHub Actions) (1 hour)

1. **Create Scraper Script** (`.github/workflows/scrape.yml`)
   ```yaml
   name: Scrape Deals and News

   on:
     schedule:
       - cron: '*/15 * * * *'  # Every 15 minutes
     workflow_dispatch:  # Manual trigger

   jobs:
     scrape:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         
         - name: Setup Node
           uses: actions/setup-node@v4
           with:
             node-version: '20'
         
         - name: Install dependencies
           run: npm install cheerio axios
         
         - name: Scrape deals
           run: node scripts/scrape-deals.js
           env:
             CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
             CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
         
         - name: Scrape news
           run: node scripts/scrape-news.js
           env:
             CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
             CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
   ```

2. **Create Scraper Scripts**
   - `scripts/scrape-deals.js` - Scrapes OzBargain, Slickdeals, etc.
   - `scripts/scrape-news.js` - Scrapes TechCrunch, The Verge, etc.

### Phase 4: Update Frontend (30 minutes)

Update your API clients to call Cloudflare Workers instead of RSS feeds.

---

## Scraping Strategy

### Tech Deals Sources

1. **OzBargain** (Australia)
   - URL: `https://www.ozbargain.com.au/cat/computing`
   - Scrape: Title, price, discount, image, link
   - Frequency: Every 15 minutes

2. **Slickdeals** (US)
   - URL: `https://slickdeals.net/computer-deals/`
   - Scrape: Title, price, discount, image, link
   - Frequency: Every 15 minutes

3. **RedFlagDeals** (Canada)
   - URL: `https://forums.redflagdeals.com/hot-deals-f9/`
   - Scrape: Title, price, discount, image, link
   - Frequency: Every 15 minutes

4. **HotUKDeals** (UK)
   - URL: `https://www.hotukdeals.com/deals/tech`
   - Scrape: Title, price, discount, image, link
   - Frequency: Every 15 minutes

### News Sources

1. **TechCrunch**
   - URL: `https://techcrunch.com/`
   - Scrape: Title, summary, image, link, category
   - Frequency: Every 15 minutes

2. **The Verge**
   - URL: `https://www.theverge.com/tech`
   - Scrape: Title, summary, image, link, category
   - Frequency: Every 15 minutes

3. **Hacker News**
   - URL: `https://news.ycombinator.com/`
   - Scrape: Title, link, points, comments
   - Frequency: Every 15 minutes

4. **Reddit** (r/technology, r/news)
   - URL: `https://www.reddit.com/r/technology.json`
   - Scrape: Title, link, upvotes, comments
   - Frequency: Every 15 minutes

---

## Code Examples

### Cloudflare Worker (API Endpoint)

```typescript
// src/index.ts
export interface Env {
  DEALS_CACHE: KVNamespace;
  NEWS_CACHE: KVNamespace;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // GET /api/deals
    if (url.pathname === '/api/deals') {
      const cached = await env.DEALS_CACHE.get('latest', 'json');
      
      if (cached) {
        return new Response(JSON.stringify(cached), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      return new Response(JSON.stringify({ deals: [], error: 'No data available' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // GET /api/news
    if (url.pathname === '/api/news') {
      const category = url.searchParams.get('category');
      const cacheKey = category ? `news-${category}` : 'news-all';
      
      const cached = await env.NEWS_CACHE.get(cacheKey, 'json');
      
      if (cached) {
        return new Response(JSON.stringify(cached), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      return new Response(JSON.stringify({ articles: [], error: 'No data available' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response('Not Found', { status: 404 });
  },
};
```

### GitHub Actions Scraper

```javascript
// scripts/scrape-deals.js
const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeOzBargain() {
  const url = 'https://www.ozbargain.com.au/cat/computing';
  const { data } = await axios.get(url);
  const $ = cheerio.load(data);
  
  const deals = [];
  
  $('.node-ozbdeal').each((i, elem) => {
    const $deal = $(elem);
    
    deals.push({
      id: $deal.attr('id'),
      title: $deal.find('.title a').text().trim(),
      price: $deal.find('.price').text().trim(),
      discount: $deal.find('.via').text().trim(),
      image: $deal.find('img').attr('src'),
      link: 'https://www.ozbargain.com.au' + $deal.find('.title a').attr('href'),
      votes: parseInt($deal.find('.voteup').text()) || 0,
      source: 'OzBargain',
      scrapedAt: new Date().toISOString()
    });
  });
  
  return deals.slice(0, 20);
}

async function uploadToCloudflare(deals) {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const namespaceId = process.env.DEALS_NAMESPACE_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/values/latest`;
  
  await axios.put(url, JSON.stringify({ deals, updatedAt: new Date().toISOString() }), {
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json'
    }
  });
  
  console.log(`Uploaded ${deals.length} deals to Cloudflare KV`);
}

async function main() {
  try {
    const deals = await scrapeOzBargain();
    await uploadToCloudflare(deals);
  } catch (error) {
    console.error('Scraping failed:', error);
    process.exit(1);
  }
}

main();
```

---

## Cost Breakdown (Free Tier Limits)

### Cloudflare Workers
- **Requests**: 100,000/day (enough for ~4 requests/second)
- **CPU Time**: 10ms per request
- **Storage (KV)**: 1GB
- **Reads**: 100,000/day
- **Writes**: 1,000/day

### GitHub Actions
- **Minutes**: 2,000/month (enough for 133 hours)
- **Storage**: 500MB
- **Concurrent jobs**: 20

### Estimated Usage
- **Scraping**: 96 runs/day × 2 minutes = 192 minutes/day = 5,760 minutes/month (within limit)
- **API Calls**: Assuming 1,000 users × 10 requests/day = 10,000 requests/day (within limit)
- **KV Writes**: 96 scrapes/day × 2 writes = 192 writes/day (within limit)
- **KV Reads**: 10,000 API calls/day (within limit)

**Total Cost**: $0/month

---

## Advanced Features (Optional)

### 1. AI-Powered Deal Scoring
Use Cloudflare AI (free tier) to score deals:
```typescript
const score = await env.AI.run('@cf/meta/llama-2-7b-chat-int8', {
  prompt: `Rate this deal from 1-10: ${deal.title}`
});
```

### 2. Real-Time Updates with WebSockets
Use Cloudflare Durable Objects for real-time deal notifications.

### 3. User Preferences
Store user preferences in KV with user ID as key.

### 4. Deal Alerts
Send email alerts via Cloudflare Email Workers (free).

---

## Migration Path

### Week 1: Set Up Infrastructure
- Create Cloudflare account
- Set up Workers and KV
- Deploy basic API endpoints

### Week 2: Build Scrapers
- Create GitHub Actions workflows
- Build scraper scripts for 2-3 sources
- Test and debug

### Week 3: Update Frontend
- Update API clients to use Cloudflare Workers
- Add loading states and error handling
- Test thoroughly

### Week 4: Expand Sources
- Add more deal sources (Slickdeals, RedFlagDeals)
- Add more news sources (Hacker News, Reddit)
- Optimize scraping logic

---

## Legal Considerations

### Web Scraping Ethics
1. **Respect robots.txt**: Check each site's robots.txt
2. **Rate limiting**: Don't overwhelm servers (1 request per 5-10 seconds)
3. **Terms of Service**: Review each site's ToS
4. **Attribution**: Credit sources in your UI
5. **User-Agent**: Use a descriptive User-Agent string

### Recommended User-Agent
```
Mozilla/5.0 (compatible; LaynesWorldBot/1.0; +https://lhurstwork.github.io/Laynes_World/)
```

---

## Next Steps

Would you like me to:

1. **Set up the Cloudflare Workers infrastructure** (I can guide you through it)
2. **Create the GitHub Actions scraper scripts** (I can write the code)
3. **Update your frontend to use the new API** (I can modify your existing code)
4. **Start with a simpler approach** (Maybe just Cloudflare Workers without GitHub Actions)

Let me know which path you'd like to take, and I'll help you implement it!
