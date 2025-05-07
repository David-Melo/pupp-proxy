import ProxyChain from 'proxy-chain';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

const server = new ProxyChain.Server({
    port: process.env.PROXY_PRIVATE_PORT || 8080,
    prepareRequestFunction: async ({ request }) => {

        const originalUrl = request.url;
        const fixedUrl = originalUrl.startsWith('http') ? originalUrl : `https://${originalUrl}`;

        try {

            console.log(`Using Puppeteer for: ${fixedUrl}`);

            const browser = await puppeteer.launch({
                headless: 'new',
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });

            const page = await browser.newPage();

            // ✅ Mirror incoming headers (with safety fallback)
            const forwardedHeaders = request.headers || {};

            // Set headers on the Puppeteer page
            await page.setExtraHTTPHeaders({
                ...forwardedHeaders,
                // Override with real-looking values
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
            });

            await page.setViewport({ width: 1366, height: 768 });
            await page.emulateTimezone('America/New_York');

            const response = await page.goto(fixedUrl, {
                waitUntil: 'networkidle0',
                timeout: 60000,
            });

            const finalUrl = page.url(); // resolved after redirects
            const status = response.status();
            const headers = response.headers();
            const html = await page.content();
            
            const context = page.browserContext();
            const cookies = await context.cookies();
            
            console.log('Cookies set during navigation:', cookies);
            headers['Set-Cookie'] = cookies.map(c => `${c.name}=${c.value}`).join('; ');
            
            await browser.close();

            console.error(`Puppeteer success for ${fixedUrl}`);

            return {
                response: {
                    statusCode: status,
                    body: html,
                    headers: {
                        'Content-Type': 'text/html; charset=utf-8',
                        'X-Original-URL': originalUrl,
                        'X-Final-URL': finalUrl,
                        ...headers,
                    }
                }
            };

        } catch (err) {

            console.error(`Puppeteer failed for ${fixedUrl}`, err);
            return {
                response: {
                    statusCode: 500,
                    body: `Error loading ${finalUrl}: ${err.message}`,
                    headers: {
                        'Content-Type': 'text/plain'
                    }
                }
            };

        }

    }
});

server.listen(() => {
    console.log(`Proxy server is listening on port ${process.env.PROXY_PRIVATE_PORT}`);
});