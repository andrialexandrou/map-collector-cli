const db = require('./db-config')
const { createTransaction } = require('../utils/scripts')



/* Recovery Calculations */
function calculateRecoveryPercentage(original, current) {
  const calculatedValue = Number(current) / Number(original) - 1;
  return calculatedValue.toFixed(9); // to mimic precision of excel documents
}

function calculateUSARecoveryShare(original, current) {
  const calculatedValue = Number(current) / Number(original);
  return calculatedValue.toFixed(9); // to mimic precision of excel documents
}
/* End Recovery Calculations */


/* Employment Calculations */
function multiply(a, b) {
  const p = 100;
  return Math.round(Number(a) * Number(b) * p) / p;
}
function getEmploymentValue(row) {
  return row.calculations.net_changes[12]
}
/* End Employment Calculations */

module.exports = {
  recovery: (data) => {

  },
  employment: (data) => {
    const transformFunction = val => multiply(getEmploymentValue(val), 1000)
    const transaction = createTransaction('employment_data', transformFunction, data)
    return new Promise( (resolve, reject) => {
      db.serialize(() => {
        db.runBatchAsync(transaction)
        .then(results => {
          resolve(results)
        })
        .catch(err => {
          reject(err)
        })
      });
    })
  }
}

if (process.env.NODE_ENV === 'test') {
  const functions = Object.keys(module.exports);
  functions.forEach(fn => {
    const thisFn = module.exports[fn];
    if (thisFn.test) {
      thisFn.test();
    }
  });
}