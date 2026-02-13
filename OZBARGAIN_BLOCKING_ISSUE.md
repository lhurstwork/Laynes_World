# OzBargain Cloudflare Blocking Issue

## Problem
OzBargain has implemented Cloudflare bot protection that blocks automated scraping attempts, including:
- Direct HTML scraping
- RSS feed access
- Any requests without JavaScript/cookies enabled

This affects both local testing and GitHub Actions workflows.

## Current Status
- ✅ News scraping: Working (uses different sources without bot protection)
- ❌ Deals scraping: Blocked by Cloudflare
- 🔄 Temporary solution: Using mock data for deals

## Potential Solutions

### Option 1: Use a Headless Browser (Recommended)
Use Puppeteer or Playwright in the GitHub Actions workflow to render JavaScript and bypass Cloudflare protection.

**Pros:**
- Can handle JavaScript challenges
- Most reliable for scraping protected sites
- Can screenshot for debugging

**Cons:**
- Slower execution
- Higher resource usage
- More complex setup

**Implementation:**
```javascript
const puppeteer = require('puppeteer');

async function scrapeWithBrowser() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.goto('https://www.ozbargain.com.au/cat/computing');
  
  // Wait for Cloudflare challenge to complete
  await page.waitForSelector('.node-ozbdeal', { timeout: 30000 });
  
  const deals = await page.evaluate(() => {
    // Extract deal data from DOM
  });
  
  await browser.close();
  return deals;
}
```

### Option 2: Use Alternative Deal Sources
Find other Australian tech deal sources without bot protection.

**Potential sources:**
- Catch.com.au deals
- JB Hi-Fi specials
- Harvey Norman sales
- Amazon Australia deals
- eBay Australia deals

**Pros:**
- No bot protection issues
- More diverse deal sources
- Easier to maintain

**Cons:**
- Need to implement multiple scrapers
- Different data formats
- May not have RSS feeds

### Option 3: Use a Proxy Service
Use a residential proxy or scraping API service.

**Services:**
- ScraperAPI
- Bright Data
- Oxylabs
- Apify

**Pros:**
- Handles bot protection automatically
- Reliable
- Managed infrastructure

**Cons:**
- Costs money (most have free tiers)
- External dependency
- API rate limits

### Option 4: Manual Curation
Manually curate deals or use a different approach.

**Pros:**
- No technical barriers
- Quality control
- No blocking issues

**Cons:**
- Time-consuming
- Not automated
- Doesn't scale

## Recommended Next Steps

1. **Short term:** Keep using mock data (current solution)
2. **Medium term:** Implement Option 1 (Puppeteer) for OzBargain
3. **Long term:** Add Option 2 (alternative sources) for diversity

## Implementation Plan for Puppeteer Solution

1. Update `scripts/package.json` to include puppeteer
2. Modify `scripts/scrape-ozbargain.js` to use headless browser
3. Update GitHub Actions workflow to install Chrome dependencies
4. Test locally before deploying
5. Monitor for Cloudflare updates that might break the solution

## Notes
- Cloudflare protection is becoming more common
- Need to respect robots.txt and rate limits
- Consider reaching out to OzBargain for API access
- Mock data provides good UX while we implement a solution
