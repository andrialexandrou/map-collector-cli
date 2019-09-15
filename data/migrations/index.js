const sqlite3 = require('sqlite3').verbose();

let db = new sqlite3.Database('./data/bls.db', sqlite3.OPEN_READWRITE, err => {
  if (err) console.error(err.message);
});

const citiesInsertSeed = require('./cities').seed();
const initialJobsSeed = require('./initial-jobs').seed();
const employmentMigration = require('./employment').migrateFromCSV();
const recoveryMigration = require('./recovery').migrateFromCSV()
db.serialize(() => {
  db.run('', (err, row) => {
    if (err) console.error(err.message);
  });
});

db.close(err => {
  if (err) console.error(err.message);
});
