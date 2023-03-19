const {SpotClientV3} = require('bybit-api')
//api user info remember to hide later
const API_KEY = 'WMTy0NWg8tJinG1zy0';
const API_SECRET = 'U9S0ddY4cBqzuOCcBo7gcryJQpAp3dlD7Qhb';
const useTestnet = true;
//establish api connection
let client = new SpotClientV3({
    key: API_KEY,
    secret: API_SECRET,
    testnet: useTestnet,
    strict_param_validation: true,
    baseUrl:"https://api-testnet.bybit.com",
    },
)

//get pairs array 
const getCoinPairs = async() =>{
    let coinPairs = [];
    await client.getSymbols()
      .then(result => {

        let symbols = result.result.list;
        coinPairs = symbols.map(symbol => symbol.name);
      })
      .catch(err => {
        console.error("getOrderBook error: ", err);
      });
    return coinPairs;
}

module.exports ={
    getCoinPairs
}