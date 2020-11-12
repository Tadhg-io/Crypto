const Transaction = require('./transaction');
const { STARTING_BALANCE } = require('../config');
const { ec, cryptoHash } = require('../util');

class Wallet{
    constructor() {
        // set the default balance
        this.balance = STARTING_BALANCE;
        // generate te keys
        this.keyPair = ec.genKeyPair();

        this.publicKey = this.keyPair.getPublic().encode('hex');
    }

    sign(data) {
        // sign a hashed version of the data
        return this.keyPair.sign(cryptoHash(data));
    }

    createTransaction({ recipient, amount, chain }) {
        // if a chain was passed in
        if(chain) {
            // set te balance based on the blockchain history
            this.balance = Wallet.calculateBalance({
                chain,
                address: this.publicKey
            });
        }

        // ensure sufficient funds in wallet
        if(amount > this.balance) {
            throw new Error ('Amount exceeds balance')
        }

        // create the transaction
        return new Transaction({ senderWallet: this, recipient, amount});
    }

    // calculates the balance of a wallet
    static calculateBalance({ chain, address }) {
        let hasConductedTransaction = false;
        let outputsTotal = 0;

        // loop through the chain
        for(let i = chain.length - 1; i > 0; i--) {

            // get the current block
            const block = chain[i];

            // for each transaction in this block
            for(let transaction of block.data) {

                // if this wallet has conducted a transaction
                if(transaction.input.address === address) {
                    // set the flag used to break, as we don't need to calculate past this block
                    hasConductedTransaction = true;
                }

                // get the amount sent from this transaction to the given address
                const addressOutput = transaction.outputMap[address];
                // add this amount to our total;
                if(addressOutput) outputsTotal += addressOutput;
            }

            // if we found a transaction made by this in this block, we don't need to consider blocks further up the chain
            if(hasConductedTransaction) break;
        }

        // if this wallet has a transaction in the chain
        return hasConductedTransaction?
            // return the outputs that we have
            outputsTotal :
            // otherwise, we need to include the default balance
            STARTING_BALANCE + outputsTotal;
    }
}

module.exports = Wallet;