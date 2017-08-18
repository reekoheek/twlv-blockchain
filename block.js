const assert = require('assert');
const sha3256 = require('js-sha3').sha3_256;

class Block {
  constructor ({ index, prevHash, hash, data }) {
    assert.ok(typeof index === 'number', 'Block must define index as number');
    assert.ok(prevHash, 'Block must define prev hash');
    if (data && !hash) {
      throw new Error('Block must define pair of data and hash');
    }

    this.index = index;
    this.prevHash = prevHash;
    if (!data) {
      return;
    }
    this.data = Buffer.from(data);
    this.hash = hash;
  }

  update (data) {
    this.data = Buffer.from(data);
    this.hash = this.generateHash();

    return this;
  }

  generateHash () {
    return sha3256(`${this.index}${this.prevHash}${this.data.toString('hex')}`);
  }
}

module.exports = { Block };
