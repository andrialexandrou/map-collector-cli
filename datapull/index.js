const retrieve = require('./retrieve-from-bls');
const store = require('./store');

const argv = require('yargs')
  .usage('Usage: $0 --month [string] --year [num]')
  .alias('m', 'month')
  .alias('y', 'year').argv;

// Promise.resolve()
retrieve.employment(argv)
  .then(store.employment)
  .then(res => {
    console.log('Completing Employment Pull')
    console.log(res)
  })
  .then( () => retrieve.recovery(argv))
  .then(store.recovery)
  .then(res => {
    console.log('Completing Recovery Pull')
    console.log(res)
  })
  .catch( err => {
    console.log('Catch from Employment or Recovery Pull')
    throw new Error(err)
  })
