const sqlite3 = require('sqlite3').verbose();

let db = new sqlite3.Database('./data/bls.db', sqlite3.OPEN_READWRITE, err => {
  if (err) console.error(err.message);
});

sqlite3.Database.prototype.runAsync = function (sql, ...params) {
  return new Promise((resolve, reject) => {
      this.run(sql, params, function (err) {
          if (err) return reject(err);
          resolve(this);
      });
  });
};

sqlite3.Database.prototype.runBatchAsync = function (statements) {
  var results = [];
  var batch = [...statements];
  return batch.reduce((chain, statement) => chain.then(result => {
      results.push(result);
      return db.runAsync(...[].concat(statement));
  }), Promise.resolve())
  .then(() => {
    return 'Success'
  })
  .catch(err => {
    console.error(err)
  })
};

module.exports = db