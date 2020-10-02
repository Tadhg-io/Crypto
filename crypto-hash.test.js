const cryptoHash = require('./crypto-hash');

describe('cryptoHash()', () => {
    

    it('generates a SHA-256 hashed output', () => {
        expect(cryptoHash('Johnnie Walker Black'))
            .toEqual('01d5cbac8bdc70909412992a2e44f333e0f3c9e79997c845daab1ca60c25d252');
    });

    it('produces the same hash with the same inputs in any order', () => {
        expect(cryptoHash('one', 'two', 'three'))
        .toEqual(cryptoHash('three', 'one', 'two'));
    })
});