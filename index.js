const fs = require('fs');
const http = require('http');

const port = +process.argv[2] || 3000;
const client = require('redis').createClient();

const cardsData = fs.readFileSync('./cards.json');
const parsedCards = JSON.parse(cardsData);
const cards = Array(...parsedCards.map(c => Buffer.from(JSON.stringify(c)), "ascii"));

const CARD_ADD_URL = '/card_add?';
const READY_URL = '/ready';
const OK = 200;
const ERROR = 400;
const DONE = Buffer.from('{"id": "ALL CARDS"}', 'ascii');
const READY = Buffer.from('{"ready":true}', 'ascii');

const done = {};

const listener = async function(req, res) {
    if (req.url.startsWith(CARD_ADD_URL)) {
        res.writeHead(OK);
        const key = req.url.substring(CARD_ADD_URL.length);
        if (!done[key]) {
            const index = await client.incr(key) - 1;
            if (index < cards.length) {
                res.end(cards[index]);
                return;
            }
            done[key] = 1;
        }
        res.end(DONE);
        return;
    } else if (req.url === READY_URL) {
        res.writeHead(OK);
        res.end(READY);
        return;
    }
    res.writeHead(ERROR);
    res.end();
}

const server = http.createServer(listener);
client.on('ready', () => {
    server.listen(port, '0.0.0.0', () => {
        console.log(`Example app listening at http://0.0.0.0:${port}`);
    });
});
client.on('error', (err) => console.log('Redis Client Error', err));
client.connect();
