// Quick test script to verify the scraper works locally
// Run with: node test-scraper-local.js

const axios = require('axios');

async function testOzBargainAccess() {
  console.log('Testing OzBargain access...\n');
  
  try {
    const response = await axios.get('https://www.ozbargain.com.au/cat/computing', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LaynesWorldBot/1.0)'
      }
    });
    
    console.log('✓ Successfully accessed OzBargain');
    console.log(`  Status: ${response.status}`);
    console.log(`  Content length: ${response.data.length} bytes`);
    
    // Check if we can find deal elements
    const dealMatches = response.data.match(/node-ozbdeal/g);
    console.log(`  Found ${dealMatches ? dealMatches.length : 0} deal elements\n`);
    
    return true;
  } catch (error) {
    console.error('✗ Failed to access OzBargain:', error.message);
    return false;
  }
}

async function testCloudflareAPI() {
  console.log('Testing Cloudflare Worker API...\n');
  
  try {
    const response = await axios.get('https://laynes-world-api.laynes-world.workers.dev/api/deals');
    
    console.log('✓ Successfully accessed Cloudflare Worker');
    console.log(`  Status: ${response.status}`);
    console.log(`  Deals count: ${response.data.count}`);
    console.log(`  Cached: ${response.data.cached}`);
    
    if (response.data.deals && response.data.deals.length > 0) {
      console.log(`  Sample deal: ${response.data.deals[0].productName}\n`);
    } else {
      console.log('  ⚠ No deals in KV store\n');
    }
    
    return response.data.count > 0;
  } catch (error) {
    console.error('✗ Failed to access Cloudflare Worker:', error.message);
    return false;
  }
}

async function main() {
  console.log('=== Deals Scraper Diagnostic Test ===\n');
  
  const ozAccess = await testOzBargainAccess();
  const cfAPI = await testCloudflareAPI();
  
  console.log('=== Summary ===');
  console.log(`OzBargain Access: ${ozAccess ? '✓ Working' : '✗ Failed'}`);
  console.log(`Cloudflare API: ${cfAPI ? '✓ Has Data' : '⚠ No Data (scraper needs to run)'}`);
  
  if (ozAccess && !cfAPI) {
    console.log('\nNext step: Run the scraper to populate Cloudflare KV');
    console.log('  cd scripts && node scrape-ozbargain.js');
  }
}

main();
