const flatten = require('lodash.flatten');
const isEqual = require('lodash.isequal');
const originalRecoveryMap = require('./initialRecessionJobsCount')
const missingRecessionData = []

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

function getPeriodName(month, year) {
  return `${month.slice(0,3)}-${year.slice(-2)}`
}
getPeriodName.test = () => {
  console.assert(getPeriodName('August', '2019') === 'Aug-19', 'should be Aug-19')
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
  'INSERT INTO employment_data (city_id, period, value) VALUES( "13105000000000001", "Jul-19", "700" ) ON CONFLICT (city_id, period) DO UPDATE SET value=700;',
  'INSERT INTO employment_data (city_id, period, value) VALUES( "13105000000000001", "Jun-19", "800" ) ON CONFLICT (city_id, period) DO UPDATE SET value=800;',
  'INSERT INTO employment_data (city_id, period, value) VALUES( "13105000000000001", "May-19", "900" ) ON CONFLICT (city_id, period) DO UPDATE SET value=900;',
  'COMMIT;',
  'BEGIN TRANSACTION;',
  'INSERT INTO employment_data (city_id, period, value) VALUES( "01338600000000001", "Jul-19", "400" ) ON CONFLICT (city_id, period) DO UPDATE SET value=400;',
  'INSERT INTO employment_data (city_id, period, value) VALUES( "01338600000000001", "Jun-19", "500" ) ON CONFLICT (city_id, period) DO UPDATE SET value=500;',
  'INSERT INTO employment_data (city_id, period, value) VALUES( "01338600000000001", "May-19", "600" ) ON CONFLICT (city_id, period) DO UPDATE SET value=600;',
  'COMMIT;' ]), 'should create employment transaction correctly')
  
  const outputRecov = createTransaction('recovery_data', (val, id) => calculateRecoveryPercentage(id, getRecoveryValue(val)), exampleReturn);
  console.assert(isEqual(outputRecov, [ 'BEGIN TRANSACTION;',
  'INSERT INTO recovery_data (city_id, period, value) VALUES( "13105000000000001", "Jul-19", "-0.041538462" ) ON CONFLICT (city_id, period) DO UPDATE SET value=-0.041538462;',
  'INSERT INTO recovery_data (city_id, period, value) VALUES( "13105000000000001", "Jun-19", "-0.036923077" ) ON CONFLICT (city_id, period) DO UPDATE SET value=-0.036923077;',
  'INSERT INTO recovery_data (city_id, period, value) VALUES( "13105000000000001", "May-19", "-0.029230769" ) ON CONFLICT (city_id, period) DO UPDATE SET value=-0.029230769;',
  'COMMIT;',
  'BEGIN TRANSACTION;',
  'INSERT INTO recovery_data (city_id, period, value) VALUES( "01338600000000001", "Jul-19", "-0.646825397" ) ON CONFLICT (city_id, period) DO UPDATE SET value=-0.646825397;',
  'INSERT INTO recovery_data (city_id, period, value) VALUES( "01338600000000001", "Jun-19", "-0.645124717" ) ON CONFLICT (city_id, period) DO UPDATE SET value=-0.645124717;',
  'INSERT INTO recovery_data (city_id, period, value) VALUES( "01338600000000001", "May-19", "-0.642290249" ) ON CONFLICT (city_id, period) DO UPDATE SET value=-0.642290249;',
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

    return `INSERT INTO ${tableName} (city_id, period, value) VALUES( "${getIdName(id)}", "${period}", "${value}" ) ON CONFLICT (city_id, period) DO UPDATE SET value=${value};`;
  }
  const valuesToAdd = row.data.map(datum => {
    const id = row.seriesID
    const period = getPeriodName(datum.periodName, datum.year)
    const value = transformFunction(datum, id)
    if (!value || value === 'NaN') {
      return;
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
  console.assert(isEqual(outputEmp, [ 'INSERT INTO employment_data (city_id, period, value) VALUES( "13105000000000001", "Jul-19", "700" ) ON CONFLICT (city_id, period) DO UPDATE SET value=700;',
  'INSERT INTO employment_data (city_id, period, value) VALUES( "13105000000000001", "Jun-19", "700" ) ON CONFLICT (city_id, period) DO UPDATE SET value=700;',
  'INSERT INTO employment_data (city_id, period, value) VALUES( "13105000000000001", "May-19", "700" ) ON CONFLICT (city_id, period) DO UPDATE SET value=700;' ]), 
  'employment insert should be created correctly')
 
  const outputRecov = createBigInsert('recovery_data', (val, id) => calculateRecoveryPercentage(id, getRecoveryValue(val)), exampleReturn);
  console.assert(isEqual(outputRecov, [ 'INSERT INTO recovery_data (city_id, period, value) VALUES( "13105000000000001", "Jul-19", "-0.041538462" ) ON CONFLICT (city_id, period) DO UPDATE SET value=-0.041538462;',
  'INSERT INTO recovery_data (city_id, period, value) VALUES( "13105000000000001", "Jun-19", "-0.036923077" ) ON CONFLICT (city_id, period) DO UPDATE SET value=-0.036923077;',
  'INSERT INTO recovery_data (city_id, period, value) VALUES( "13105000000000001", "May-19", "-0.029230769" ) ON CONFLICT (city_id, period) DO UPDATE SET value=-0.029230769;' ]), 
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