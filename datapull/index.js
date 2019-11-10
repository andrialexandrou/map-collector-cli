const performPullAndDataStore = require('./procedure');

if (process.env.NODE_ENV !== 'test') {
  const argv = require('yargs')
    .usage('Usage: npm run datapull -- --year [num]')
    .option('year', {
      alias: 'y',
      describe: 'pick a year',
      choices: [2017, 2018, 2019]
    })
    .demandOption(['year'])
    .help().argv;

  performPullAndDataStore(argv);
}
