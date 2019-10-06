const fs = require('fs');
const Path = require('path');
const stringify = require('csv-stringify');
const sqlite3 = require('sqlite3').verbose();

module.exports = {
  getPeriodName
}

const months = {
  '0': 'Jan',
  '1': 'Feb',
  '2': 'Mar',
  '3': 'Apr',
  '4': 'May',
  '5': 'Jun',
  '6': 'Jul',
  '7': 'Aug',
  '8': 'Sep',
  '9': 'Oct',
  '10': 'Nov',
  '11': 'Dec',
};

function getPeriodName(dateObj) {
  const obj = new Date(dateObj)
  // specifically for date interpretation on some Operating Systems
  // who interpet the 1st of the month as the previous day,
  // return a value that seems like the previous month
  obj.setDate(15)
  const month = months[obj.getMonth()]
  const year = obj.getFullYear().toString().slice(-2)
  return `${month}-${year}`
}
getPeriodName.test = function() {
  console.assert(getPeriodName('1999-01-03') === 'Jan-99', 'assert its Jan-99')
  console.assert(getPeriodName('2018-04-01') === 'Apr-18', 'assert its Apr-18')
  console.assert(getPeriodName('2007-01-25') === 'Jan-07', 'assert its Jan-07')
}

let db = new sqlite3.Database('./data/bls.db', sqlite3.OPEN_READWRITE, err => {
  if (err) console.error(err.message);
});

function writeToFile(fileName, data) {
  const filePath = Path.join(__dirname, `${fileName}.csv`)
  console.log('Writing to file', filePath)
  stringify(data, { header: true }, function(err, csvString) {
    fs.writeFileSync(filePath, csvString, function(err) {
      if (err) {
        throw new Error(`Error writing to file [${fileName}.csv]`);
      }
    });
  });
}

function flattenAndSave(filename, data) {
  const list = Object.keys(data).map(id => {
    return data[id];
  });
  list.forEach(city => {
    delete city.id;
    delete city.period;
    delete city.city_id;
  });
  writeToFile(filename, list);
}

if (process.env.NODE_ENV !== 'test') {
  db.parallelize(() => {
    const citiesEmployment = {};
    const citiesRecovery = {};
    db.each(
      'SELECT * FROM employment_data JOIN cities WHERE employment_data.city_id=cities.id ORDER BY date(period);',
      (err, row) => {
        if (citiesEmployment[row.city_id]) {
        } else {
          citiesEmployment[row.city_id] = row;
        }
        const period = getPeriodName(row.period)
        citiesEmployment[row.city_id][period] = row.value;
        delete citiesEmployment[row.city_id].value;
      },
      complete => {
        flattenAndSave('employment', citiesEmployment);
      }
      );
      
      db.each(
        'SELECT * FROM recovery_data JOIN cities WHERE recovery_data.city_id=cities.id ORDER BY date(period);',
        (err, row) => {
          if (citiesRecovery[row.city_id]) {
          } else {
            citiesRecovery[row.city_id] = row;
          }
          const period = getPeriodName(row.period)
          citiesRecovery[row.city_id][period] = row.value;
          delete citiesRecovery[row.city_id].value;
        },
        complete => {
          flattenAndSave('recovery', citiesRecovery);
        }
    );
  });  
}

db.close(err => {
  if (err) console.error(err.message);
});


if (process.env.NODE_ENV === 'test') {
  const functions = Object.keys(module.exports);
  functions.forEach(fn => {
    const thisFn = module.exports[fn];
    if (thisFn.test) {
      thisFn.test();
    }
  });
}