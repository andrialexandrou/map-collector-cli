/* node */
const fs = require('fs');

/* libraries */
const chunk = require('lodash.chunk');

/* internal documents */
const series = Object.keys(require('../data/series-to-cities-map.json'));

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

const matrixOfSeries = chunk(series, apiMultipleSeriesLimit);
matrixOfSeries.forEach(series => {
  matrixWithJobsPrefix.push(
    series.map(number => applyPrefix(jobsPrefix, number))
  );
  matrixWithRecoveryPrefix.push(
    series.map(number => applyPrefix(recoveryPrefix, number))
  );
});

module.exports = {
  recovery: matrixWithRecoveryPrefix,
  employment: matrixWithJobsPrefix
};
