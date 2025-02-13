const { chromium } = require('playwright');
const fs = require('fs');
const { error } = require('console');

(async () => {
    const startTime = Date.now();
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    // Break loop after process termination
    // Prevents going through elements while termination
    process.on('SIGINT', function () {
        console.warn(' Crawling stopped...');
        process.exit();
    });

    // Set global timeouts
    page.setDefaultTimeout(60000);
    page.setDefaultNavigationTimeout(60000);

    // Get urls from the file
    const urls = fs
        .readFileSync('urls.txt', 'utf-8')
        .split('\n')
        .map((url) => url.trim())
        .filter((url) => url.length > 0);

    // Gather uniqe urls
    let domains = {};
    let uniqueUrls = urls.filter(function (url) {
        let domain = new URL(url);
        if (domains[domain.host]) {
            // we have seen this domain before, so ignore the URL
            return false;
        }
        // mark domain, retain URL
        domains[domain.host] = true;
        return true;
    });

    // Gather uniqe hosts for cookie Array creation
    const uniqeHosts = uniqueUrls.map((el) => new URL(el).host);

    // If needed - define the cookie which will be used for all the urls
    // Cookie Array creation
    const cookiesForAllUrls = uniqeHosts.map((el) => ({
        name: 'SUP_COOKIE',
        value: 'new',
        domain: '.' + el,
        path: '/',
        httpOnly: true,
        secure: false,
    }));

    // If needed - add the cookie Array to the browser context
    await context.addCookies(cookiesForAllUrls);

    const failedUrls = [];
    let crawledCount = 0;
    let successfulCount = 0;
    let timeoutCount = 0;
    let errorCount = 0;

    for (const url of urls) {
        crawledCount++;

        try {
            let startTime = new Date();
            const totalPercentage = (crawledCount * 100) / urls.length;
            console.log(
                `Visiting: ${crawledCount}/${
                    urls.length
                } [${totalPercentage.toFixed(2)}%]`
            );
            console.log(`URL: ${url}`);

            // Attempt to load the page
            await page.goto(url, { waitUntil: 'commit', timeout: 60000 });

            let endTime = new Date();
            let timeElapsed = (endTime - startTime) / 1000;
            console.log(`✅ Load time: ${timeElapsed} seconds`);
            console.log(`-----------------------------------------------`);
            successfulCount++;

            fs.appendFile('urls-crawled.txt', url + '\n', function (err) {
                if (err) throw err;
            });

            const filePath = './urls.txt';

            let urlsContent = fs.readFileSync(filePath).toString().split('\n'); // read file and convert to array by line break
            urlsContent.shift(); // remove the the first element from array
            urlsContent = urlsContent.join('\n'); // convert array back to string

            fs.writeFileSync(filePath, urlsContent);

            await page.waitForTimeout(500);
        } catch (error) {
            if (error.message.includes('TimeoutError')) {
                console.log(`❌ Timeout on: ${url}. Skipping...`);
                timeoutCount++;
            } else {
                console.log(`❌ Error on: ${url}. Skipping...`, error);
                errorCount++;
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
    console.log(
        `\nIt took ${timeTaken.toFixed(
            2
        )} seconds to crawl through ${crawledCount} pages.`
    );

    await browser.close();
})();
