# Australian Tech Deals Scraping Setup Guide

This guide will help you set up automated scraping of Australian tech deal sources using Cloudflare Workers and GitHub Actions.

---

## Australian Tech Deal Sources

### Primary Sources
1. **OzBargain** - Most popular Australian deals site
   - Computing: `https://www.ozbargain.com.au/cat/computing`
   - Electronics: `https://www.ozbargain.com.au/cat/electrical-electronics`
   - Mobile: `https://www.ozbargain.com.au/cat/mobile`

2. **Catch.com.au** - Major Australian retailer
   - Tech deals: `https://www.catch.com.au/event/tech-deals`

3. **JB Hi-Fi** - Australia's largest electronics retailer
   - Deals: `https://www.jbhifi.com.au/pages/deals`

4. **Harvey Norman** - Major electronics retailer
   - Deals: `https://www.harveynorman.com.au/promotions`

5. **Kogan** - Australian online retailer
   - Tech: `https://www.kogan.com/au/shop/computers-tablets/`

---

## Step-by-Step Setup

### Step 1: Create Cloudflare Account (5 minutes)

1. Go to https://dash.cloudflare.com/sign-up
2. Sign up with email (no credit card required)
3. Verify your email

### Step 2: Install Wrangler CLI (2 minutes)

```bash
npm install -g wrangler
wrangler login
```

This will open a browser window to authenticate.

### Step 3: Create Worker Project (5 minutes)

```bash
# Create a new directory for your API
mkdir laynes-world-api
cd laynes-world-api

# Initialize Wrangler project
wrangler init

# Choose:
# - TypeScript: Yes
# - Git: Yes
# - Deploy: No (we'll do this later)
```

### Step 4: Create KV Namespace (2 minutes)

```bash
# Create KV namespace for deals cache
wrangler kv:namespace create "DEALS_CACHE"

# Copy the ID that's returned, you'll need it for wrangler.toml
```

### Step 5: Configure wrangler.toml

Update `wrangler.toml` with:

```toml
name = "laynes-world-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[[kv_namespaces]]
binding = "DEALS_CACHE"
id = "YOUR_NAMESPACE_ID_HERE"  # Replace with ID from Step 4

[vars]
ALLOWED_ORIGINS = "https://lhurstwork.github.io"
```

### Step 6: Create Worker Code

See the code files in the next section.

### Step 7: Deploy Worker (1 minute)

```bash
wrangler deploy
```

You'll get a URL like: `https://laynes-world-api.YOUR_SUBDOMAIN.workers.dev`

### Step 8: Set Up GitHub Actions Scraper

1. In your main repo, create `.github/workflows/scrape-deals.yml`
2. Add Cloudflare secrets to GitHub:
   - Go to repo Settings → Secrets → Actions
   - Add `CLOUDFLARE_API_TOKEN`
   - Add `CLOUDFLARE_ACCOUNT_ID`
   - Add `DEALS_NAMESPACE_ID`

### Step 9: Update Frontend

Update your `DealsAPIClient.ts` to call the Cloudflare Worker instead of RSS feeds.

---

## Code Files

### 1. Cloudflare Worker (`src/index.ts`)

```typescript
export interface Env {
  DEALS_CACHE: KVNamespace;
  ALLOWED_ORIGINS: string;
}

interface Deal {
  id: string;
  title: string;
  price: string;
  originalPrice?: string;
  discount?: string;
  image?: string;
  link: string;
  votes?: number;
  source: string;
  category: string;
  scrapedAt: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': env.ALLOWED_ORIGINS || '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // GET /api/deals
    if (url.pathname === '/api/deals' || url.pathname === '/api/deals/') {
      try {
        const category = url.searchParams.get('category');
        const cacheKey = category ? `deals-${category}` : 'deals-all';
        
        // Try to get from cache
        const cached = await env.DEALS_CACHE.get(cacheKey, 'json');
        
        if (cached) {
          return new Response(JSON.stringify({
            deals: cached,
            cached: true,
            timestamp: new Date().toISOString()
          }), {
            headers: corsHeaders
          });
        }
        
        // No cache available
        return new Response(JSON.stringify({
          deals: [],
          cached: false,
          error: 'No deals available. Scraper may not have run yet.',
          timestamp: new Date().toISOString()
        }), {
          status: 200, // Return 200 with empty array instead of 404
          headers: corsHeaders
        });
      } catch (error) {
        return new Response(JSON.stringify({
          deals: [],
          error: 'Internal server error',
          timestamp: new Date().toISOString()
        }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }

    // Health check endpoint
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({
        status: 'ok',
        timestamp: new Date().toISOString()
      }), {
        headers: corsHeaders
      });
    }

    return new Response(JSON.stringify({
      error: 'Not Found',
      availableEndpoints: ['/api/deals', '/health']
    }), {
      status: 404,
      headers: corsHeaders
    });
  },
};
```

### 2. GitHub Actions Workflow (`.github/workflows/scrape-deals.yml`)

```yaml
name: Scrape Australian Tech Deals

on:
  schedule:
    # Run every 30 minutes
    - cron: '*/30 * * * *'
  workflow_dispatch:  # Allow manual trigger

jobs:
  scrape:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: |
          cd scripts
          npm install cheerio axios
      
      - name: Scrape OzBargain
        run: node scripts/scrape-ozbargain.js
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          DEALS_NAMESPACE_ID: ${{ secrets.DEALS_NAMESPACE_ID }}
      
      - name: Log completion
        run: echo "Scraping completed at $(date)"
```

### 3. OzBargain Scraper (`scripts/scrape-ozbargain.js`)

```javascript
const axios = require('axios');
const cheerio = require('cheerio');

// Configuration
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const DEALS_NAMESPACE_ID = process.env.DEALS_NAMESPACE_ID;

const CATEGORIES = {
  computing: 'https://www.ozbargain.com.au/cat/computing',
  electronics: 'https://www.ozbargain.com.au/cat/electrical-electronics',
  mobile: 'https://www.ozbargain.com.au/cat/mobile'
};

async function scrapeOzBargain(url, category) {
  console.log(`Scraping ${category} from ${url}...`);
  
  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LaynesWorldBot/1.0; +https://lhurstwork.github.io/Laynes_World/)'
      }
    });
    
    const $ = cheerio.load(data);
    const deals = [];
    
    $('.node-ozbdeal').each((i, elem) => {
      if (i >= 20) return false; // Limit to 20 deals per category
      
      const $deal = $(elem);
      const dealId = $deal.attr('id');
      const title = $deal.find('.title a').text().trim();
      const link = $deal.find('.title a').attr('href');
      const price = $deal.find('.price').text().trim();
      const votes = parseInt($deal.find('.voteup').text().trim()) || 0;
      const image = $deal.find('.foxshot-container img').attr('src') || 
                   $deal.find('img').first().attr('src');
      
      // Extract discount percentage if available
      const discountText = $deal.find('.via').text();
      const discountMatch = discountText.match(/(\d+)%/);
      const discount = discountMatch ? discountMatch[1] + '%' : null;
      
      if (title && link) {
        deals.push({
          id: dealId || `oz-${category}-${i}`,
          title: title,
          price: price || 'See deal',
          discount: discount,
          image: image,
          link: link.startsWith('http') ? link : `https://www.ozbargain.com.au${link}`,
          votes: votes,
          source: 'OzBargain',
          category: category,
          scrapedAt: new Date().toISOString()
        });
      }
    });
    
    console.log(`Found ${deals.length} deals in ${category}`);
    return deals;
  } catch (error) {
    console.error(`Error scraping ${category}:`, error.message);
    return [];
  }
}

async function uploadToCloudflare(deals, cacheKey) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/storage/kv/namespaces/${DEALS_NAMESPACE_ID}/values/${cacheKey}`;
  
  try {
    await axios.put(url, JSON.stringify(deals), {
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`✓ Uploaded ${deals.length} deals to Cloudflare KV (${cacheKey})`);
  } catch (error) {
    console.error(`✗ Failed to upload to Cloudflare:`, error.response?.data || error.message);
    throw error;
  }
}

async function main() {
  console.log('Starting OzBargain scraper...\n');
  
  const allDeals = [];
  
  // Scrape each category
  for (const [category, url] of Object.entries(CATEGORIES)) {
    const deals = await scrapeOzBargain(url, category);
    allDeals.push(...deals);
    
    // Upload category-specific cache
    await uploadToCloudflare(deals, `deals-${category}`);
    
    // Rate limiting - wait 2 seconds between requests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Upload combined cache
  await uploadToCloudflare(allDeals, 'deals-all');
  
  console.log(`\n✓ Scraping completed! Total deals: ${allDeals.length}`);
}

main().catch(error => {
  console.error('Scraper failed:', error);
  process.exit(1);
});
```

### 4. Package.json for scripts (`scripts/package.json`)

```json
{
  "name": "laynes-world-scrapers",
  "version": "1.0.0",
  "description": "Web scrapers for Layne's World",
  "dependencies": {
    "axios": "^1.6.0",
    "cheerio": "^1.0.0-rc.12"
  }
}
```

---

## Getting Cloudflare API Token

1. Go to https://dash.cloudflare.com/profile/api-tokens
2. Click "Create Token"
3. Use "Edit Cloudflare Workers" template
4. Add permissions:
   - Account → Workers KV Storage → Edit
5. Copy the token (you won't see it again!)

## Getting Cloudflare Account ID

1. Go to https://dash.cloudflare.com/
2. Click on "Workers & Pages"
3. Your Account ID is shown on the right side

---

## Testing

### Test Worker Locally

```bash
cd laynes-world-api
wrangler dev
```

Visit `http://localhost:8787/api/deals`

### Test Scraper Locally

```bash
cd scripts
npm install
node scrape-ozbargain.js
```

### Test GitHub Action

1. Go to your repo → Actions tab
2. Click "Scrape Australian Tech Deals"
3. Click "Run workflow"
4. Wait for it to complete
5. Check the logs

---

## Monitoring

### Check if deals are cached

```bash
# List all keys in KV namespace
wrangler kv:key list --namespace-id=YOUR_NAMESPACE_ID

# Get specific key
wrangler kv:key get "deals-all" --namespace-id=YOUR_NAMESPACE_ID
```

### View Worker logs

```bash
wrangler tail
```

---

## Next Steps

1. **Set up Cloudflare Worker** (follow steps 1-7)
2. **Test worker locally** with `wrangler dev`
3. **Deploy worker** with `wrangler deploy`
4. **Set up GitHub Actions** (step 8)
5. **Run scraper manually** to test
6. **Update frontend** to use new API

Would you like me to help you with any specific step?
