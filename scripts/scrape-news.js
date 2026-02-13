const axios = require('axios');
const cheerio = require('cheerio');

// Configuration
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const NEWS_NAMESPACE_ID = process.env.NEWS_NAMESPACE_ID;

const SOURCES = {
  technology: [
    { name: 'TechCrunch', url: 'https://techcrunch.com/', selector: '.post-block', category: 'technology' },
    { name: 'The Verge', url: 'https://www.theverge.com/tech', selector: 'article', category: 'technology' },
    { name: 'Ars Technica', url: 'https://arstechnica.com/', selector: 'article', category: 'technology' }
  ],
  business: [
    { name: 'Reuters Business', url: 'https://www.reuters.com/business/', selector: 'article', category: 'business' },
    { name: 'CNBC', url: 'https://www.cnbc.com/technology/', selector: '.Card-titleContainer', category: 'business' }
  ],
  entertainment: [
    { name: 'Variety', url: 'https://variety.com/', selector: 'article', category: 'entertainment' },
    { name: 'The Hollywood Reporter', url: 'https://www.hollywoodreporter.com/', selector: 'article', category: 'entertainment' }
  ]
};

async function scrapeNews(source) {
  console.log(`Scraping ${source.name} from ${source.url}...`);
  
  try {
    const { data } = await axios.get(source.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LaynesWorldBot/1.0; +https://lhurstwork.github.io/Laynes_World/)'
      },
      timeout: 10000
    });
    
    const $ = cheerio.load(data);
    const articles = [];
    
    $(source.selector).each((i, elem) => {
      if (i >= 10) return false; // Limit to 10 articles per source
      
      const $article = $(elem);
      const title = $article.find('h2, h3, .post-block__title, .Card-title').first().text().trim();
      const link = $article.find('a').first().attr('href');
      const summary = $article.find('p, .excerpt, .Card-description').first().text().trim();
      const image = $article.find('img').first().attr('src') || $article.find('img').first().attr('data-src');
      
      if (title && link) {
        const fullLink = link.startsWith('http') ? link : new URL(link, source.url).href;
        
        articles.push({
          id: `${source.name.toLowerCase().replace(/\s+/g, '-')}-${i}`,
          title: title,
          source: source.name,
          category: source.category,
          publishedAt: new Date().toISOString(),
          summary: summary || 'No summary available.',
          url: fullLink,
          imageUrl: image && image.startsWith('http') ? image : null
        });
      }
    });
    
    console.log(`Found ${articles.length} articles from ${source.name}`);
    return articles;
  } catch (error) {
    console.error(`Error scraping ${source.name}:`, error.message);
    return [];
  }
}

async function uploadToCloudflare(articles, cacheKey) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/storage/kv/namespaces/${NEWS_NAMESPACE_ID}/values/${cacheKey}`;
  
  try {
    await axios.put(url, JSON.stringify(articles), {
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`✓ Uploaded ${articles.length} articles to Cloudflare KV (${cacheKey})`);
  } catch (error) {
    console.error(`✗ Failed to upload to Cloudflare:`, error.response?.data || error.message);
    throw error;
  }
}

async function main() {
  console.log('Starting news scraper...\n');
  
  if (!CLOUDFLARE_API_TOKEN || !CLOUDFLARE_ACCOUNT_ID || !NEWS_NAMESPACE_ID) {
    console.error('Missing required environment variables:');
    console.error('- CLOUDFLARE_API_TOKEN');
    console.error('- CLOUDFLARE_ACCOUNT_ID');
    console.error('- NEWS_NAMESPACE_ID');
    process.exit(1);
  }
  
  const allArticles = [];
  
  // Scrape each category
  for (const [category, sources] of Object.entries(SOURCES)) {
    const categoryArticles = [];
    
    for (const source of sources) {
      const articles = await scrapeNews(source);
      categoryArticles.push(...articles);
      allArticles.push(...articles);
      
      // Rate limiting - wait 2 seconds between requests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Upload category-specific cache
    await uploadToCloudflare(categoryArticles, `news-${category}`);
  }
  
  // Upload combined cache
  await uploadToCloudflare(allArticles, 'news-all');
  
  console.log(`\n✓ Scraping completed! Total articles: ${allArticles.length}`);
}

main().catch(error => {
  console.error('Scraper failed:', error);
  process.exit(1);
});
