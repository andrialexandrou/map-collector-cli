db.serialize(() => {
  // db.serialize(() => {
  db.all(
    'select * from employment_data where period like "%-01"',
    (err, rows) => {
      if (err) console.error(err.message);
      // console.log('row', row)
      rows.forEach(row => {
        const newPeriod = row.period.slice(0, 8) + '15';
        obj[row.period] = newPeriod;
        console.log('now');
      });
      db.parallelize(() => {
        Object.keys(obj).forEach(key => {
          // console.log('this one')
          const oldPeriod = key;
          const newPeriod = obj[key];
          const newScript = `update employment_data set period = "${newPeriod}" where period like "${oldPeriod}"`;
          // console.log('newScript', newScript)
          db.run(newScript, err => {
            if (err) {
              console.log('err', err);
            }
          });
        });
      });
    }
  );
  // })
});
// db.close(err => {
//   if (err) console.error(err.message);
// });
