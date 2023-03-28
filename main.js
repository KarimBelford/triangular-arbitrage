const fs = require('fs')
const {
    getTriangularPairs,
    getPairPrices,
    getMarketPrices,
    calcSurfaceArb,
    getOrderBookData
} = require('./triFunctions')

const logPairs = async () => {
    let getTriPairs = await getTriangularPairs()
    const jsonString = JSON.stringify(getTriPairs);
  
    // Create a new filename based on the current timestamp
    const filename = `arbitragePairs.json`;
  
    // Delete the previous file with the same name, if it exists
    fs.unlink(filename, (err) => {
      if (err && err.code !== 'ENOENT') {
        console.error(err);
      } else {
        // Write the JSON string to a file with the new filename
        fs.writeFile(filename, jsonString, (err) => {
          if (err) {
            console.error(err);
          } else {
            console.log(`Output written to file ${filename} successfully.`);
          }
        });
      }
    });
}

const readJsonFile = (filename) => {
    return new Promise((resolve, reject) => {
      fs.readFile(filename, 'utf8', (err, data) => {
        if (err) {
          reject(err);
        } else {
          try {
            const obj = JSON.parse(data);
            resolve(obj);
          } catch (err) {
            reject(err);
          }
        }
      });
    });
  };
  
const surfaceArbInfo = async() => {

    let structuredPairs = await readJsonFile('./arbitragePairs.json')

    const priceData = await getMarketPrices()
   
    let structuredPrices = {}
    for(const key in structuredPairs){
      
        let pricesDict = await getPairPrices(structuredPairs[key],priceData)
        
        if(pricesDict!==0){
          structuredPrices[key] = pricesDict
          let surfaceArb = await calcSurfaceArb(structuredPairs[key],pricesDict)
          let count = 0
          
          if(surfaceArb!==0){
           
            const realRateData = await getOrderBookData(surfaceArb)
            console.log(realRateData)
            
          }
        
        }
    }
    
}

const main = async() => {
  // Run logPairs() once every hour (3600 seconds)
  setInterval(logPairs, 3600000);

  // Run surfaceArbInfo() once every minute (60 seconds)
  setInterval(surfaceArbInfo, 60000);

  setTimeout(() => {
    clearInterval(logPairsInterval);
    clearInterval(surfaceArbInterval);
    console.log('Intervals stopped after 24 hours');
  }, 86400000);
}

main();