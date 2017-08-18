// // const hypercore = require('hypercore');
// const multifeed = require('multifeed');
// const ram = require('random-access-memory');

// describe('hypercore', () => {
//   it('multifeed', () => {
//     var m = multifeed(ram, {sparse: true})

//     m.on('add-feed', function (feed) {
//       console.log('m: added, ' + feed.key.toString('hex'))
//     })

//     m.on('append', function () {
//       // m.update(noop)
//     })


//     m.append({hello: 'world'})

//     m.ready(function () {
//       console.log('ready');
//     });
//   });

//   // it('append', async () => {
//   //   let feed = hypercore('./my-first-dataset', {valueEncoding: 'utf-8'});

//   //   await new Promise(resolve => {
//   //     feed.append('hello');
//   //     feed.append('world', function (err) {
//   //       if (err) throw err;
//   //       feed.get(0, console.log); // prints hello
//   //       feed.get(1, console.log); // prints world

//   //       feed.head(console.log);
//   //       // console.log(feed)
//   //       resolve();
//   //     });
//   //   });
//   // });

//   // it('sync', async () => {
//   //   let feed1 = hypercore(() => ram());
//   //   let feed2 = hypercore(() => ram());

//   //   await new Promise(resolve => {
//   //     let f1rep = feed1.replicate();
//   //     let f2rep = feed2.replicate();

//   //     f1rep.pipe(f2rep).pipe(f1rep);

//   //     feed1.append('hello', () => {
//   //       feed2.append('world', () => {
//   //         console.log('feed1>', feed1.length);
//   //         for (let i = 0; i < feed1.length; i++) {
//   //           feed1.get(i, (err, data) => console.log('feed1', data.toString()));
//   //         }
//   //         console.log('feed2>', feed2.length);
//   //         for (let i = 0; i < feed2.length; i++) {
//   //           feed2.get(i, (err, data) => console.log('feed2', data.toString()));
//   //         }
//   //         resolve();
//   //       });
//   //     });
//   //   });
//   // });
// });
