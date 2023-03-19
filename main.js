const fs = require('fs')
const {
    getCoinPairs,
    getTriangularPairs
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
  
logPairs();
  
const main = async() => {
    let myCoinPairs = await getCoinPairs()
    let triangularPairs = getTriangularPairs()

}

main()
  