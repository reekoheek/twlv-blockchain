const assert = require('assert');

class Message {
  static get BLOCK () { return 'block'; }
  static get GETBLOCK () { return 'getblock'; }
  static get BLOCKS () { return 'blocks'; }
  static get GETBLOCKS () { return 'getblocks'; }
  static get HEAD () { return 'head'; }
  static get GETHEAD () { return 'gethead'; }

  constructor (command, payload) {
    assert.ok(command, 'Message must define command');

    this.command = command;
    this.payload = payload;
  }
}

module.exports = { Message };
