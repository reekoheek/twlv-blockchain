const assert = require('assert');
const { Ledger } = require('../ledger');
const logger = require('twlv-logger')('twlv-blockchain:test:ledger');

describe('Ledger', () => {
  it('#append()', async () => {
    let ledger = new Ledger();
    await ledger.init();

    let block1 = ledger.append('foo');
    let block2 = ledger.append('bar');

    let block = await ledger.get(block1.hash);
    assert.ok(block.index, 1);
    assert.ok(block.data.toString(), 'foo');
    assert.ok((await ledger.get(block2.hash)).data.toString(), 'bar');
  });

  it('#createStream()', async () => {
    let ledger = new Ledger();
    await ledger.init();

    let rstream = ledger.createStream();

    await new Promise(resolve => {
      rstream.on('data', resolve);
      ledger.append('foo');
    });
  });
});

describe('Cases', () => {
  it('propagate new block', async () => {
    let ledger1 = new Ledger();
    let ledger2 = new Ledger();

    await ledger1.init();
    await ledger2.init();

    let stream1 = ledger1.createStream();
    let stream2 = ledger2.createStream();

    stream1.pipe(stream2).pipe(stream1);

    ledger1.append('foo');

    await new Promise(resolve => setTimeout(resolve));

    assert.equal(ledger2.hash, ledger1.hash);
  });

  it('bootstrap blocks on join', async () => {
    let ledger1 = new Ledger();
    let ledger2 = new Ledger();
    let ledger3 = new Ledger();

    await ledger1.init();
    await ledger2.init();
    await ledger3.init();

    ledger2.append('foo');
    ledger2.append('bar');
    ledger3.append('foo3');
    ledger3.append('bar3');
    ledger3.append('baz3');

    let stream12 = ledger1.createStream();
    let stream13 = ledger1.createStream();
    let stream2 = ledger2.createStream();
    let stream3 = ledger3.createStream();

    stream12.pipe(stream2).pipe(stream12);
    stream13.pipe(stream3).pipe(stream13);

    ledger1.sync();

    await new Promise(resolve => setTimeout(resolve));

    assert.equal(ledger1.hash, ledger3.hash);
  }).timeout(10000);

  it('sync to longest', async () => {
    let ledger1 = new Ledger();
    let ledger2 = new Ledger();
    let ledger3 = new Ledger();

    await ledger1.init();
    await ledger2.init();
    await ledger3.init();

    ledger2.append('foo2');
    ledger2.append('bar2');

    let stream12 = ledger1.createStream();
    let stream21 = ledger2.createStream();

    stream12.pipe(stream21).pipe(stream12);

    ledger1.sync();

    let stream13 = ledger1.createStream();
    let stream31 = ledger3.createStream();

    stream13.pipe(stream31).pipe(stream13);

    ledger3.append('foo3');
    ledger3.append('bar3');

    ledger2.append('baz2');

    await new Promise(resolve => setTimeout(resolve));

    assert.equal(ledger1.hash, ledger2.hash);
    assert.notEqual(ledger1.hash, ledger3.hash);

    ledger3.append('baz3');
    ledger3.append('xyz3');

    await new Promise(resolve => setTimeout(resolve));

    assert.equal(ledger1.hash, ledger3.hash);
    assert.notEqual(ledger1.hash, ledger2.hash);
  }).timeout(10000);

  before(() => process.on('unhandledRejection', err => console.error('unhandled', err)));
  after(() => process.removeAllListeners('unhandledRejection'));
});
