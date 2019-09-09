const sqlite3 = require('sqlite3').verbose();

let db = new sqlite3.Database('./data/bls.sql', sqlite3.OPEN_READWRITE, err => {
  if (err) console.error(err.message);
});

const citiesInsertScript = require('./migrations/cities').insert();
db.serialize(() => {
  db.run(citiesInsertScript, (err, row) => {
    if (err) {
      console.error(err.message);
    }
  });
});

db.close(err => {
  if (err) console.error(err.message);
});
