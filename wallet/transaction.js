const uuid = require('uuid/v1');
const { verifySignature } = require('../util');
const { verifySignatue } = require('../util');

class Transaction {

    constructor({ senderWallet, recipient, amount }) {
        // generate an id
        this.id = uuid();
        // create an outputMap
        this.outputMap = this.createOutputMap({ senderWallet, recipient, amount });
        // create an input
        this.input = this.createInput({ senderWallet, outputMap: this.outputMap });
    }

    createOutputMap({ senderWallet, recipient, amount }) {
        const outputMap = {};

        // specify the amount going to the recipient
        outputMap[recipient] = amount;
        // specfy the sender's adjusted balance
        outputMap[senderWallet.publicKey] = senderWallet.balance - amount;

        return outputMap;
    }

    createInput({ senderWallet, outputMap }) {
        return {
            // a timestamp for the creation of this transaction
            timestamp: Date.now(),
            // the sender's balance
            amount: senderWallet.balance,
            // set the address to the sender's public key
            address: senderWallet.publicKey,
            // have th sender sign the this input
            signature: senderWallet.sign(outputMap)
        };
    }

    update( { senderWallet, recipient, amount } ) {
        // check for sufficient funds
        if (amount > this.outputMap[senderWallet.publicKey]) {
            throw new Error('Amount exceeds balance');
        }

        // if this recipient is already on this transaction
        if (this.outputMap[recipient]) {
            // increment the amount sent to this recipient
            this.outputMap[recipient] = this.outputMap[recipient] + amount;
        } else {
            // otherwise, set the amount sent to this recipient
            this.outputMap[recipient] = amount;
        }

        // subtract the amount from the original sent amount
        this.outputMap[senderWallet.publicKey] -= amount;
        // sign the transaction again
        this.input = this.createInput({ senderWallet, outputMap: this.outputMap });
    }

    static validTransaction(transaction) {
        const { input: { address, amount, signature },  outputMap } = transaction;

        const outputTotal = Object.values(outputMap).reduce((total, outputAmount) => total + outputAmount);

        // if the outputMap is invalid
        if (amount !== outputTotal) {
            console.error(`Invalid transaction from ${address}`);
            return false;
        }

        // if the signature is invalid
        if (!verifySignature({ publicKey: address, data: outputMap, signature })) {
            console.error(`Invalid signature from ${address}`);
            return false;
        }

        // this transaction is valid
        return true;
    }
}

module.exports = Transaction;