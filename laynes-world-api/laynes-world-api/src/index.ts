export interface Env {
  DEALS_CACHE: KVNamespace;
  NEWS_CACHE: KVNamespace;
}

interface Deal {
  id: string;
  productName: string;
  price: string;
  originalPrice: number;
  salePrice: number;
  discountPercentage: number;
  discount?: string;
  imageUrl?: string;
  url: string;
  votes?: number;
  source: string;
  category: string;
  status: string;
  expirationDate: string;
  scrapedAt: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': 'https://lhurstwork.github.io',
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
        const cached = await env.DEALS_CACHE.get(cacheKey);
        
        if (cached) {
          const deals: Deal[] = JSON.parse(cached);
          return new Response(JSON.stringify({
            deals: deals,
            count: deals.length,
            cached: true,
            timestamp: new Date().toISOString()
          }), {
            headers: corsHeaders
          });
        }
        
        // No cache available
        return new Response(JSON.stringify({
          deals: [],
          count: 0,
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
          count: 0,
          error: 'Internal server error',
          timestamp: new Date().toISOString()
        }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }

    // GET /api/news
    if (url.pathname === '/api/news' || url.pathname === '/api/news/') {
      try {
        const category = url.searchParams.get('category');
        const cacheKey = category ? `news-${category}` : 'news-all';
        
        // Try to get from cache
        const cached = await env.NEWS_CACHE.get(cacheKey);
        
        if (cached) {
          const articles = JSON.parse(cached);
          return new Response(JSON.stringify({
            articles: articles,
            count: articles.length,
            cached: true,
            timestamp: new Date().toISOString()
          }), {
            headers: corsHeaders
          });
        }
        
        // No cache available
        return new Response(JSON.stringify({
          articles: [],
          count: 0,
          cached: false,
          error: 'No news available. Scraper may not have run yet.',
          timestamp: new Date().toISOString()
        }), {
          status: 200,
          headers: corsHeaders
        });
      } catch (error) {
        return new Response(JSON.stringify({
          articles: [],
          count: 0,
          error: 'Internal server error',
          timestamp: new Date().toISOString()
        }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }

    // Health check endpoint
    if (url.pathname === '/health' || url.pathname === '/health/') {
      return new Response(JSON.stringify({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }), {
        headers: corsHeaders
      });
    }

    // Root endpoint - API documentation
    if (url.pathname === '/' || url.pathname === '') {
      return new Response(JSON.stringify({
        name: 'Laynes World API',
        version: '1.0.0',
        endpoints: {
          '/api/deals': 'Get all deals or filter by category (?category=computing|electronics|mobile)',
          '/api/news': 'Get all news or filter by category (?category=technology|business|entertainment)',
          '/health': 'Health check endpoint'
        },
        timestamp: new Date().toISOString()
      }), {
        headers: corsHeaders
      });
    }

    return new Response(JSON.stringify({
      error: 'Not Found',
      availableEndpoints: ['/api/deals', '/api/news', '/health', '/']
    }), {
      status: 404,
      headers: corsHeaders
    });
  },
};
