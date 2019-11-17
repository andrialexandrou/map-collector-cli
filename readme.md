# Map Collector Command Line Interface

This project is for TIP Strategies. It pulls recent data from BLS for their map web visualization.

## Usage

### Running the Application

``` bash
npm run datapull -- --year 2019
npm run export
```

### Adding a city
> Prerequisite: Have sqlite interface set up on your local machine

in your sqlite terminal:
```sql
INSERT INTO cities (id, lat, lon, name) VALUES ('234540000092', '123', '456', 'Example City, TN');
```
Note: the `id` value should be stripped of its 3-character non-numeric prefix. We add those on request to get relevant data from BLS. You will need to find the latitude and longitude from another service.

### Sharing data with someone else to run the program
```bash
git add .
git commit -m "feat: Add data for <this month> <this year>"
git push origin master
```

### Testing the Application
```bash
npm run test
```

## Administration

### Version Update

We are currently handling updates only through git versioning.

To update to the lastest:
```bash
git checkout master
git fetch
git reset --hard origin/master
```

### API Keys
We use Version 2.0 of the BLS API. The Bureau of Labor Statistics expires keys on an annual basis. This will require re-registering for new keys every year. When the time comes, refer to the documented keys in your `secrets/bls-keys.json` file and edit all or some of the keys as desired.

If collaborating with another person, communicate the change as needed.

[Link to the BLS Registration engine can be found here.](https://data.bls.gov/registrationEngine/)

File structure for adding your own keys:
```json
{
  "keys": [
    {
      "name": "your-email+some-reference-1@gmail.com",
      "key": "abcxxxxxxxxxxxxxxxxxxxxxxxxxx123"
    },
    {
      "name": "your-email+some-reference-2@gmail.com",
      "key": "abcxxxxxxxxxxxxxxxxxxxxxxxxxx123"
    },
    {
      "name": "your-email+some-reference-3@gmail.com",
      "key": "abcxxxxxxxxxxxxxxxxxxxxxxxxxx123"
    },
    {
      "name": "your-email+some-reference-4@gmail.com",
      "key": "abcxxxxxxxxxxxxxxxxxxxxxxxxxx123"
    },
    {
      "name": "your-email+some-reference-5@gmail.com",
      "key": "abcxxxxxxxxxxxxxxxxxxxxxxxxxx123"
    }
  ],
  "index": 0
}
```

## Development

**Prerequisites**
- Node v8 (installation recommended through `nvm`)
- npm
- git

### Getting Started

```bash
npm install
```

This program will depend on some secrets. Get those from an available party and store in `secrets/bls-keys.json`.

### Troubleshooting the data stored locally

`sqlite3 data/bls.db`
```sql
.tables
SELECT * FROM <table> WHERE period LIKE "2019%"
SELECT * FROM <table> WHERE city_id="<some-id>"
.exit
```
#### Running Migrations

Nothing is instrumented right now, however for the migration process from a previous iteration of this application we retained a way to programmatically migrate old data. Take a look in the `data/migrations` folder for some optional migration behavior.



### Tools

Architectural choices are as follows:


- **User Interface**: CLI with the assistance of [yargs](https://github.com/yargs/yargs) library
- **Data Storage**: SQLite
- **Data Request**: HTTP API Rest endpoints in Node.js from BLS
- **Data Reading**: Exporting as CSV on disk where program is executed. File location is printed on save.