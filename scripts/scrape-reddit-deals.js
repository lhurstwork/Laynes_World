const axios = require('axios');
const { parseStringPromise } = require('xml2js');

// Configuration
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const DEALS_NAMESPACE_ID = process.env.DEALS_NAMESPACE_ID;

// Reddit RSS feeds for Australian tech deals
const REDDIT_FEEDS = {
  bapcsalesaustralia: 'https://www.reddit.com/r/bapcsalesaustralia/.rss',
  australiandeals: 'https://www.reddit.com/r/AustralianDeals/.rss',
  ozbargain_reddit: 'https://www.reddit.com/r/OzBargain/.rss'
};

async function scrapeRedditRSS(feedUrl, source) {
  console.log(`Fetching deals from ${source}...`);
  
  try {
    const { data } = await axios.get(feedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LaynesWorldBot/1.0; +https://lhurstwork.github.io/Laynes_World/)'
      }
    });
    
    const result = await parseStringPromise(data);
    const entries = result.feed?.entry || [];
    const deals = [];
    
    entries.slice(0, 15).forEach((entry, i) => {
      try {
        const title = entry.title?.[0] || '';
        const link = entry.link?.[0]?.['$']?.href || entry.id?.[0] || '';
        const published = entry.published?.[0] || entry.updated?.[0] || '';
        const content = entry.content?.[0]?._ || entry.summary?.[0] || '';
        
        // Extract price information from title
        const priceInfo = extractPriceInfo(title, content);
        
        // Determine category from title keywords
        const category = determineCategory(title);
        
        // Parse publication date
        const publishedDate = published ? new Date(published) : new Date();
        const expirationDate = new Date(publishedDate);
        expirationDate.setDate(expirationDate.getDate() + 7); // 7 days expiry
        
        if (title && link) {
          deals.push({
            id: `reddit-${source}-${i}-${Date.now()}`,
            productName: cleanTitle(title),
            price: priceInfo.salePrice ? `$${priceInfo.salePrice}` : 'See deal',
            originalPrice: priceInfo.originalPrice || 0,
            salePrice: priceInfo.salePrice || 0,
            discountPercentage: priceInfo.discountPercentage || 0,
            discount: priceInfo.discountPercentage ? `${priceInfo.discountPercentage}%` : null,
            imageUrl: null, // Reddit RSS doesn't include images easily
            url: link,
            votes: 0,
            source: `Reddit ${source}`,
            category: category,
            status: 'current',
            expirationDate: expirationDate.toISOString(),
            scrapedAt: new Date().toISOString()
          });
        }
      } catch (err) {
        console.error(`Error parsing entry from ${source}:`, err.message);
      }
    });
    
    console.log(`  ✓ Found ${deals.length} deals from ${source}`);
    return deals;
    
  } catch (error) {
    console.error(`  ✗ Error fetching ${source}:`, error.message);
    return [];
  }
}

function extractPriceInfo(title, content) {
  const text = `${title} ${content}`;
  
  // Find all prices
  const priceRegex = /\$(\d+(?:,\d{3})*(?:\.\d{2})?)/g;
  const prices = [];
  let match;
  
  while ((match = priceRegex.exec(text)) !== null) {
    // Remove commas and parse
    prices.push(parseFloat(match[1].replace(/,/g, '')));
  }
  
  // Find discount percentage
  const discountRegex = /(\d+)%\s*(?:off|discount|save)/i;
  const discountMatch = text.match(discountRegex);
  
  if (prices.length >= 2) {
    const originalPrice = Math.max(...prices);
    const salePrice = Math.min(...prices);
    const discountPercentage = Math.round(((originalPrice - salePrice) / originalPrice) * 100);
    return { originalPrice, salePrice, discountPercentage };
  } else if (prices.length === 1 && discountMatch) {
    const salePrice = prices[0];
    const discountPercentage = parseInt(discountMatch[1]);
    const originalPrice = salePrice / (1 - discountPercentage / 100);
    return { 
      originalPrice: Math.round(originalPrice * 100) / 100, 
      salePrice, 
      discountPercentage 
    };
  } else if (prices.length === 1) {
    return {
      originalPrice: prices[0] * 1.2,
      salePrice: prices[0],
      discountPercentage: 20
    };
  }
  
  return { originalPrice: 0, salePrice: 0, discountPercentage: 0 };
}

function determineCategory(title) {
  const titleLower = title.toLowerCase();
  
  if (titleLower.match(/\b(cpu|processor|ryzen|intel|motherboard|ram|memory|ssd|nvme|hdd|storage)\b/)) {
    return 'computing';
  } else if (titleLower.match(/\b(gpu|graphics|rtx|radeon|monitor|display|keyboard|mouse|headset|webcam)\b/)) {
    return 'electronics';
  } else if (titleLower.match(/\b(phone|mobile|iphone|samsung|pixel|tablet|ipad|watch|airpods|earbuds)\b/)) {
    return 'mobile';
  }
  
  return 'computing'; // Default category
}

function cleanTitle(title) {
  // Remove Reddit formatting and clean up
  return title
    .replace(/\[.*?\]/g, '') // Remove [tags]
    .replace(/\(.*?\)/g, '') // Remove (parentheses) at start
    .replace(/\s+/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
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
  console.log('Starting Reddit deals scraper...\n');
  
  if (!CLOUDFLARE_API_TOKEN || !CLOUDFLARE_ACCOUNT_ID || !DEALS_NAMESPACE_ID) {
    console.error('Missing required environment variables:');
    console.error('- CLOUDFLARE_API_TOKEN');
    console.error('- CLOUDFLARE_ACCOUNT_ID');
    console.error('- DEALS_NAMESPACE_ID');
    process.exit(1);
  }
  
  const allDeals = [];
  const dealsByCategory = {
    computing: [],
    electronics: [],
    mobile: []
  };
  
  // Scrape each Reddit feed
  for (const [source, feedUrl] of Object.entries(REDDIT_FEEDS)) {
    const deals = await scrapeRedditRSS(feedUrl, source);
    allDeals.push(...deals);
    
    // Categorize deals
    deals.forEach(deal => {
      if (dealsByCategory[deal.category]) {
        dealsByCategory[deal.category].push(deal);
      }
    });
    
    // Rate limiting - wait 2 seconds between requests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Upload category-specific caches
  for (const [category, deals] of Object.entries(dealsByCategory)) {
    if (deals.length > 0) {
      await uploadToCloudflare(deals, `deals-${category}`);
    }
  }
  
  // Upload combined cache
  if (allDeals.length > 0) {
    await uploadToCloudflare(allDeals, 'deals-all');
  }
  
  console.log(`\n✓ Scraping completed! Total deals: ${allDeals.length}`);
  
  if (allDeals.length === 0) {
    console.warn('⚠ Warning: No deals were scraped.');
  }
}

main().catch(error => {
  console.error('Scraper failed:', error);
  process.exit(1);
});
