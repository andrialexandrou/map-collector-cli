const fs = require( 'fs' );
var path = require('path');
const blsSecrets = require( '../secrets/bls-keys.json' );

const configPath = path.join(__dirname, '../secrets/bls-keys.json')

module.exports = class ApiKey {
  constructor() {
    this.currentKey = ''

    this.keys = []
    this.expired = false
    this.init();
  }

  cycleKeys() {
    this.index = ( this.index + 1 ) % 7
    this.currentKey = this.keys[ this.index ];

    const newObject = Object.assign({}, blsSecrets, {
      index: this.index
    })

    fs.writeFile(
      configPath, 
      JSON.stringify( newObject, null, 2 ), 
      'utf8', 
      err => {
        if ( err ) console.log( err )
      }
    )
  }

  get() {
    if ( this.expired ) {
      this.cycleKeys();
      this.expired = false;
    }
    return this.currentKey;
  }

  init() {
    this.keys = blsSecrets.keys.map( obj => obj.key );
    this.index = blsSecrets.index;
    this.currentKey = this.keys[ this.index ]
  }

  expire() {
    this.expired = true;
  }
};
