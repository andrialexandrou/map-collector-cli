/* libraries */
const fs = require('fs');
const parse = require('csv-parse');
const stringify = require('csv-stringify');

/* internal documents */
const seriesToCitiesMap = require('../data/seriesToCitiesMap.json');
const originalRecessionValues = require('../data/initialRecessionJobsCount.json');

/* module behavior */

/* utils */
function findCityName(id) {
  if (id.includes('CES')) {
    return seriesToCitiesMap[id];
  }
  const numericId = id.replace(/[A-Za-z]/g, '');
  return seriesToCitiesMap[numericId];
}

function createColumnHeader(month, year) {
  return `${month.substring(0, 3)}-${year.substring(2)}`;
}

function writeToFile(fileName, data) {
  stringify(data, { header: true }, function(err, csvString) {
    fs.writeFileSync(`./data/${fileName}.csv`, csvString, function(err) {
      if (err) {
        throw new Error(`Error writing to file [${fileName}.csv]`);
      }
    });
  });
}

function readFileAndParse(filename, callback) {
  const fileData = fs.readFileSync(`./data/${filename}.csv`);
  return parse(fileData, { columns: true, trim: true }, callback);
}

/*
Data transformations in CSV files
 */
function calculateRecoveryPercentage(original, current) {
  const calculatedValue = Number(current) / Number(original) - 1;
  return calculatedValue.toFixed(9); // to mimic precision of excel documents
}

function calculateUSARecoveryShare(original, current) {
  const calculatedValue = Number(current) / Number(original);
  return calculatedValue.toFixed(9); // to mimic precision of excel documents
}

function multiply(a, b) {
  const p = 100;
  return Math.round(Number(a) * Number(b) * p) / p;
}

function transformEmploymentCalculatedAnnualValue(currentPeriodData) {
  const measure = currentPeriodData.calculations['net_changes']['12'];
  return multiply(measure, 1000);
}

module.exports = {
  recovery: function(fullDataSet) {
    /*
    Meat of the module
      - determines where most recent data would go
      - forms appropriate column with data transformations from raw API value
      - saves to CSV file
     */
    function formCurrentPeriodColumnFromJson(dataSet) {
      const validDataResult = dataSet.find(
        dataResult => dataResult.data.length > 0
      ).data[0];
      const currentMonth = validDataResult.periodName;
      const currentYear = validDataResult.year;
      const header = createColumnHeader(currentMonth, currentYear);

      return dataSet.reduce((builtArray, city) => {
        const cityName = findCityName(city.seriesID);
        const originalRecessionBaseline = originalRecessionValues[cityName];
        if (originalRecessionBaseline) {
          const originalRecessionValue = originalRecessionBaseline.value;
          const currentJobsValue = city.data[0].value;
          return builtArray.concat({
            header,
            cityName,
            value: city.seriesID.includes('CES')
              ? calculateUSARecoveryShare(
                  originalRecessionValue,
                  currentJobsValue
                )
              : calculateRecoveryPercentage(
                  originalRecessionValue,
                  currentJobsValue
                )
          });
        } else {
          return builtArray;
        }
      }, []);
    }

    readFileAndParse('recovery', function(err, csvFileData) {
      if (err) console.error(err);
      const currentPeriodColumnWithValues = formCurrentPeriodColumnFromJson(
        fullDataSet
      );

      /*
       Add new data to the CSV file from last month
       Note: order sensitive. Last data saved to object <newCsvFileData> will be right-most on CSV
      */
      const newCsvFileData = csvFileData.map(city => {
        const currentPeriodData = currentPeriodColumnWithValues.find(
          mappedCity => mappedCity.cityName === city.CITY
        );
        if (currentPeriodData) {
          city[currentPeriodData.header] = currentPeriodData.value;
        }
        return city;
      });

      writeToFile('recovery', newCsvFileData);
      console.log('Completing BLS Recovery statistics pull.');
    });
  },
  employment: function(fullDataSet) {
    /*
     Meat of the module
     - determines where most recent data would go
     - forms appropriate column with data transformations from raw API value
     - saves to CSV file
     */
    function formCurrentPeriodColumnFromJson(dataSet) {
      const currentMonth = dataSet[0].data[0].periodName;
      const currentYear = dataSet[0].data[0].year;
      const header = createColumnHeader(currentMonth, currentYear);

      return dataSet.reduce((builtArray, city) => {
        const cityName = findCityName(city.seriesID);
        const currentPeriodData = city.data[0];
        return builtArray.concat({
          header,
          cityName,
          value: transformEmploymentCalculatedAnnualValue(currentPeriodData)
        });
      }, []);
    }

    readFileAndParse('employment', function(err, csvFileData) {
      if (err) console.error(err);
      const currentPeriodColumnWithValues = formCurrentPeriodColumnFromJson(
        fullDataSet
      );

      /*
       Add new data to the CSV file from last month
       Note: order sensitive. Last data saved to object <newCsvFileData> will be right-most on CSV
       */
      const newCsvFileData = csvFileData.map(city => {
        const currentPeriodData = currentPeriodColumnWithValues.find(
          mappedCity => mappedCity.cityName === city.CITY
        );
        if (currentPeriodData) {
          city[currentPeriodData.header] = currentPeriodData.value;
        }
        return city;
      });

      writeToFile('employment', newCsvFileData);
      console.log('Completing BLS Employment statistics pull.');
    });
  }
};
