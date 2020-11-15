const Block = require('./block');
const Transaction = require('../wallet/transaction');
const Wallet = require('../wallet');
const { cryptoHash } = require('../util');
const { REWARD_INPUT, MINING_REWARD } = require('../config');

class Blockchain
{
    constructor() {
        this.chain = [Block.genesis()];
    }

    addBlock({data}) {
        const newBlock = Block.mineBlock({
            lastBlock: this.chain[this.chain.length - 1],
            data
        });

        this.chain.push(newBlock);
    }

    replaceChain(chain, validateTransactions, onSuccess) {
        // NOTE: validateTransactions flag should be assumed in a future release
        // if the new chain is not longer
        if(chain.length <= this.chain.length){
            console.error('The incoming chain must be longer.');
            return;
        }

        // if the new chain is not valid 
        if(!Blockchain.isValidChain(chain)){
            console.error('The incoming chain must be valid');
            return;
        }

        if (validateTransactions && !this.validTransactionData({ chain })) {
            console.error('The incoming chain has invalid transaction data');
            return;
        }

        // callback function
        if(onSuccess) onSuccess();

        // replace the chain
        console.log('replacing chain with ', chain);
        this.chain = chain;
    }

    validTransactionData({ chain }) {
        // looop though all blocks in the chain
        for (let i=1; i<chain.length; i++) {
            const block = chain[i];
            const transactionSet = new Set();
            let rewardTransactionCount = 0;

            // looop through all transactions in this block
            for (let transaction of block.data) {
                // if this is a reward transaction
                if (transaction.input.address === REWARD_INPUT.address) {
                    rewardTransactionCount += 1;

                    // if we have nultiple reward transactions in this block
                    if (rewardTransactionCount > 1) {
                        console.error('Miner rewards exceed limit');
                        return false;
                    }

                    // if the amount of this transaction  is not the standard reward 
                    if (Object.values(transaction.outputMap)[0] !== MINING_REWARD) {
                        console.error('Miner reward amount is invalid');
                        return false;
                    }
                }
                // this is not a reward transaction
                else {
                    if (!Transaction.validTransaction(transaction)) {
                        console.error('Invalid Transaction');
                        return false;
                    }

                    // get the true balance of the person who sent this transaction
                    const trueBalance = Wallet.calculateBalance({
                        chain: this.chain,
                        address: transaction.input.address
                    });
                    // if the balance in this transaction doesn't mathc the transaction as per the chain
                    if (transaction.input.amount !== trueBalance) {
                        console.error('Invalid input amount');
                        return false;
                    }

                    // if we saw this transaction before
                    if (transactionSet.has(transaction)) {
                        console.error('Duplicate transaction found on the block');
                        return false;
                    }
                    else {
                        transactionSet.add(transaction);
                    }
                }
            }
        }

        return true;
    }

    static isValidChain(chain) {
        // check that the chain starts with the Genesis Block
        if(JSON.stringify(chain[0]) !== JSON.stringify(Block.genesis())){
            return false;
        }

        for(let i = 1; i < chain.length; i++){
            // extrace values from the current block
            const { timestamp, lastHash, hash, data, nonce, difficulty} = chain[i];
            // what the lastHash should be
            const actualLastHash = chain[i-1].hash;
            // the difficulty of the last block
            const lastDifficulty = chain[i - 1].difficulty;

            // check if the lastHash is correct
            if(lastHash !== actualLastHash){
                return false;
            }

            // generate the hash
            const validatedHash = cryptoHash(timestamp, lastHash, data, nonce, difficulty);
            // check if the hash is correct
            if(hash !== validatedHash){
                return false;
            }

            // check if the difficulty has jumped by more than one
            if(Math.abs(lastDifficulty - difficulty) > 1) return false;
        }

        // the block is valid
        return true;
    }
}

module.exports = Blockchain;