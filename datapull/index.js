const performPullAndDataStore = require('./procedure');

if (process.env.NODE_ENV !== 'test') {
  const argv = require('yargs')
    .usage('Usage: npm run datapull -- --year [num]')
    .option('year', {
      alias: 'y',
      describe: 'pick a year',
      choices: [
        1999,
        2000,
        2001,
        2002,
        2003,
        2004,
        2005,
        2006,
        2007,
        2008,
        2009,
        2010,
        2011,
        2012,
        2013,
        2014,
        2015,
        2016,
        2017,
        2018,
        2019
      ]
    })
    .demandOption(['year'])
    .help().argv;

  performPullAndDataStore(argv);
}
