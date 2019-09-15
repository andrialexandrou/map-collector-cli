const retrieve = require('./retrieve-from-bls');
const store = require('./store');

const argv = require('yargs')
  .usage('Usage: $0 --month [string] --year [num]')
  // .demandOption(['m', 'y'])
  .alias('m', 'month')
  .alias('y', 'year').argv;

Promise.all([retrieve.employment(argv)/*, retrieve.recovery(argv)*/])
  .then(([empRes, recRes]) => {
    // store.recovery(recRes);
    return Promise.all([store.employment(empRes), /* store.recovery(recRes) */])
  })
  .then(([empRes, /* recRes */]) => {
    console.log('empRes', empRes)
  })
  .catch(err => {
    throw new Error(err);
  });
