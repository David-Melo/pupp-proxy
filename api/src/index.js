import ProxyChain from 'proxy-chain';
import puppeteer from 'puppeteer';

const server = new ProxyChain.Server({
    port: process.env.PROXY_PRIVATE_PORT || 8080,
    prepareRequestFunction: async ({ request }) => {

        const url = request.url;

        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'networkidle0' });
        const html = await page.content();
        await browser.close();

        return {
            response: {
                statusCode: 200,
                body: html,
                headers: {
                    'Content-Type': 'text/html'
                }
            }
        };

    }
});

server.listen(() => {
    console.log(`Proxy server is listening on port ${process.env.PROXY_PRIVATE_PORT}`);
});