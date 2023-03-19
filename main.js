const {
    getCoinPairs
} = require('./triFunctions')

let myCoinPairs = getCoinPairs().then(result => {
    console.log(result)
    console.log(result.length);
});


  