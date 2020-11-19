const bodyParser = require('body-parser');
const express = require('express');
const request = require('request');
const path = require('path');
const Blockchain = require('./blockchain');
const PubSub = require('./app/pubsub');
const TransactionPool = require('./wallet/transaction-pool');
const Wallet = require('./wallet');
const TransactionMiner = require('./app/transaction-miner');

const app = express();
const blockchain = new Blockchain();
const transactionPool = new TransactionPool();
const wallet = new Wallet();
const pubsub = new PubSub({ blockchain, transactionPool, wallet });
const transactionMiner = new TransactionMiner({ blockchain, transactionPool, wallet, pubsub });

const DEFAULT_PORT = 3000;
const ROOT_NODE_ADDRESS = `http://localhost:${DEFAULT_PORT}`;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'client/dist')));

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
            transaction = wallet.createTransaction({ recipient, amount, chain: blockchain.chain });
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

// mines transactions
app.get('/api/mine-transactions', (req, res) => {
    // have this peer mine transactions
    transactionMiner.mineTransactions();
    // redirect to the chain
    res.redirect('/api/blocks');
});

// get wallet info
app.get('/api/wallet-info', (req, res) => {
    const address = wallet.publicKey;

    // return an object with info on the wallet
    res.json({
        address,
        balance: Wallet.calculateBalance({ chain: blockchain.chain, address})
    });
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/dist/index.html'));
});

// syncs this peer with the root node
const syncWithRootState = () => {
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
    });

    
    // call the transaction pool API endpoint
    request({ url: `${ROOT_NODE_ADDRESS}/api/transaction-pool-map` }, (error, response, body) => {
        // if the request was successful
        if(!error && response.statusCode === 200) {
            // the transactionPoolMap that was returned
            const rootTransactionPoolMap = JSON.parse(body);
            // replace the existing transactionPoolMap with the up to date version
            console.log('replace transaction pool map on a sync with', rootTransactionPoolMap);
            transactionPool.setMap(rootTransactionPoolMap);
        }
    })
}

//============================================================
// GENERATE TEST DATA

const walletFoo = new Wallet();
const walletBar = new Wallet();

const generateWalletTransaction = ({ wallet, recipient, amount }) => {
    const transaction = wallet.createTransaction({
        recipient, amount, chain: blockchain.chain
    });

    transactionPool.setTransaction(transaction);
}

const walletAction = () => generateWalletTransaction({
    wallet, recipient: walletFoo.publicKey, amount: 5
});
const walletFooAction = () => generateWalletTransaction({
    wallet: walletFoo, recipient: walletBar.publicKey, amount: 10
});
const walletBarAction = () => generateWalletTransaction({
    wallet: walletBar, recipient: wallet.publicKey, amount: 15
});

for (let i=0; i<10; i++) {
    if (i%3 === 1) {
        walletAction();
        walletFooAction();
    }
    else if (i%3 === 2) {
        walletAction();
        walletBarAction();
    }
    else {
        walletFooAction();
        walletBarAction();
    }

    transactionMiner.mineTransactions()
}

// ============================================================


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
        // get the latest chain by syncing to the root node
        syncWithRootState();
    }
});