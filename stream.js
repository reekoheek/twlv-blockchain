const { Transform } = require('stream');

let ID = 0;

class Stream extends Transform {
  constructor () {
    super({ objectMode: true });

    this.id = ID++;
  }

  _transform (message, encoding, callback) {
    this.emit('message', { stream: this, message });
    callback();
  }
}

module.exports = { Stream };
