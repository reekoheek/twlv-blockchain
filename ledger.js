const { Block } = require('./block');
const { Stream } = require('./stream');
const { Message } = require('./message');
const { Chain } = require('./chain');
const { Logger } = require('twlv-logger');
const Memory = require('twlv-storage-memory');
const LRU = require('lru');
const assert = require('assert');

let ID = 0;

class Ledger {
  constructor ({ storage = new Memory() } = {}) {
    this.id = ID++;
    this._streams = [];
    this.storage = storage;
    this.cache = new LRU(25);
    this.logger = new Logger('twlv-blockchain:ledger', this.id);
    this.chain = undefined;
    this.forks = [];
  }

  get hash () {
    return this.chain.hash;
  }

  get index () {
    return this.chain.index;
  }

  async init () {
    let state = await this.storage.read('state');
    this.chain = new Chain(state);
    if (!this.chain.initialized) {
      let block = this.chain.init();
      this._saveBlock(block.hash, block);
      this.storage.write('state', { index: this.index, hash: this.hash });
    }
  }

  append (data) {
    let block = this.chain.append(data);
    this._saveBlock(block.hash, block);

    this._broadcast(new Message(Message.HEAD, block));

    return block;
  }

  sync () {
    this._broadcast(new Message(Message.GETHEAD));
  }

  async get (hash) {
    hash = hash || this.chain.hash;

    let block = this.cache.get(hash);
    if (!block) {
      block = await this.storage.read(hash);
      if (block) {
        this.cache.set(hash, block);
      }
    }

    if (block) {
      return new Block(block);
    }
  }

  _saveBlock (hash, block) {
    assert.ok(hash, 'Save block must define hash as key');
    assert.ok(block, 'Save block must define block as value');

    this.cache.set(hash, block);
    this.storage.write(hash, block);
  }

  _broadcast (message) {
    assert.ok(message instanceof Message, 'Cannot send non message');

    this._streams.forEach(stream => stream.push(message));
  }

  _send (stream, message) {
    assert.ok(stream instanceof Stream, 'Cannot send to non stream');
    assert.ok(message instanceof Message, 'Cannot send non message');

    stream.push(message);
  }

  createStream () {
    let stream = new Stream();

    stream.on('close', () => {
      console.log(`Stream ${stream.id} closed...`);
    });

    stream.on('message', this._processMessage.bind(this));

    this._streams.push(stream);

    return stream;
  }

  _processMessage ({ stream, message }) {
    let { command, payload } = message;

    this.logger.log('IN %s %o %o', stream.id, command, payload);

    switch (command) {
      case Message.HEAD:
        this._processHead({ stream, payload });
        break;
      case Message.GETHEAD:
        this._processGetHead({ stream, payload });
        break;
      case Message.BLOCK:
        this._processBlock({ stream, payload });
        break;
      case Message.GETBLOCK:
        this._processGetBlock({ stream, payload });
        break;
      default:
        console.error(`Unknown message`, message);
        break;
    }
  }

  async _processGetBlock ({ stream, payload }) {
    let block = await this.get(payload);
    if (block) {
      this._send(stream, new Message(Message.BLOCK, block));
    }
  }

  _processBlock ({ stream, payload }) {
    let block = new Block(payload);

    this._saveBlock(block.hash, block);

    for (let fork of this.forks) {
      if (block.hash === fork.checkHash) {
        this._validateFork(fork);
        break;
      }
    }
  }

  _processHead ({ stream, payload }) {
    if (payload.index <= this.chain.index) {
      return;
    }

    let block = new Block(payload);
    try {
      this.append(block);
      return;
    } catch (err) {
      console.error(`Cannot append head, forking...\nCause: ${err.message}`);
    }

    this._saveBlock(block.hash, block);
    let fork = this.fork(block);
    this._validateFork(fork, stream);
  }

  async _validateFork (fork, stream) {
    if (fork.valid) {
      return true;
    }

    let block;
    while (!fork.valid && (block = await this.get(fork.checkHash))) {
      let stale = fork.check(block);
      if (stale) {
        fork.rebase(await this.get(stale));
      }
    }

    if (fork.valid) {
      let forkIndex = this.forks.indexOf(fork);
      if (forkIndex !== -1) {
        this.forks.splice(forkIndex, 1);
      }

      if (fork.index > this.chain.index) {
        this.chain = fork;
      }
    } else {
      let message = new Message(Message.GETBLOCK, fork.checkHash);
      if (stream) {
        this._send(stream, message);
      } else {
        this._broadcast(message);
      }
    }

    return fork.valid;
  }

  fork (block) {
    if (this.forks.find(chain => chain.tipIndex === block.index && chain.tipHash === block.hash)) {
      return;
    }

    let fork = new Chain(this.chain, block);
    this.forks.push(fork);

    return fork;
  }

  async _processGetHead ({ stream, payload }) {
    let block = await this.get();
    this._send(stream, new Message(Message.HEAD, block));
  }
}

module.exports = { Ledger };
