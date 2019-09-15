const retrieve = require('./retrieve-from-bls');
const store = require('./store');

const argv = require('yargs')
  .usage('Usage: $0 --month [string] --year [num]')
  .alias('m', 'month')
  .alias('y', 'year').argv;

Promise.all([
  retrieve.employment(argv),
  retrieve.recovery(argv)
])
  .then(([
    empRes, 
    recRes
  ]) => {
    return Promise.all([
      store.employment(empRes),
      store.recovery(recRes)
    ])
  })
  .then(([
    empRes, 
    recRes
  ]) => {
    console.log('Employment Pull', empRes)
    console.log('Recovery Pull', recRes)
  })
  .catch(err => {
    throw new Error(err);
  });
