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
      
      // Extract prices for calculation
      const priceText = `${title} ${price}`;
      const priceRegex = /\$(\d+(?:\.\d{2})?)/g;
      const prices = [];
      let match;
      while ((match = priceRegex.exec(priceText)) !== null) {
        prices.push(parseFloat(match[1]));
      }
      
      const originalPrice = prices.length >= 2 ? Math.max(...prices) : null;
      const salePrice = prices.length >= 1 ? Math.min(...prices) : null;
      const discountPercentage = originalPrice && salePrice 
        ? Math.round(((originalPrice - salePrice) / originalPrice) * 100)
        : (discount ? parseInt(discount) : 0);
      
      if (title && link) {
        deals.push({
          id: dealId || `oz-${category}-${i}`,
          productName: title,
          price: price || 'See deal',
          originalPrice: originalPrice || 0,
          salePrice: salePrice || 0,
          discountPercentage: discountPercentage,
          discount: discount,
          imageUrl: image,
          url: link.startsWith('http') ? link : `https://www.ozbargain.com.au${link}`,
          votes: votes,
          source: 'OzBargain',
          category: category,
          status: 'current',
          expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
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
  
  if (!CLOUDFLARE_API_TOKEN || !CLOUDFLARE_ACCOUNT_ID || !DEALS_NAMESPACE_ID) {
    console.error('Missing required environment variables:');
    console.error('- CLOUDFLARE_API_TOKEN');
    console.error('- CLOUDFLARE_ACCOUNT_ID');
    console.error('- DEALS_NAMESPACE_ID');
    process.exit(1);
  }
  
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
