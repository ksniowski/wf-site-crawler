const { chromium } = require('playwright');
const fs = require('fs');
const { error } = require('console');

// If needed - define the cookie
const cookie = {
    name: 'cookie name',
    value: 'cookie value',
    domain: 'your domain', //for example: www.google.com
    path: '/',
    httpOnly: true,
    secure: false
};

(async () => {
    const startTime = Date.now();
    const browser = await chromium.launch({ headless: false, slowMo: 500 });
    const context = await browser.newContext();
    const page = await context.newPage();

    // Set global timeouts
    page.setDefaultTimeout(60000);
    page.setDefaultNavigationTimeout(60000);

    // If needed - add the cookie to the browser context
    // await context.addCookies([cookie]);

    const urls = fs.readFileSync('urls.txt', 'utf-8')
        .split('\n')
        .map(url => url.trim())
        .filter(url => url.length > 0);

    const failedUrls = [];
    let crawledCount = 0;
    let successfulCount = 0;
    let timeoutCount = 0;
    let errorCount = 0;

    for (const url of urls) {
        crawledCount++;

        try {
            console.log(`Visiting: ${url}`);

            // Attempt to load the page
            await page.goto(url, { waitUntil: 'load', timeout: 60000 });
            await page.waitForLoadState('load');

            console.log(`Fully Loaded: ${url}`);
            successfulCount++;

            //await page.waitForTimeout(500);

        } catch (error) {
            if (error.message.includes('TimeoutError')) {
                console.log(`Timeout on: ${url}. Skipping...`);
                timeoutCount++
            } else {
                console.log(`Error on: ${url}. Skipping...`, error);
                errorCount++
            }

            failedUrls.push(url);
        }
    }

    if (failedUrls.length > 0) {
        fs.writeFileSync('failedUrls.txt', failedUrls.join('\n'));
        console.log(`Failed URLs saved to 'failedUrls.txt'`);
    } else {
        console.log('No URLs failed.');
    }

    console.log(`\nCrawl Summary:`);
    console.log(`Total Sites Crawled: ${crawledCount}`);
    console.log(`Sites Fully Loaded: ${successfulCount}`);
    console.log(`Sites with timeout: ${timeoutCount}`);
    console.log(`Sites with error: ${errorCount}`);

    const endTime = Date.now();
    const timeTaken = (endTime - startTime) / 1000;
    console.log(`\nIt took ${timeTaken.toFixed(2)} seconds to crawl through ${crawledCount} pages.`);

    await browser.close();
})();