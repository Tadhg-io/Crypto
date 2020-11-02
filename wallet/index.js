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
}

module.exports = Wallet;