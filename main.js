const {
    getCoinPairs,
    getTriangularPairs
} = require('./triFunctions')


const main = async() => {
    let myCoinPairs = await getCoinPairs()
    let triangularPairs = getTriangularPairs(myCoinPairs)

}

main()
  