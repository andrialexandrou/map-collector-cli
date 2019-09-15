const makeRequest = require('../utils/make-request');
const flatten = require('lodash.flatten');
const getBlsCodesPromise = require('../utils/get-bls-codes');

module.exports = {
  recovery: opts => {
    let recoveryCodes
    return getBlsCodesPromise.then(ids => {
      recoveryCodes = ids.recovery;
      /*
      Meat of the module:
      - iterates over each batch of codes
      - takes results, flattens batches in preparation for consuming data
      - sends to <dataNormalize> module to append to existing CSV files
      */
      return Promise.all(recoveryCodes.map(arr => makeRequest(arr, opts))).then(
        flatten
      );
    })
  },
  employment: opts => {
    let employmentCodes
    return getBlsCodesPromise.then(ids => {
      employmentCodes = ids.employment;
      /*
      Meat of the module:
      - iterates over each batch of codes
      - takes results, flattens batches in preparation for consuming data
      - sends to <dataNormalize> module to append to existing CSV files
      */
      return Promise.all(employmentCodes.map(arr => makeRequest(arr, opts))).then(
        flatten
      );
    })
  }
};
