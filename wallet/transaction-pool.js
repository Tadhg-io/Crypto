const Transaction = require ('./transaction');

class TransactionPool {
    constructor() {
        // create the transactionMap object
        this.transactionMap = {}
    }

    // clears the transactions from this pool
    clear() {
        this.transactionMap = {};
    }

    setTransaction(transaction) {
        // set the key of this transaction's ID in the map to the transaction itself
        this.transactionMap[transaction.id] = transaction;
    }

    setMap(transactionMap) {
        this.transactionMap = transactionMap;
    }

    // gets an existing transaction from this Pool
    existingTransaction({ inputAddress }) {
        // get the input parameters
        const transactions = Object.values(this.transactionMap);
        // find the transaction
        return transactions.find(transaction => transaction.input.address === inputAddress);
    }

    // returns all valid transactions from this transaction pool
    validTransactions() {
        return Object.values(this.transactionMap).filter(
            transaction => Transaction.validTransaction(transaction)
        );
    }

    // clears a specific chain of transactions from the transaction pool
    clearBlockchainTransactions({ chain }) {
        // loop through all blocks in the chain
        for(let i = 1; i < chain.length; i++) {
            // get the current block
            const block = chain[i];
            // for each transaction in this block
            for(let transaction of block.data) {
                // if the transaction is in this pool's transactionMap
                if(this.transactionMap[transaction.id]) {
                    // delete this transaction from the transactionMap
                    delete this.transactionMap[transaction.id];
                }
            }
        }
    }

}

module.exports = TransactionPool;