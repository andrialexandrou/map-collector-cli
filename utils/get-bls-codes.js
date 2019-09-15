/* node */
const fs = require('fs');

/* libraries */
const chunk = require('lodash.chunk');

/* internal documents */
const seriesPromise = require('../data/quick-scripts/get-cities')

/* constants particular to this project */
const jobsPrefix = 'SMU';
const recoveryPrefix = 'SMS';
const apiMultipleSeriesLimit = 50; // maximum value as defined by BLS

/*
Creating the batches of codes (sets of 50 with proper prefixes)
 */
let matrixWithJobsPrefix = [];
let matrixWithRecoveryPrefix = [];

function applyPrefix(prefix, number) {
  if (number.includes('CES')) {
    return `${number}`;
  } else {
    return `${prefix}${number}`;
  }
}

function getIds() {
  return new Promise( resolve => {
    seriesPromise.then(series => {
      const matrixOfSeries = chunk(series, apiMultipleSeriesLimit);
      matrixOfSeries.forEach(series => {
        matrixWithJobsPrefix.push(
          series.map(number => applyPrefix(jobsPrefix, number))
        );
        matrixWithRecoveryPrefix.push(
          series.map(number => applyPrefix(recoveryPrefix, number))
        );
      });
      resolve({
        recovery: matrixWithRecoveryPrefix,
        employment: matrixWithJobsPrefix
      })
    })

  })
}




module.exports = getIds();
