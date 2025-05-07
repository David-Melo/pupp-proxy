import ProxyChain from 'proxy-chain';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

function normalizeUrl(url) {
    try {
        const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
        // Remove :443 for https or :80 for http
        if ((parsed.protocol === 'https:' && parsed.port === '443') ||
            (parsed.protocol === 'http:' && parsed.port === '80')) {
            parsed.port = '';
        }
        return parsed.toString();
    } catch (e) {
        console.warn(`Invalid URL: ${url}`, e);
        return null;
    }
}

function sanitizeHeaders(rawHeaders) {
    const bannedHeaders = [
        'host', 'content-length', 'connection', 'upgrade', 'proxy-connection',
        'accept-encoding', 'content-encoding'
    ];

    const cleanHeaders = {};
    for (const [key, value] of Object.entries(rawHeaders || {})) {
        if (!key || bannedHeaders.includes(key.toLowerCase())) continue;
        if (typeof value === 'string') {
            cleanHeaders[key.toLowerCase()] = value;
        }
    }
    return cleanHeaders;
}

const server = new ProxyChain.Server({
    port: process.env.PROXY_PRIVATE_PORT || 8080,
    prepareRequestFunction: async ({ request }) => {

        const originalUrl = request.url;
        const destinationUrl = originalUrl.startsWith('http') ? originalUrl : `https://${originalUrl}`;

        const fixedUrl = normalizeUrl(destinationUrl);
        if (!fixedUrl) throw new Error('Invalid URL');

        try {

            console.log(`Using Puppeteer for: ${fixedUrl}`);

            const browser = await puppeteer.launch({
                headless: 'new',
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });

            const page = await browser.newPage();

            const forwardedHeaders = sanitizeHeaders(request.headers);

            await page.setExtraHTTPHeaders({
            ...forwardedHeaders,
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
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

            console.log('Cookies set during navigation:', cookies.length);
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