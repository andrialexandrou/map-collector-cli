const sqlite3 = require('sqlite3').verbose();

let db = new sqlite3.Database('./data/bls.db', sqlite3.OPEN_READWRITE, err => {
  if (err) console.error(err.message);
});

module.exports = new Promise( (resolve, reject) => {
  db.serialize(() => {
    db.all('SELECT * FROM cities', (err, rows) => {
      if (err) reject(err)
      const onlyIds = rows.map( row => row.id )
      resolve(onlyIds)
    });
  });
  
  db.close(err => {
    if (err) console.error(err.message);
  });
})