const flatten = require('lodash.flatten');
const isEqual = require('lodash.isequal');
const originalRecoveryMap = require('./initialRecessionJobsCount')

module.exports = {
    getPeriodName,
    createBigInsert,
    createTransaction
}

/* Recovery Calculations */
const getRecoveryValue = row => row.value

function calculateRecoveryPercentage(id, current) {
  const lookupId = id.includes('CES') ? id : id.slice(3)
  const original = originalRecoveryMap[lookupId] && originalRecoveryMap[lookupId].value
  if (!original) return;

  const calculatedValue = id.includes('CES') ? // a ternary that can be converted back to an if statement
    Number(current) / Number(original):
    Number(current) / Number(original) - 1;

  return calculatedValue.toFixed(9); // to mimic precision of excel documents
}
/* End Recovery Calculations */

/* Employment Calculations */
const getEmploymentValue = row => row.calculations.net_changes[12]

function multiply(a, b) {
  const p = 100;
  return Math.round(Number(a) * Number(b) * p) / p;
}
/* End Employment Calculations */

const months = {
  'January': '0',
  'February': '1',
  'March': '2',
  'April': '3',
  'May': '4',
  'June': '5',
  'July': '6',
  'August': '7',
  'September': '8',
  'October': '9',
  'November': '10',
  'December': '11',
};
function getPeriodName(month, year) {
  if (month === 'Annual') return
  const dateObject = new Date(year, months[month], 02)
  return dateObject.toISOString().split('T')[0];
}
getPeriodName.test = () => {
  console.assert(getPeriodName('January', '2019') === '2019-01-01', 'should be 2019-01-01')
  console.assert(getPeriodName('August', '2019') === '2019-08-01', 'should be 2019-08-31')
  console.assert(getPeriodName('Annual', '2019') === undefined, 'Annual should return undefined')
}

function createTransaction(tableName, transformFunction, rows) {
  const allTransactions = rows.map(row => {
    const body = createBigInsert(tableName, transformFunction, row)
    return ['BEGIN TRANSACTION;', ...body, 'COMMIT;']
  })
  return flatten(allTransactions)
}
createTransaction.test = function() {
  const exampleReturn = [{ seriesID: 'SMU13105000000000001',
    data: [ { 
      year: '2019',
      period: 'M07',
      periodName: 'July',
      latest: 'true',
      value: '62.3',
      calculations: {
        net_changes: {
          '12': '0.7'
        }
      }
    }, {
      year: '2019',
      period: 'M06',
      periodName: 'June',
      value: '62.6',
      calculations: {
        net_changes: {
          '12': '0.8'
        }
      }
    }, {
      year: '2019',
      period: 'M05',
      periodName: 'May',
      value: '63.1',
      calculations: {
        net_changes: {
          '12': '0.9'
        }
      }
    } ]
   }, { 
    seriesID: 'SMU01338600000000001',
    data: [ { 
      year: '2019',
      period: 'M07',
      periodName: 'July',
      latest: 'true',
      value: '62.3',
      calculations: {
        net_changes: {
          '12': '0.4'
        }
      }
    }, {
      year: '2019',
      period: 'M06',
      periodName: 'June',
      value: '62.6',
      calculations: {
        net_changes: {
          '12': '0.5'
        }
      }
    }, {
      year: '2019',
      period: 'M05',
      periodName: 'May',
      value: '63.1',
      calculations: {
        net_changes: {
          '12': '0.6'
        }
      }
    } ]
  }]
  const outputEmp = createTransaction('employment_data', val => multiply(getEmploymentValue(val), 1000), exampleReturn);
  console.assert(isEqual(outputEmp, [ 'BEGIN TRANSACTION;',
  'INSERT INTO employment_data (city_id, period, value) VALUES( "13105000000000001", "2019-07-01", "700" ) ON CONFLICT (city_id, period) DO UPDATE SET value=700, period="2019-07-01";',
  'INSERT INTO employment_data (city_id, period, value) VALUES( "13105000000000001", "2019-06-01", "800" ) ON CONFLICT (city_id, period) DO UPDATE SET value=800, period="2019-06-01";',
  'INSERT INTO employment_data (city_id, period, value) VALUES( "13105000000000001", "2019-05-01", "900" ) ON CONFLICT (city_id, period) DO UPDATE SET value=900, period="2019-05-01";',
  'COMMIT;',
  'BEGIN TRANSACTION;',
  'INSERT INTO employment_data (city_id, period, value) VALUES( "01338600000000001", "2019-07-01", "400" ) ON CONFLICT (city_id, period) DO UPDATE SET value=400, period="2019-07-01";',
  'INSERT INTO employment_data (city_id, period, value) VALUES( "01338600000000001", "2019-06-01", "500" ) ON CONFLICT (city_id, period) DO UPDATE SET value=500, period="2019-06-01";',
  'INSERT INTO employment_data (city_id, period, value) VALUES( "01338600000000001", "2019-05-01", "600" ) ON CONFLICT (city_id, period) DO UPDATE SET value=600, period="2019-05-01";',
  'COMMIT;' ]), 'should create employment transaction correctly')
  
  const outputRecov = createTransaction('recovery_data', (val, id) => calculateRecoveryPercentage(id, getRecoveryValue(val)), exampleReturn);
  console.assert(isEqual(outputRecov, [ 'BEGIN TRANSACTION;',
  'INSERT INTO recovery_data (city_id, period, value) VALUES( "13105000000000001", "2019-07-01", "-0.041538462" ) ON CONFLICT (city_id, period) DO UPDATE SET value=-0.041538462, period="2019-07-01";',
  'INSERT INTO recovery_data (city_id, period, value) VALUES( "13105000000000001", "2019-06-01", "-0.036923077" ) ON CONFLICT (city_id, period) DO UPDATE SET value=-0.036923077, period="2019-06-01";',
  'INSERT INTO recovery_data (city_id, period, value) VALUES( "13105000000000001", "2019-05-01", "-0.029230769" ) ON CONFLICT (city_id, period) DO UPDATE SET value=-0.029230769, period="2019-05-01";',
  'COMMIT;',
  'BEGIN TRANSACTION;',
  'INSERT INTO recovery_data (city_id, period, value) VALUES( "01338600000000001", "2019-07-01", "-0.646825397" ) ON CONFLICT (city_id, period) DO UPDATE SET value=-0.646825397, period="2019-07-01";',
  'INSERT INTO recovery_data (city_id, period, value) VALUES( "01338600000000001", "2019-06-01", "-0.645124717" ) ON CONFLICT (city_id, period) DO UPDATE SET value=-0.645124717, period="2019-06-01";',
  'INSERT INTO recovery_data (city_id, period, value) VALUES( "01338600000000001", "2019-05-01", "-0.642290249" ) ON CONFLICT (city_id, period) DO UPDATE SET value=-0.642290249, period="2019-05-01";',
  'COMMIT;' ]), 'should create recovery transaction correctly')
}

function getIdName(id) {
  const isUSA = id.startsWith('CES')
  if (isUSA) {
    return id
  }
  return id.slice(3)
}

function createBigInsert(tableName, transformFunction, row) {
  function createInsert(id, period, value) {
    return `INSERT INTO ${tableName} (city_id, period, value) VALUES( "${getIdName(id)}", "${period}", "${value}" ) ON CONFLICT (city_id, period) DO UPDATE SET value=${value}, period="${period}";`;
  }
  const valuesToAdd = row.data.map(datum => {
    const id = row.seriesID
    const period = getPeriodName(datum.periodName, datum.year)
    const value = transformFunction(datum, id)
    if (!period || period === 'NaN') return
    if (value === 'NaN') {
      throw new Error('Could not calculate a value for ' + id + ', period ' + period)
    }
    return createInsert(id, period, value )
  }).filter(xs => xs) // gets rid of empty values for when we couldn't calculate something
  return valuesToAdd;
}
createBigInsert.test = function() {
  const exampleReturn = { seriesID: 'SMU13105000000000001',
    data: [ { 
      year: '2019',
      period: 'M07',
      periodName: 'July',
      latest: 'true',
      value: '62.3',
      calculations: {
        net_changes: {
          '12': '0.7'
        }
      }
    }, {
      year: '2019',
      period: 'M06',
      periodName: 'June',
      value: '62.6',
      calculations: {
        net_changes: {
          '12': '0.7'
        }
      }
    }, {
      year: '2019',
      period: 'M05',
      periodName: 'May',
      value: '63.1',
      calculations: {
        net_changes: {
          '12': '0.7'
        }
      }
    } ]
  }
  const outputEmp = createBigInsert('employment_data', val => multiply(getEmploymentValue(val), 1000), exampleReturn);
  console.assert(isEqual(outputEmp, [ 'INSERT INTO employment_data (city_id, period, value) VALUES( "13105000000000001", "2019-07-01", "700" ) ON CONFLICT (city_id, period) DO UPDATE SET value=700, period="2019-07-01";',
  'INSERT INTO employment_data (city_id, period, value) VALUES( "13105000000000001", "2019-06-01", "700" ) ON CONFLICT (city_id, period) DO UPDATE SET value=700, period="2019-06-01";',
  'INSERT INTO employment_data (city_id, period, value) VALUES( "13105000000000001", "2019-05-01", "700" ) ON CONFLICT (city_id, period) DO UPDATE SET value=700, period="2019-05-01";' ]), 
  'employment insert should be created correctly')
 
  const outputRecov = createBigInsert('recovery_data', (val, id) => calculateRecoveryPercentage(id, getRecoveryValue(val)), exampleReturn);
  console.assert(isEqual(outputRecov, [ 'INSERT INTO recovery_data (city_id, period, value) VALUES( "13105000000000001", "2019-07-01", "-0.041538462" ) ON CONFLICT (city_id, period) DO UPDATE SET value=-0.041538462, period="2019-07-01";',
  'INSERT INTO recovery_data (city_id, period, value) VALUES( "13105000000000001", "2019-06-01", "-0.036923077" ) ON CONFLICT (city_id, period) DO UPDATE SET value=-0.036923077, period="2019-06-01";',
  'INSERT INTO recovery_data (city_id, period, value) VALUES( "13105000000000001", "2019-05-01", "-0.029230769" ) ON CONFLICT (city_id, period) DO UPDATE SET value=-0.029230769, period="2019-05-01";' ]), 
  'recovery insert should be created correctly')
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