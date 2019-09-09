const fs = require('fs');
const stringify = require('csv-stringify');
const sqlite3 = require('sqlite3').verbose();

let db = new sqlite3.Database('./data/bls.db', sqlite3.OPEN_READWRITE, err => {
  if (err) console.error(err.message);
});

function writeToFile(fileName, data) {
  stringify(data, { header: true }, function(err, csvString) {
    fs.writeFileSync(`./data/${fileName}.csv`, csvString, function(err) {
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

db.parallelize(() => {
  const citiesEmployment = {};
  const citiesRecovery = {};
  db.each(
    'SELECT * FROM employment_data JOIN cities WHERE employment_data.city_id=cities.id ORDER BY date(employment_data.period);',
    (err, row) => {
      if (citiesEmployment[row.city_id]) {
      } else {
        citiesEmployment[row.city_id] = row;
      }
      citiesEmployment[row.city_id][row.period] = row.value;
      delete citiesEmployment[row.city_id].value;
    },
    complete => {
      flattenAndSave('employment', citiesEmployment);
    }
  );

  db.each(
    'SELECT * FROM recovery_data JOIN cities WHERE recovery_data.city_id=cities.id ORDER BY date(recovery_data.period);',
    (err, row) => {
      if (citiesRecovery[row.city_id]) {
      } else {
        citiesRecovery[row.city_id] = row;
      }
      citiesRecovery[row.city_id][row.period] = row.value;
      delete citiesRecovery[row.city_id].value;
    },
    complete => {
      flattenAndSave('recovery', citiesRecovery);
    }
  );
});

db.close(err => {
  if (err) console.error(err.message);
});
