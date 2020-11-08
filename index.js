const bodyParser = require('body-parser');
const express = require('express');
const request = require('request');
const Blockchain = require('./blockchain');
const PubSub = require('./app/pubsub');
const TransactionPool = require('./wallet/transaction-pool');
const Wallet = require('./wallet');

const app = express();
const blockchain = new Blockchain();
const transactionPool = new TransactionPool();
const wallet = new Wallet();
const pubsub = new PubSub({ blockchain, transactionPool });

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

// makes a transaction
app.post('/api/transact', (req, res) => {
    // get the parameters
    const { amount, recipient } = req.body;

    // get an existing transaction for this recipient in the Pool
    let transaction = transactionPool.existingTransaction({ inputAddress: wallet.publicKey });

    try {
        // if the transaction already exists
        if(transaction) {
            // update the existing transaction
            transaction.update({ senderWallet: wallet, recipient, amount });
        }
        else {
            // create the transaction
            transaction = wallet.createTransaction({ recipient, amount });
        }
        
    }
    catch(error) {
        return res.status(400).json({ type: 'error', message: error.message });
    }

    // add this to the local transaction pool
    transactionPool.setTransaction(transaction);

    // broadcast the transaction
    pubsub.broadcastTransaction(transaction);

    // respond with the transaction
    res.json({ type: 'success', transaction});
});

// gets the transaction pool
app.get('/api/transaction-pool-map', (req, res) => {
    res.json(transactionPool.transactionMap);
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