const Transaction = require ('./transaction');

class TransactionPool {
    constructor() {
        // create the transactionMap object
        this.transactionMap = {}
    }

    setTransaction(transaction) {
        // set the key of this transaction's ID in the map to the transaction itself
        this.transactionMap[transaction.id] = transaction;
    }
}

module.exports = TransactionPool;