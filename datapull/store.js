const db = require('./db-config')
const originalRecoveryMap = require('../utils/initialRecessionJobsCount')
const { createTransaction } = require('../utils/create-transaction')

/* Recovery Calculations */
const getRecoveryValue = row => row.value

function calculateRecoveryPercentage(id, current) {
  const lookupId = id.includes('CES') ? id : id.slice(3)
  const original = originalRecoveryMap[lookupId] && originalRecoveryMap[lookupId].value
  const calculatedValue = id.includes('CES') ? // a ternary that can be converted back to an if statement
    Number(current) / Number(original):
    Number(current) / Number(original) - 1;

  return calculatedValue.toFixed(9); // to mimic precision of excel documents
}
/* End Recovery Calculations */

/* Employment Calculations */
const getEmploymentValue = row => {
  if (!row.calculations) {
    return row.value
  }
  return row.calculations.net_changes[12]
}

function multiply(a, b) {
  const p = 100;
  return Math.round(Number(a) * Number(b) * p) / p;
}
/* End Employment Calculations */

function performTransaction(txt) {
  return new Promise( (resolve, reject) => {
    db.serialize(() => {
      db.runBatchAsync(txt)
      .then(results => {
        resolve(results)
      })
      .catch(err => {
        reject(err)
      })
    });
  })
}

module.exports = {
  recovery: (data) => {
    const transformFunction = (val, id) => calculateRecoveryPercentage(id, getRecoveryValue(val))
    const transaction = createTransaction('recovery_data', transformFunction, data)
    return performTransaction(transaction)
  },
  employment: (data) => {
    const transformFunction = val => multiply(getEmploymentValue(val), 1000)
    const transaction = createTransaction('employment_data', transformFunction, data)
    return performTransaction(transaction)
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