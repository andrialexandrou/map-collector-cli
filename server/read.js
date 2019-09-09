module.exports = {
  recovery,
  employment
};

const sqlite3 = require('sqlite3').verbose();

let db = new sqlite3.Database('./bls.db', sqlite3.OPEN_READWRITE, err => {
  if (err) console.error(err.message);
});

db.serialize(() => {
  db.run('', (err, row) => {
    if (err) {
      console.error(err.message);
    }
  });
});

db.close(err => {
  if (err) console.error(err.message);
});
