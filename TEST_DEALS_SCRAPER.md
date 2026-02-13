# Testing the Deals Scraper

## Issue
The Cloudflare Worker API returns empty deals array because the KV store hasn't been populated yet.

## Solution Options

### Option 1: Manually Trigger GitHub Action (Recommended)
1. Go to: https://github.com/lhurstwork/Laynes_World/actions/workflows/scrape-deals.yml
2. Click "Run workflow" button
3. Select branch: `main`
4. Click "Run workflow"
5. Wait 1-2 minutes for completion
6. Test the API: `curl https://laynes-world-api.laynes-world.workers.dev/api/deals`

### Option 2: Run Scraper Locally
```powershell
# Navigate to scripts directory
cd scripts

# Install dependencies (if not already done)
npm install

# Set environment variables
$env:CLOUDFLARE_API_TOKEN="your-token"
$env:CLOUDFLARE_ACCOUNT_ID="2bc0107e0a4c13f4f0ddf51ba5a87b37"
$env:DEALS_NAMESPACE_ID="fac217d18eaf4632809a44d8d5d3ed52"

# Run the scraper
node scrape-ozbargain.js
```

### Option 3: Wait for Scheduled Run
The workflow runs automatically every 30 minutes. Next run will be at the next 30-minute mark (e.g., 10:30, 11:00, 11:30, etc.)

## Verification Steps

After running the scraper, verify it worked:

1. **Check API Response:**
```powershell
curl https://laynes-world-api.laynes-world.workers.dev/api/deals
```

Should return deals array with data.

2. **Check by Category:**
```powershell
curl "https://laynes-world-api.laynes-world.workers.dev/api/deals?category=computing"
curl "https://laynes-world-api.laynes-world.workers.dev/api/deals?category=electronics"
curl "https://laynes-world-api.laynes-world.workers.dev/api/deals?category=mobile"
```

3. **Test Frontend:**
Visit https://lhurstwork.github.io/Laynes_World/ and click on "Tech Deals" tab.

## Current Status

- ✅ Cloudflare Worker deployed and healthy
- ✅ KV namespace created (ID: fac217d18eaf4632809a44d8d5d3ed52)
- ✅ GitHub Actions workflow configured
- ✅ Frontend integrated with Worker API
- ❌ KV store is empty (scraper needs to run)

## Expected Behavior After Scraper Runs

The scraper will:
1. Scrape OzBargain for Computing, Electronics, and Mobile deals
2. Extract up to 20 deals per category (60 total)
3. Upload to Cloudflare KV with keys:
   - `deals-all` - All deals combined
   - `deals-computing` - Computing category only
   - `deals-electronics` - Electronics category only
   - `deals-mobile` - Mobile category only

## Troubleshooting

If deals still don't appear after running scraper:

1. **Check GitHub Actions logs:**
   - Go to Actions tab
   - Click on the workflow run
   - Check for errors in the logs

2. **Verify secrets are set:**
   - CLOUDFLARE_API_TOKEN
   - CLOUDFLARE_ACCOUNT_ID
   - DEALS_NAMESPACE_ID

3. **Check Cloudflare KV Dashboard:**
   - Login to Cloudflare Dashboard
   - Go to Workers & Pages > KV
   - Select "deals-cache" namespace
   - Verify keys exist: deals-all, deals-computing, etc.
