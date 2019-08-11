const axios = require('axios');
const ApiKeyHandler = require('./get-api-key');
const apiKeyHandler = new ApiKeyHandler();
const url = 'https://api.bls.gov/publicAPI/v2/timeseries/data/';

const getYear = arg => (arg.length === 2 ? `20${arg}` : arg);
const getMonth = function(arg) {
  const months = {
    1: ['jan', 'january'],
    2: ['feb', 'february'],
    3: ['mar', 'march'],
    4: ['apr', 'april'],
    5: ['may', 'may'],
    6: ['jun', 'june'],
    7: ['jul', 'july'],
    8: ['aug', 'august'],
    9: ['sep', 'september'],
    10: ['oct', 'october'],
    11: ['nov', 'november'],
    12: ['dec', 'december']
  };
  const key = Object.keys(months).find(key => {
    return months[key].includes(arg);
  });
  return months[key][1];
};

let thisRequest;

/* API Requests */
function handleResponse(response) {
  if (response.data.status === 'REQUEST_NOT_PROCESSED') {
    apiKeyHandler.expire();
    makeRequest(...thisRequest);
    return;
  } else if (response.status === 200) {
    thisRequest = null;
    return response.data.Results.series;
  } else {
    throw new Error('Unhandled response from BLS', response.data);
  }
}

function makeRequest(seriesArray, opts) {
  thisRequest = Array.from(arguments);

  const year = getYear(opts.year.toString());
  const prevYear = getYear((opts.year - 1).toString());

  return axios
    .post(url, {
      seriesid: seriesArray,
      registrationkey: apiKeyHandler.get(),
      startyear: prevYear,
      endyear: year,
      annualaverage: true,
      calculations: true
    })
    .then(handleResponse);
}

module.exports = makeRequest;
