const { Block } = require('./block');
const assert = require('assert');

class Chain {
  constructor ({ index, hash } = { index: -1, hash: Buffer.alloc(32).toString('hex') }, tip) {
    assert.ok(index || index === 0, 'Chain must define state index');
    assert.ok(hash, 'Chain must define state hash');

    this.index = index;
    this.tipIndex = index;
    this.checkIndex = index;

    this.hash = hash;
    this.tipHash = hash;
    this.checkHash = hash;

    if (tip) {
      this.tip(tip);
    }
  }

  get initialized () {
    return this.index !== -1;
  }

  get valid () {
    let valid = this.checkHash === this.hash;
    if (valid && this.tipHash !== this.hash) {
      this.index = this.checkIndex = this.tipIndex;
      this.hash = this.checkHash = this.tipHash;
    }

    return valid;
  }

  check (block) {
    assert.ok(block instanceof Block, 'Block to check must be instanceof block');

    this.checkIndex = block.index - 1;
    this.checkHash = block.prevHash;

    if (block.index === this.index && block.hash !== this.hash) {
      return this.hash;
    }
  }

  rebase (block) {
    assert.ok(block instanceof Block, 'Rebase block must be instanceof block');
    assert.ok(this.index === block.index && this.hash === block.hash, 'Invalid rebase block');

    this.index = block.index - 1;
    this.hash = block.prevHash;
  }

  tip (tip) {
    assert.ok(tip instanceof Block, 'Tip must be instanceof block');
    assert.ok(this.index <= tip.index, 'Tip is below than index');

    this.tipIndex = tip.index;
    this.tipHash = tip.hash;

    this.check(tip);
  }

  init (data = '') {
    return this.append(data);
  }

  append (data) {
    let block;
    if (data instanceof Block) {
      assert.equal(data.index, this.index + 1, `Invalid index, expected ${this.index + 1} data ${data.index}`);
      assert.equal(data.prevHash, this.hash, `Invalid previous hash, expected ${this.hash} data ${data.prevHash}`);
      block = data;
    } else {
      let index = this.index + 1;
      let prevHash = this.hash;
      block = new Block({ index, prevHash }).update(data);
    }

    this.index = block.index;
    this.hash = block.hash;

    if (this.index > this.tipIndex) {
      this.tip(block);
    }

    return block;
  }
}

module.exports = { Chain };
