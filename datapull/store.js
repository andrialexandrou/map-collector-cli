const db = require('./db-config');
const originalRecoveryMap = require('../utils/initialRecessionJobsCount');
const { createTransaction } = require('../utils/create-transaction');
const uniq = require('lodash.uniq')

/* Recovery Calculations */
const getRecoveryValue = row => row.value;
const nonexistentRecoveryJobs = []
function calculateRecoveryPercentage(id, current) {
  const lookupId = id.includes('CES') ? id : id.slice(3);
  const original =
    originalRecoveryMap[lookupId] && originalRecoveryMap[lookupId].value;
  if (!original) {
    nonexistentRecoveryJobs.push(lookupId)
    return;
  }
  const calculatedValue = id.includes('CES') // a ternary that can be converted back to an if statement
    ? Number(current) / Number(original)
    : Number(current) / Number(original) - 1;

  return calculatedValue.toFixed(9); // to mimic precision of excel documents
}
/* End Recovery Calculations */

/* Employment Calculations */
const getEmploymentValue = row => {
  if (!row.calculations) {
    return row.value;
  }
  return (
    row.calculations.net_changes[12] ||
    // some values early in the employment dataset do not have the 12
    // therefore we're getting whatever value there *does* exist.
    // TODO discover if this is appropriate, or if this data needs to be ignored
    // or otherwise calculated
    row.calculations.net_changes[6] ||
    row.calculations.net_changes[3] ||
    row.calculations.net_changes[1]
  );
};

function multiply(a, b) {
  const p = 100;
  return Math.round(Number(a) * Number(b) * p) / p;
}
/* End Employment Calculations */

function performTransaction(txt) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.runBatchAsync(txt)
        .then(results => {
          resolve(results);
        })
        .catch(err => {
          reject(err);
        });
    });
  });
}

module.exports = {
  recovery: data => {
    const transformFunction = (val, id) =>
      calculateRecoveryPercentage(id, getRecoveryValue(val));
    const transaction = createTransaction(
      'recovery_data',
      transformFunction,
      data
    );

    console.log('Could not find recovery data for:', '\n', uniq(nonexistentRecoveryJobs).join('\n'))
    return performTransaction(transaction);
  },
  employment: data => {
    const transformFunction = val => multiply(getEmploymentValue(val), 1000);
    const transaction = createTransaction(
      'employment_data',
      transformFunction,
      data
    );
    return performTransaction(transaction);
  }
};

if (process.env.NODE_ENV === 'test') {
  const functions = Object.keys(module.exports);
  functions.forEach(fn => {
    const thisFn = module.exports[fn];
    if (thisFn.test) {
      thisFn.test();
    }
  });
}
