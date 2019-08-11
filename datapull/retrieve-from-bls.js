const makeRequest = require('../utils/make-request');
const flatten = require('lodash.flatten');
const getBlsCodes = require('../utils/get-bls-codes');

module.exports = {
  recovery: opts => {
    const recoveryCodes = getBlsCodes.recovery;
    /*
    Meat of the module:
    - iterates over each batch of codes
    - takes results, flattens batches in preparation for consuming data
    - sends to <dataNormalize> module to append to existing CSV files
    */
    return Promise.all(recoveryCodes.map(arr => makeRequest(arr, opts))).then(
      flatten
    );
  },
  employment: opts => {
    const employmentCodes = getBlsCodes.employment;
    /*
    Meat of the module:
    - iterates over each batch of codes
    - takes results, flattens batches in preparation for consuming data
    - sends to <dataNormalize> module to append to existing CSV files
    */
    return Promise.all(employmentCodes.map(arr => makeRequest(arr, opts))).then(
      flatten
    );
  }
};
