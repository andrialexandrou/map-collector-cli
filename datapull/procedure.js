const retrieve = require('./retrieve-from-bls');
const store = require('./store');

module.exports = argv => {
    return retrieve.employment(argv)
        .then(store.employment)
        .then(res => {
            console.log('Completing Employment Pull')
            console.log(res)
        })
        .then( () => retrieve.recovery(argv))
        .then(store.recovery)
        .then(res => {
            console.log('Completing Recovery Pull')
            console.log(res)
        })
        .catch( err => {
            console.log('Catch from Datapull during pull or storing.')
            throw new Error(err)
        })
}