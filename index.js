const bodyParser = require('body-parser');
const express = require('express');
const request = require('request');
const Blockchain = require('./blockchain');
const PubSub = require('./app/pubsub');

const app = express();
const blockchain = new Blockchain();
const pubsub = new PubSub({ blockchain });

const DEFAULT_PORT = 3000;
const ROOT_NODE_ADDRESS = `http://localhost:${DEFAULT_PORT}`;

app.use(bodyParser.json());

// gets the blocks on the chain
app.get('/api/blocks', (req, res) => {
    res.json(blockchain.chain);
});

// mines a new block
app.post('/api/mine', (req, res) => {
    const { data } = req.body;
    blockchain.addBlock({ data });
    pubsub.broadcastChain();
    res.redirect('/api/blocks');
});

const syncChains = () => {
    // call the blocks API endpoint
    request({ url: `${ROOT_NODE_ADDRESS}/api/blocks` }, (error, response, body) => {
        // if the request was successful
        if(!error && response.statusCode === 200) {
            // the chain that was returned
            const rootChain = JSON.parse(body);
            // replace the existing chain with the up to date chain
            console.log('replace chain on a sync with', rootChain);
            blockchain.replaceChain(rootChain);
        }
    })
}

// Dynamic Ports for Dev Testing
let PEER_PORT;
if(process.env.GENERATE_PEER_PORT === 'true') {
    PEER_PORT = DEFAULT_PORT + Math.ceil(Math.random() * 1000);
}

const PORT = PEER_PORT || DEFAULT_PORT;
app.listen(PORT, () => {
    console.log(`listening at localhost:${PORT}`);

    // if this isn't the root node
    if (PORT !== DEFAULT_PORT) {
        // sync to the latest chain
        syncChains();
    }
});