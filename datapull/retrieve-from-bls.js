const makeRequest = require('../utils/make-request');
const flatten = require('lodash.flatten');
const getBlsCodesPromise = require('../utils/get-bls-codes');
const remove = require('lodash.remove')

function isRelevant(pullname) {
  if (pullname === 'employment') {
    return obj => parseInt(obj.year, 10) >= 1999
  }
  if (pullname === 'recovery') {
    const first = 'Dec-07'
    return function (obj) {
      return parseInt(obj.year, 10) === 2007 ?
        obj.period === 'M12' :
        parseInt(obj.year, 10) >= 2008;
    }
  }
}
isRelevant.test = function() {
  console.assert(isRelevant('employment')({year: '1998', period: 'M01'}) === false, 'M01 1998 should be irrelevant')
  console.assert(isRelevant('employment')({year: '1998', period: 'M12'}) === false, 'M12 1998 should be irrelevant')
  console.assert(isRelevant('employment')({year: '1999', period: 'M01'}) === true, 'M01 1999 should be relevant')
  console.assert(isRelevant('employment')({year: '1999', period: 'M12'}) === true, 'M12 1999 should be relevant')

  console.assert(isRelevant('recovery')({year: '2007', period: 'M11'}) === false, 'M11 2007 should be irrelevant')
  console.assert(isRelevant('recovery')({year: '2007', period: 'M12'}) === true, 'M12 2007 should be relevant')
  console.assert(isRelevant('recovery')({year: '2008', period: 'M05'}) === true, 'M05 2008 should be relevant')
  console.assert(isRelevant('recovery')({year: '2017', period: 'M06'}) === true, 'M06 2017 should be relevant')
}

module.exports = {
  isRelevant,
  recovery: opts => {
    let recoveryCodes;
    return getBlsCodesPromise
      .then(ids => {
        recoveryCodes = ids.recovery;
        /*
      Meat of the module:
      - iterates over each batch of codes
      - takes results, flattens batches in preparation for consuming data
      - sends to <dataNormalize> module to append to existing CSV files
      */
        return Promise.all(recoveryCodes.map(arr => makeRequest(arr, opts)));
      })
      .then(flatten)
      .then(arr => arr.filter(isRelevant('recovery')))
      .catch(err => {
        throw new Error(err);
      });
  },
  employment: opts => {
    let employmentCodes;
    return getBlsCodesPromise
      .then(ids => {
        employmentCodes = ids.employment;
        /*
      Meat of the module:
      - iterates over each batch of codes
      - takes results, flattens batches in preparation for consuming data
      - sends to <dataNormalize> module to append to existing CSV files
      */
        return Promise.all(employmentCodes.map(arr => makeRequest(arr, opts)));
      })
      .then(flatten)
      .then(arr => arr.filter(isRelevant('employment')))
      .catch(err => {
        throw new Error(err);
      });
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
