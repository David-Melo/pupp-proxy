import ProxyChain from 'proxy-chain';
import puppeteer from 'puppeteer';

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

            const response = await page.goto(fixedUrl, {
                waitUntil: 'networkidle0',
                timeout: 30000,
            });

            const finalUrl = page.url(); // resolved after redirects
            const status = response.status();
            const headers = response.headers();
            const html = await page.content();

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