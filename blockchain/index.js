const Block = require('./block');
const cryptoHash = require('../util/crypto-hash');

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

    replaceChain(chain) {
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

        // replace the chain
        console.log('replacing chain with ', chain);
        this.chain = chain;
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