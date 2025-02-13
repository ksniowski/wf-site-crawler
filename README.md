# Basic site crawler

This is a basic site crawler which crawl through the sites from a txt file, checking if the DOM content is loaded.

## Installation

Install the dependencies with a npm:

```bash
npm install
```

and also

```bash
npx playwright install
```

## Usage
Run a command to start crawler to work:
```javascript
node crawler.js
```

Right now you have to provide a URLs in order to make the crawler works. All of the URLs should be included in file: 
```
urls.txt
```


If you need certain cookie to be passed, you can set the cookie in a 
```javascript
const cookie = {
    name: 'cookie name',
    value: 'cookie value',
    domain: 'your domain', //for example: www.google.com
    path: '/',
    httpOnly: true,
    secure: false
};
```

Make sure to add cookie to the browser context:
```javascript
await context.addCookies([cookie]);
```

You can also change the default timeout:
```javascript
page.setDefaultTimeout(60000);
page.setDefaultNavigationTimeout(60000);
```
