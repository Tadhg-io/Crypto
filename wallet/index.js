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

    createTransaction({ recipient, amount }) {
        // ensure sufficient funds in wallet
        if(amount > this.balance) {
            throw new Error ('Amount exceeds balance')
        }

        // create the transaction
        return new Transaction({ senderWallet: this, recipient, amount});
    }

    // calculates the balance of a wallet
    static calculateBalance({ chain, address }) {
        let outputsTotal = 0;
        // loop through the chain
        for(let i = 1; i < chain.length; i++) {
            // get the current block
            const block = chain[i];
            // for each transaction in this block
            for(let transaction of block.data) {
                // get the amount sent from this transaction to the given address
                const addressOutput = transaction.outputMap[address];
                // add this amount to our total;
                if(addressOutput) outputsTotal += addressOutput;
            }
        }

        // return the starting balance plus the amounts received
        return STARTING_BALANCE + outputsTotal;
    }
}

module.exports = Wallet;