const flatten = require('lodash.flatten');
const isEqual = require('lodash.isequal');

module.exports = {
    getPeriodName,
    createBigInsert,
    createTransaction
}


function multiply(a, b) {
  const p = 100;
  return Math.round(Number(a) * Number(b) * p) / p;
}

function getEmploymentValue(row) {
  return row.calculations.net_changes[12]
}


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
    seriesID: 'SMU13115000000000001',
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
  const output = createTransaction('employment_data', val => multiply(getEmploymentValue(val), 1000), exampleReturn);
  console.assert(isEqual(output, [ 'BEGIN TRANSACTION;',
  'INSERT INTO employment_data (city_id, period, value) VALUES( "13105000000000001", "Jul-19", "700" ) ON CONFLICT (city_id, period) DO UPDATE SET value=700;',
  'INSERT INTO employment_data (city_id, period, value) VALUES( "13105000000000001", "Jun-19", "800" ) ON CONFLICT (city_id, period) DO UPDATE SET value=800;',
  'INSERT INTO employment_data (city_id, period, value) VALUES( "13105000000000001", "May-19", "900" ) ON CONFLICT (city_id, period) DO UPDATE SET value=900;',
  'COMMIT;',
  'BEGIN TRANSACTION;',
  'INSERT INTO employment_data (city_id, period, value) VALUES( "13115000000000001", "Jul-19", "400" ) ON CONFLICT (city_id, period) DO UPDATE SET value=400;',
  'INSERT INTO employment_data (city_id, period, value) VALUES( "13115000000000001", "Jun-19", "500" ) ON CONFLICT (city_id, period) DO UPDATE SET value=500;',
  'INSERT INTO employment_data (city_id, period, value) VALUES( "13115000000000001", "May-19", "600" ) ON CONFLICT (city_id, period) DO UPDATE SET value=600;',
  'COMMIT;' ]), 'should create transaction correctly')
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
    return createInsert(row.seriesID, getPeriodName(datum.periodName, datum.year), transformFunction(datum) )
  })
  const statement = valuesToAdd.join('\n\n')
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
  const output = createBigInsert('employment_data', val => multiply(getEmploymentValue(val), 1000), exampleReturn);
  console.assert(isEqual(output, [ 'INSERT INTO employment_data (city_id, period, value) VALUES( "13105000000000001", "Jul-19", "700" ) ON CONFLICT (city_id, period) DO UPDATE SET value=700;',
  'INSERT INTO employment_data (city_id, period, value) VALUES( "13105000000000001", "Jun-19", "700" ) ON CONFLICT (city_id, period) DO UPDATE SET value=700;',
  'INSERT INTO employment_data (city_id, period, value) VALUES( "13105000000000001", "May-19", "700" ) ON CONFLICT (city_id, period) DO UPDATE SET value=700;' ]), 
  'insert should be created correctly')
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