const cryptoHash = require('./crypto-hash');

describe('cryptoHash()', () => {
    

    it('generates a SHA-256 hashed output', () => {
        expect(cryptoHash('Johnnie Walker Black'))
            .toEqual('b4f800c5adf8f0aca656ce8d4d8935c9130ad75a30ff095db1966444de581069');
    });

    it('produces the same hash with the same inputs in any order', () => {
        expect(cryptoHash('one', 'two', 'three'))
        .toEqual(cryptoHash('three', 'one', 'two'));
    })

    it('produces a unique hash when the properties have changed on an input', () => {
        const foo = {};
        const originalHash = cryptoHash(foo);
        foo['abc'] = 'xyz';

        expect(cryptoHash(foo)).not.toEqual(originalHash);
    });
});