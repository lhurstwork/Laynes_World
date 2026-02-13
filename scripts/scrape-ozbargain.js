const axios = require('axios');
const puppeteer = require('puppeteer');

// Configuration
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const DEALS_NAMESPACE_ID = process.env.DEALS_NAMESPACE_ID;

const CATEGORIES = {
  computing: 'https://www.ozbargain.com.au/cat/computing',
  electronics: 'https://www.ozbargain.com.au/cat/electrical-electronics',
  mobile: 'https://www.ozbargain.com.au/cat/mobile'
};

async function scrapeOzBargainWithBrowser(url, category) {
  console.log(`Scraping ${category} from ${url} using headless browser...`);
  
  let browser;
  try {
    // Launch headless browser
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu'
      ]
    });
    
    const page = await browser.newPage();
    
    // Set user agent to look like a real browser
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Navigate to the page
    console.log(`  Navigating to ${url}...`);
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: 90000 
    });
    
    // Wait a bit for any JavaScript to execute
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Debug: Check what's on the page
    const pageContent = await page.evaluate(() => {
      return {
        title: document.title,
        hasCloudflare: document.body.innerHTML.includes('cloudflare') || document.body.innerHTML.includes('challenge'),
        bodyText: document.body.innerText.substring(0, 500)
      };
    });
    console.log(`  Page title: ${pageContent.title}`);
    console.log(`  Has Cloudflare challenge: ${pageContent.hasCloudflare}`);
    if (pageContent.hasCloudflare) {
      console.log(`  ⚠ Cloudflare challenge detected! Waiting longer...`);
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
    
    // Try to wait for deal elements, but don't fail if they don't appear
    console.log(`  Waiting for deals to load...`);
    try {
      await page.waitForSelector('.node-ozbdeal', { timeout: 45000 });
    } catch (error) {
      console.log(`  Could not find .node-ozbdeal selector, trying alternative selectors...`);
      
      // Try alternative selectors
      const hasDeals = await page.evaluate(() => {
        return document.querySelector('.node') !== null || 
               document.querySelector('[class*="deal"]') !== null;
      });
      
      if (!hasDeals) {
        console.log(`  No deals found on page. Page might be blocked or structure changed.`);
        // Take a screenshot for debugging (optional)
        await page.screenshot({ path: `/tmp/ozbargain-${category}.png` });
        return [];
      }
    }
    
    // Extract deal data from the page
    console.log(`  Extracting deal data...`);
    const deals = await page.evaluate(() => {
      const dealElements = document.querySelectorAll('.node-ozbdeal');
      const extractedDeals = [];
      
      dealElements.forEach((dealElem, index) => {
        if (index >= 20) return; // Limit to 20 deals
        
        try {
          const dealId = dealElem.getAttribute('id');
          const titleElem = dealElem.querySelector('.title a');
          const title = titleElem ? titleElem.textContent.trim() : '';
          const link = titleElem ? titleElem.getAttribute('href') : '';
          
          const priceElem = dealElem.querySelector('.price');
          const price = priceElem ? priceElem.textContent.trim() : '';
          
          const voteElem = dealElem.querySelector('.voteup');
          const votes = voteElem ? parseInt(voteElem.textContent.trim()) || 0 : 0;
          
          // Try to find image
          let imageUrl = null;
          const imgElem = dealElem.querySelector('.foxshot-container img') || 
                         dealElem.querySelector('img');
          if (imgElem) {
            imageUrl = imgElem.getAttribute('src') || imgElem.getAttribute('data-src');
          }
          
          // Extract discount percentage
          const viaElem = dealElem.querySelector('.via');
          const viaText = viaElem ? viaElem.textContent : '';
          const discountMatch = viaText.match(/(\d+)%/);
          const discount = discountMatch ? discountMatch[1] + '%' : null;
          
          if (title && link) {
            extractedDeals.push({
              id: dealId,
              title: title,
              link: link,
              price: price,
              votes: votes,
              imageUrl: imageUrl,
              discount: discount
            });
          }
        } catch (err) {
          console.error('Error extracting deal:', err);
        }
      });
      
      return extractedDeals;
    });
    
    // Process and format deals
    const formattedDeals = deals.map((deal, i) => {
      // Extract prices from title and price text
      const priceText = `${deal.title} ${deal.price}`;
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
        : (deal.discount ? parseInt(deal.discount) : 0);
      
      return {
        id: deal.id || `oz-${category}-${i}`,
        productName: deal.title,
        price: deal.price || 'See deal',
        originalPrice: originalPrice || 0,
        salePrice: salePrice || 0,
        discountPercentage: discountPercentage,
        discount: deal.discount,
        imageUrl: deal.imageUrl,
        url: deal.link.startsWith('http') ? deal.link : `https://www.ozbargain.com.au${deal.link}`,
        votes: deal.votes,
        source: 'OzBargain',
        category: category,
        status: 'current',
        expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        scrapedAt: new Date().toISOString()
      };
    });
    
    console.log(`  ✓ Found ${formattedDeals.length} deals in ${category}`);
    return formattedDeals;
    
  } catch (error) {
    console.error(`  ✗ Error scraping ${category}:`, error.message);
    return [];
  } finally {
    if (browser) {
      await browser.close();
    }
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
  console.log('Starting OzBargain scraper with Puppeteer...\n');
  
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
    const deals = await scrapeOzBargainWithBrowser(url, category);
    allDeals.push(...deals);
    
    // Upload category-specific cache
    if (deals.length > 0) {
      await uploadToCloudflare(deals, `deals-${category}`);
    }
    
    // Rate limiting - wait 3 seconds between requests
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  // Upload combined cache
  if (allDeals.length > 0) {
    await uploadToCloudflare(allDeals, 'deals-all');
  }
  
  console.log(`\n✓ Scraping completed! Total deals: ${allDeals.length}`);
  
  if (allDeals.length === 0) {
    console.warn('⚠ Warning: No deals were scraped. This might indicate:');
    console.warn('  - OzBargain structure has changed');
    console.warn('  - Cloudflare is still blocking access');
    console.warn('  - Network issues during scraping');
    console.warn('Check the logs above for specific errors.');
  }
}

main().catch(error => {
  console.error('Scraper failed:', error);
  process.exit(1);
});
