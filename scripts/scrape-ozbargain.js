const axios = require('axios');
const { parseStringPromise } = require('xml2js');

// Configuration
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const DEALS_NAMESPACE_ID = process.env.DEALS_NAMESPACE_ID;

const RSS_FEEDS = {
  computing: 'https://www.ozbargain.com.au/cat/computing/feed',
  electronics: 'https://www.ozbargain.com.au/cat/electrical-electronics/feed',
  mobile: 'https://www.ozbargain.com.au/cat/mobile/feed'
};

async function scrapeOzBargainRSS(feedUrl, category) {
  console.log(`Fetching RSS feed for ${category} from ${feedUrl}...`);
  
  try {
    const { data } = await axios.get(feedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LaynesWorldBot/1.0; +https://lhurstwork.github.io/Laynes_World/)'
      }
    });
    
    const result = await parseStringPromise(data);
    const items = result.rss?.channel?.[0]?.item || [];
    const deals = [];
    
    items.slice(0, 20).forEach((item, i) => {
      const title = item.title?.[0] || '';
      const link = item.link?.[0] || '';
      const guid = item.guid?.[0]?._ || item.guid?.[0] || '';
      const pubDate = item.pubDate?.[0] || '';
      const description = item.description?.[0] || '';
      
      // Extract image from media:content or enclosure
      let imageUrl = null;
      if (item['media:content']?.[0]?.['$']?.url) {
        imageUrl = item['media:content'][0]['$'].url;
      } else if (item['media:thumbnail']?.[0]?.['$']?.url) {
        imageUrl = item['media:thumbnail'][0]['$'].url;
      } else if (item.enclosure?.[0]?.['$']?.url) {
        imageUrl = item.enclosure[0]['$'].url;
      }
      
      // Extract prices from title and description
      const priceInfo = extractPriceInfo(title, description);
      
      // Parse publication date
      const publishedDate = pubDate ? new Date(pubDate) : new Date();
      const expirationDate = new Date(publishedDate);
      expirationDate.setDate(expirationDate.getDate() + 7); // 7 days expiry
      
      if (title && link) {
        deals.push({
          id: guid || `oz-${category}-${i}`,
          productName: cleanTitle(title),
          price: priceInfo.salePrice ? `$${priceInfo.salePrice}` : 'See deal',
          originalPrice: priceInfo.originalPrice || 0,
          salePrice: priceInfo.salePrice || 0,
          discountPercentage: priceInfo.discountPercentage || 0,
          discount: priceInfo.discountPercentage ? `${priceInfo.discountPercentage}%` : null,
          imageUrl: imageUrl,
          url: link,
          votes: 0, // RSS doesn't include votes
          source: 'OzBargain',
          category: category,
          status: 'current',
          expirationDate: expirationDate.toISOString(),
          scrapedAt: new Date().toISOString()
        });
      }
    });
    
    console.log(`Found ${deals.length} deals in ${category}`);
    return deals;
  } catch (error) {
    console.error(`Error fetching RSS feed for ${category}:`, error.message);
    return [];
  }
}

function extractPriceInfo(title, description) {
  const text = `${title} ${description}`;
  
  // Find all prices
  const priceRegex = /\$(\d+(?:\.\d{2})?)/g;
  const prices = [];
  let match;
  
  while ((match = priceRegex.exec(text)) !== null) {
    prices.push(parseFloat(match[1]));
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
      originalPrice: prices[0] * 1.3,
      salePrice: prices[0],
      discountPercentage: 30
    };
  }
  
  return { originalPrice: 0, salePrice: 0, discountPercentage: 0 };
}

function cleanTitle(title) {
  return title
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
  console.log('Starting OzBargain RSS scraper...\n');
  
  if (!CLOUDFLARE_API_TOKEN || !CLOUDFLARE_ACCOUNT_ID || !DEALS_NAMESPACE_ID) {
    console.error('Missing required environment variables:');
    console.error('- CLOUDFLARE_API_TOKEN');
    console.error('- CLOUDFLARE_ACCOUNT_ID');
    console.error('- DEALS_NAMESPACE_ID');
    process.exit(1);
  }
  
  const allDeals = [];
  
  // Scrape each category RSS feed
  for (const [category, feedUrl] of Object.entries(RSS_FEEDS)) {
    const deals = await scrapeOzBargainRSS(feedUrl, category);
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
