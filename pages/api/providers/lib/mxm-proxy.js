// Not used by the next server, but can be run separately with Node.js to proxy requests to Musixmatch

const http = require('http');
const httpProxy = require('http-proxy');

const TARGET_HOST = 'https://www.musixmatch.com';

const PORT = 3000;

const proxy = httpProxy.createProxyServer({});

const server = http.createServer((req, res) => {
    console.log(`🔵 Proxying request to: ${TARGET_HOST}${req.url}`);
    proxy.web(req, res, { target: TARGET_HOST, changeOrigin: true }, (err) => {
        res.writeHead(502, { 'Content-Type': 'text/plain' });
        console.error('🔴 Proxy error:', err);
        res.end('Proxy error.');
    });
});

server.listen(PORT, () => {
    console.log(`🟢 Proxy server running on port ${PORT}`);
});