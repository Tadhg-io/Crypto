const { STARTING_BALANCE } = require('../config');
const { ec } = require('../util');
const cryptoHash = require('../util/crypto-hash');

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
}

module.exports = Wallet;