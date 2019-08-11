const retrieve = require('./retrieve-from-bls');
const store = require('./store');

const argv = require('yargs')
  .usage('Usage: $0 --month [string] --year [num]')
  .demandOption(['m', 'y'])
  .alias('m', 'month')
  .alias('y', 'year').argv;

Promise.all([retrieve.employment(argv), retrieve.recovery(argv)])
  .then(([empRes, recRes]) => {
    console.log('empRes', empRes);
    store.employment(empRes);
    store.recovery(recRes);
  })
  .catch(err => {
    throw new Error(err);
  });
