/* node app */
const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;

module.exports = function() {
  app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept'
    );
    next();
  });

  app.get('/', function(req, res) {
    res.status(200).send('OK');
  });

  app.get('/jobs/recovery', function(req, res) {
    res.download('./data/recovery.csv', 'jobs.csv');
  });

  app.get('/jobs/employment', function(req, res) {
    res.download('./data/employment.csv', 'jobs.csv');
  });

  app.listen(PORT, function() {
    console.log(`TIP Data Collector is running on port ${PORT}`);
  });
};
