import express from 'express';
import bodyParser from 'body-parser';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

const app = express();

app.use(bodyParser.json());

/*
* This is a proxy server that uses Puppeteer to scrape data from the Crexi website.
* It listens for POST requests on the /search endpoint and forwards the request to the Crexi API.
* The response from the API is then returned to the client.
*/
/*
* Este es un servidor proxy que usa Puppeteer para extraer datos del sitio web de Crexi.
* Escucha solicitudes POST en el endpoint /search y reenvía la solicitud a la API de Crexi.
* La respuesta de la API se devuelve luego al cliente.
*/
app.post('/search', async (req, res) => {

    /* Get Original Search Payload */
    /* Obtener el payload de búsqueda original */
    const payload = req.body;

    try {

        /* Launch Puppeteer with stealth plugin and hardened args */
        /* Iniciar Puppeteer con el plugin stealth y argumentos reforzados */
        const browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-gpu',
                '--disable-dev-shm-usage'
            ]
        });

        /* Create New Browser Page */
        /* Crear una nueva página del navegador */
        const page = await browser.newPage();

        /* Sanitize headers from the client request */
        /* Sanitizar los encabezados de la solicitud del cliente */
        const forwardedHeaders = sanitizeHeaders(req.headers);

        /* Set Sanitized Forwarded Headers */
        /* Establecer encabezados sanitizados reenviados */
        await page.setExtraHTTPHeaders({
            ...forwardedHeaders
        });

        /* Set viewport and timezone to mimic a real browser */
        /* Establecer el viewport y la zona horaria para imitar un navegador real */
        await page.setViewport({ width: 1366, height: 768 });
        await page.emulateTimezone('America/New_York');

        /* Visit crexi.com to trigger Cloudflare and obtain necessary cookies */
        /* Visitar crexi.com para activar Cloudflare y obtener las cookies necesarias */
        await page.goto('https://www.crexi.com', { waitUntil: 'networkidle2', timeout: 90000 });

        /* Send POST request to the API from within browser context */
        /* Enviar solicitud POST a la API desde el contexto del navegador */
        const apiResponse = await page.evaluate(async (body) => {
            const res = await fetch('https://api.crexi.com/assets/search', {
                method: 'POST',
                headers: {
                    'accept': 'application/json, text/plain, */*',
                    'content-type': 'application/json',
                    'origin': 'https://www.crexi.com',
                    'referer': 'https://www.crexi.com/'
                },
                body: JSON.stringify(body)
            });
            const json = await res.json();
            return {
                status: res.status,
                body: json
            };
        }, payload);

        /* Close Browser Session */
        /* Cerrar la sesión del navegador */
        await browser.close();

        /* Respond to the client with the API result */
        /* Responder al cliente con el resultado de la API */
        console.log('Closing Browser, Returning API Response');
        res.status(apiResponse.status).json(apiResponse.body);

    } catch (err) {
        /* Handle any runtime errors */
        /* Manejar cualquier error de tiempo de ejecución */
        console.error('Error processing request:', err);
        res.status(500).json({ error: 'Internal server error' });
    }

});

/* Configure the Express server */
/* Configurar el servidor Express */
app.listen(process.env.PROXY_PRIVATE_PORT, () => {
    /* Start the Express server */
    /* Iniciar el servidor Express */
    console.log(`Express server listening on port ${process.env.PROXY_PRIVATE_PORT}`);
});

/* Function To Sanitize Headers */
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