const puppeteer = require('puppeteer');

async function LaunchBrowserExecutor(environment) {
  try {
    const websiteUrl = environment.getInput('Website Url');
    console.log(websiteUrl);

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox'],
    });
    environment.log.info('Browser started successfully');
    environment.setBrowser(browser);
    const page = await browser.newPage();
    await page.goto(websiteUrl);
    environment.setPage(page);
    environment.log.info(`Opened page at: ${websiteUrl}`);
    return true;
  } catch (error) {
    environment.log.error(error.message);
    return false;
  }
}

module.exports = LaunchBrowserExecutor;

