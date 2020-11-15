const PubNub = require('pubnub');
const { __esModule } = require('pubnub/lib/networking/modules/web-node');

const credentials = {
    "publishKey": "pub-c-3693d837-270f-4f0d-8a00-fe87cfd39523",
    "subscribeKey": "sub-c-d0fc8d94-118f-11eb-bc34-ce6fd967af95",
    "secretKey": "sec-c-NWVlYjVkYTgtYjQ0MC00MmY1LWJkN2EtYWQ4MDkzMzJiZTQ0"
}

const CHANNELS = {
    TEST: 'TEST',
    BLOCKCHAIN: 'BLOCKCHAIN',
    TRANSACTION: 'TRANSACTION' 
}

class PubSub {
    constructor({ blockchain, transactionPool, wallet }) {
        this.pubnub = new PubNub(credentials);

        this.blockchain = blockchain;
        this.transactionPool = transactionPool;
        this.wallet = wallet;
    
        // subscribe to all channels
        this.pubnub.subscribe({ channels: Object.values(CHANNELS) });
    
        this.pubnub.addListener(this.listener());
    }

    // listen for messages
    listener() {
        return {
            message: MessageObject => {
                const { channel, message } = MessageObject;

                console.log(`Message received. Channel: ${channel}. Message: ${message}`)

                // get the message received
                const parsedMessage = JSON.parse(message);

                switch(channel) {
                    // if a new chain was broadcast
                    case CHANNELS.BLOCKCHAIN:
                        // replace our chain with the new chain
                        this.blockchain.replaceChain(parsedMessage, true, () => {
                            // remove our copy of any transaction that is part of the new chain
                            this.transactionPool.clearBlockchainTransactions({ chain: parsedMessage });
                        });
                        break;
                    // if a new transaction was broadcast
                    case CHANNELS.TRANSACTION:
                        // if this transaction doesn't currently exist
                        if (!this.transactionPool.existingTransaction({
                            inputAddress: this.wallet.publicKey
                          })) {
                            // publish the transaction
                            this.transactionPool.setTransaction(parsedMessage);
                          }
                        break;
                    default:
                        break;
                }
            }
        }
    }

    // publishes a message to a specific channel
    publish({ channel, message }) {
        this.pubnub.publish({channel, message}); 
    }

    broadcastChain() {
        this.publish({
            channel: CHANNELS.BLOCKCHAIN,
            message: JSON.stringify(this.blockchain.chain)
        });
    }

    broadcastTransaction(transaction) {
        this.publish({
            channel: CHANNELS.TRANSACTION,
            message: JSON.stringify(transaction)
        });
    }
}

module.exports = PubSub;