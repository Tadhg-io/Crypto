const EC = require('elliptic').ec;
const cryptoHash = require('./crypto-hash');

const ec = new EC('secp256k1');

const verifySignature = ({ publicKey, data, signature }) => {
    // generate a key object from the public key
    const keyFromPublic = ec.keyFromPublic(publicKey, 'hex');
    // verify the signature
    return keyFromPublic.verify(cryptoHash(data), signature);
};

module.exports = { ec, verifySignature, cryptoHash };