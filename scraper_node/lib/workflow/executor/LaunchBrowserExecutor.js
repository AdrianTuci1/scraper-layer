const puppeteer = require('puppeteer');

async function LaunchBrowserExecutor(environment) {
  try {
    const websiteUrl = environment.getInput('Website Url');
    environment.log.info(`Launching browser for URL: ${websiteUrl}`);

    let browser;
    const browserConfig = {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    };

    // Check if Bright Data Browser API is configured
    const brightDataWsEndpoint = process.env.BRIGHT_DATA_BROWSER_WS_ENDPOINT;
    const brightDataCustomerId = process.env.BRIGHT_DATA_CUSTOMER_ID;
    const brightDataZone = process.env.BRIGHT_DATA_ZONE;
    const brightDataPassword = process.env.BRIGHT_DATA_PASSWORD;

    // Try to connect to Bright Data Browser API if configured
    if (brightDataWsEndpoint || (brightDataCustomerId && brightDataZone && brightDataPassword)) {
      try {
        environment.log.info('Connecting to Bright Data Browser API...');
        
        let wsEndpoint;
        if (brightDataWsEndpoint) {
          // Use full WebSocket endpoint if provided
          wsEndpoint = brightDataWsEndpoint.startsWith('wss://') 
            ? brightDataWsEndpoint 
            : `wss://${brightDataWsEndpoint}`;
        } else {
          // Construct WebSocket endpoint from customer_id, zone, and password
          wsEndpoint = `wss://brd-customer-${brightDataCustomerId}-zone-${brightDataZone}:${brightDataPassword}@brd.superproxy.io:22225`;
        }

        environment.log.info('Connecting to Bright Data Browser API endpoint...');
        
        browser = await puppeteer.connect({
          browserWSEndpoint: wsEndpoint,
          defaultViewport: null,
        });

        environment.log.info('Successfully connected to Bright Data Browser API');
      } catch (brightDataError) {
        environment.log.error(`Failed to connect to Bright Data Browser API: ${brightDataError.message}`);
        environment.log.info('Falling back to local browser...');
        
        // Fallback to local browser if Bright Data connection fails
        browser = await puppeteer.launch(browserConfig);
      }
    } else {
      // Use local Puppeteer browser
      environment.log.info('Using local Puppeteer browser (Bright Data not configured)...');
      browser = await puppeteer.launch(browserConfig);
    }

    environment.setBrowser(browser);
    const page = await browser.newPage();
    
    // Set user agent to avoid detection
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );
    
    await page.goto(websiteUrl, { waitUntil: 'networkidle2' });
    environment.setPage(page);
    
    environment.log.info(`Opened page at: ${websiteUrl}`);
    return true;
  } catch (error) {
    environment.log.error(`Browser launch failed: ${error.message}`);
    return false;
  }
}

module.exports = LaunchBrowserExecutor;

